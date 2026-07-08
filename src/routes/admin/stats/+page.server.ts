import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { count: usersCount } = await locals.supabase.from('profiles').select('*', { count: 'exact', head: true });
	const { count: docsCount } = await locals.supabase.from('documents').select('*', { count: 'exact', head: true });
	const { count: convCount } = await locals.supabase.from('conversations').select('*', { count: 'exact', head: true });

	return {
		stats: {
			users: usersCount || 0,
			documents: docsCount || 0,
			conversations: convCount || 0
		}
	};
};
