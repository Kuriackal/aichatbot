import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';
import { generateEmbedding } from '$lib/server/openai';

export const POST: RequestHandler = async (event) => {
	try {
		const session = await requireAdmin(event);
		
		const { question, answer } = await event.request.json();
		
		if (!question || !answer) {
			return json({ error: 'Question and answer are required' }, { status: 400 });
		}


		const contentToEmbed = `Question: ${question}\nAnswer: ${answer}`;
		const embedding = await generateEmbedding(contentToEmbed);


		const { data: qaPair, error } = await supabaseAdmin
			.from('qa_pairs')
			.insert({
				question,
				answer,
				embedding,
				uploader_id: session.user.id
			})
			.select()
			.single();

		if (error || !qaPair) {
			console.error('Error inserting QA pair:', error);
			return json({ error: 'Failed to save Q&A pair' }, { status: 500 });
		}

		return json({ success: true, qaPair });
	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
