import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: messages } = await locals.supabase
		.from('messages')
		.select('*')
		.eq('conversation_id', params.conversationId)
		.order('created_at', { ascending: true });

	return { messages: messages || [], conversationId: params.conversationId };
};
