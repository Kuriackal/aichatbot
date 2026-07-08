import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';
import { generateEmbedding } from '$lib/server/openai';

export const PUT: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { id } = event.params;
		const { question, answer } = await event.request.json();

		if (!question || !answer) {
			return json({ error: 'Question and answer are required' }, { status: 400 });
		}

		const contentToEmbed = `Question: ${question}\nAnswer: ${answer}`;
		const embedding = await generateEmbedding(contentToEmbed);

		const { data: qaPair, error } = await supabaseAdmin
			.from('qa_pairs')
			.update({
				question,
				answer,
				embedding,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating QA pair:', error);
			return json({ error: 'Failed to update Q&A pair' }, { status: 500 });
		}

		return json({ success: true, qaPair });
	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { id } = event.params;

		const { error } = await supabaseAdmin
			.from('qa_pairs')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting QA pair:', error);
			return json({ error: 'Failed to delete Q&A pair' }, { status: 500 });
		}

		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
