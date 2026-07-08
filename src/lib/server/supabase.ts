import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
	console.warn('Supabase service role keys are missing');
}


export const supabaseAdmin = createClient(
	env.SUPABASE_URL || 'dummy', 
	env.SUPABASE_SERVICE_ROLE_KEY || 'dummy', 
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
