import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) {
		throw redirect(303, '/chat');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!fullName || !email || !password || !confirmPassword) {
			return fail(400, { error: 'Please fill out all fields on the card.', email, fullName });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match. Please re-enter.', email, fullName });
		}

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: fullName
				}
			}
		});

		if (error) {
			let message = 'This card could not be filed.';
			if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
				message = 'This card already exists — try signing in instead.';
			} else if (error.message.toLowerCase().includes('weak')) {
				message = 'The password is too weak for the archives (minimum 6 characters).';
			} else {
				message += ' ' + error.message;
			}
			return fail(400, { error: message, email, fullName });
		}

		throw redirect(303, '/login?registered=true');
	}
};
