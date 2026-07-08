import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { retrieveChunks, buildSystemPrompt } from '$lib/server/rag';
import { openai, CHAT_MODEL } from '$lib/server/openai';
import { supabaseAdmin } from '$lib/server/supabase';

export const POST: RequestHandler = async (event) => {
	try {
		const session = await requireAuth(event);
		const { messages, conversationId } = await event.request.json();

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return json({ error: 'Invalid messages array' }, { status: 400 });
		}

		const userMessage = messages[messages.length - 1];
		if (userMessage.role !== 'user') {
			return json({ error: 'Last message must be from user' }, { status: 400 });
		}


		let cid = conversationId;
		if (!cid) {
			const { data: conv, error: convError } = await supabaseAdmin
				.from('conversations')
				.insert({ user_id: session.user.id, title: userMessage.content.slice(0, 50) })
				.select()
				.single();
			
			if (convError || !conv) throw new Error('Failed to create conversation');
			cid = conv.id;
		}

		// --- QUERY EXPANSION ---
		// Rewrite short queries and resolve follow-up pronouns using the chat history
		let searchQuery = userMessage.content;
		try {
			const queryExpansionRes = await openai.chat.completions.create({
				model: CHAT_MODEL,
				messages: [
					{ 
						role: 'system', 
						content: 'You are a search query optimizer. Given the user\'s latest message and the conversation history, rewrite the user\'s message into a rich, descriptive search query to find relevant information in a vector database. Resolve any pronouns (e.g., "it", "they") to their actual subjects. Add relevant synonyms or intent keywords. Do not answer the question. JUST output the expanded search query text and nothing else.' 
					},
					...messages.map((m: any) => ({ role: m.role, content: m.content }))
				],
				temperature: 0.3
			});
			searchQuery = queryExpansionRes.choices[0]?.message?.content?.trim() || userMessage.content;

		} catch (err) {
			console.error("Query expansion failed, falling back to original query", err);
		}

		const chunks = await retrieveChunks(searchQuery);
		const systemPrompt = buildSystemPrompt(chunks);

		const openaiMessages = [
			{ role: 'system', content: systemPrompt },
			...messages.map((m: any) => ({ role: m.role, content: m.content }))
		];

		await supabaseAdmin.from('messages').insert({
			conversation_id: cid,
			role: 'user',
			content: userMessage.content
		});

		const response = await openai.chat.completions.create({
			model: CHAT_MODEL,
			messages: openaiMessages as any,
			stream: true
		});

		const stream = new ReadableStream({
			async start(controller) {
				let fullResponse = '';
				try {
					for await (const chunk of response) {
						const content = chunk.choices[0]?.delta?.content || '';
						fullResponse += content;
						controller.enqueue(new TextEncoder().encode(content));
					}
					
					await supabaseAdmin.from('messages').insert({
						conversation_id: cid,
						role: 'assistant',
						content: fullResponse,
						used_chunks: chunks
					});

					await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', cid);
					
					controller.close();
				} catch (err) {
					console.error('Streaming error', err);
					controller.error(err);
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'X-Conversation-Id': cid
			}
		});

	} catch (e: any) {
		console.error('Chat error:', e);
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
