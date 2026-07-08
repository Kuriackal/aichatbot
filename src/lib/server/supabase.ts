import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.warn('Supabase service role keys are missing');
}

// Service role client bypasses RLS, use ONLY on the server for admin tasks like ingestion
export const supabaseAdmin = createClient(
	SUPABASE_URL || 'dummy', 
	SUPABASE_SERVICE_ROLE_KEY || 'dummy', 
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
