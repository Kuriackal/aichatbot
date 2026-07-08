import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';

export const DELETE: RequestHandler = async (event) => {
	try {
		await requireAdmin(event);
		const { id } = event.params;

		const { data: doc, error: fetchError } = await supabaseAdmin
			.from('documents')
			.select('file_path')
			.eq('id', id)
			.single();

		if (fetchError || !doc) {
			return json({ error: 'Document not found' }, { status: 404 });
		}

		await supabaseAdmin.storage.from('documents').remove([doc.file_path]);

		const { error: deleteError } = await supabaseAdmin
			.from('documents')
			.delete()
			.eq('id', id);

		if (deleteError) {
			return json({ error: 'Failed to delete document' }, { status: 500 });
		}

		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
