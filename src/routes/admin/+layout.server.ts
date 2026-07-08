import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { session, profile } = await parent();
	if (!session) {
		throw redirect(303, '/login');
	}
	if (profile?.role !== 'admin') {
		throw redirect(303, '/chat');
	}
	return {};
};
