import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';

export const GET: RequestHandler = async (event) => {
	try {
		const session = await requireAuth(event);
		
		const { data, error } = await supabaseAdmin
			.from('conversations')
			.select('*')
			.eq('user_id', session.user.id)
			.order('updated_at', { ascending: false });

		if (error) throw error;

		return json({ conversations: data });
	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
    try {
        const session = await requireAuth(event);
        const url = new URL(event.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return json({ error: 'Missing id param' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) throw error;

        return json({ success: true });
    } catch (e: any) {
        return json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
