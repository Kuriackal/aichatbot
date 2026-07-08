import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	if (!user) {
		throw redirect(303, '/login');
	}
	
	const { data: conversations } = await locals.supabase
		.from('conversations')
		.select('*')
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false });

	return { conversations: conversations || [] };
};
