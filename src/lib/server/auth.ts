import type { RequestEvent } from '@sveltejs/kit';

export async function requireAuth(event: RequestEvent) {
	const session = await event.locals.safeGetSession();
	if (!session || !session.session) {
		throw new Error('Unauthorized');
	}
	return session.session;
}

export async function requireAdmin(event: RequestEvent) {
	const session = await requireAuth(event);
	
	const { data, error } = await event.locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (error || data?.role !== 'admin') {
		throw new Error('Forbidden: Admins only');
	}
	
	return session;
}
