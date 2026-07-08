import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: documents } = await locals.supabase
		.from('documents')
		.select('*, profiles(email)')
		.order('created_at', { ascending: false });

	const { data: qaPairs } = await locals.supabase
		.from('qa_pairs')
		.select('*, profiles(email)')
		.order('created_at', { ascending: false });

	return { documents, qaPairs };
};
