import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';
import { extractText } from '$lib/server/extractText';
import { chunkText } from '$lib/server/chunking';
import { generateEmbedding, generateAutoQAPairs } from '$lib/server/openai';

export const POST: RequestHandler = async (event) => {
	try {
		const session = await requireAdmin(event);
		
		const formData = await event.request.formData();
		const file = formData.get('file') as File;
		
		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}


		const fileExt = file.name.split('.').pop();
		const fileName = `${crypto.randomUUID()}.${fileExt}`;
		const filePath = `uploads/${fileName}`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from('documents')
			.upload(filePath, file);

		if (uploadError) {
			console.error('Upload error', uploadError);
			return json({ error: 'Failed to upload file' }, { status: 500 });
		}


		const { data: doc, error: docError } = await supabaseAdmin
			.from('documents')
			.insert({
				filename: file.name,
				file_path: filePath,
				status: 'processing',
				uploader_id: session.user.id
			})
			.select()
			.single();

		if (docError || !doc) {
			return json({ error: 'Failed to create document record' }, { status: 500 });
		}


		try {
			const text = await extractText(file);
			const chunks = chunkText(text);


			for (const chunk of chunks) {
				const embedding = await generateEmbedding(chunk.content);
				
				await supabaseAdmin.from('document_chunks').insert({
					document_id: doc.id,
					chunk_index: chunk.index,
					content: chunk.content,
					embedding
				});
			}


			try {
				const autoQAs = await generateAutoQAPairs(text);
				for (const qa of autoQAs) {
					if (qa.question && qa.answer) {
						const qaEmbedding = await generateEmbedding(`Question: ${qa.question}\nAnswer: ${qa.answer}`);
						await supabaseAdmin.from('qa_pairs').insert({
							question: qa.question,
							answer: qa.answer,
							uploader_id: session.user.id,
							embedding: qaEmbedding
						});
					}
				}
			} catch (qaErr) {
				console.error("Auto QA generation failed", qaErr);
			}


			await supabaseAdmin
				.from('documents')
				.update({ status: 'ready', chunk_count: chunks.length })
				.eq('id', doc.id);

			return json({ success: true, document: doc });
		} catch (processingError) {
			console.error('Processing error', processingError);

			await supabaseAdmin
				.from('documents')
				.update({ status: 'failed' })
				.eq('id', doc.id);
				
			return json({ error: 'Failed to process document content' }, { status: 500 });
		}

	} catch (e: any) {
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
