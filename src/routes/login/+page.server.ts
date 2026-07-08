import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) {
		throw redirect(303, '/chat');
	}
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Please provide both email and password.', email });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			// Archive thematic error messages
			let message = 'This card could not be retrieved. Check your credentials.';
			if (error.message.includes('Invalid login credentials')) {
				message = 'No matching record found in the archives for these credentials.';
			}
			return fail(400, { error: message, email });
		}

		throw redirect(303, '/chat');
	},
	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		throw redirect(303, '/login');
	}
};
