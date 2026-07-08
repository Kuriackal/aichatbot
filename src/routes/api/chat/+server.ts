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

		// Ensure conversation exists
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

		const chunks = await retrieveChunks(userMessage.content);
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
