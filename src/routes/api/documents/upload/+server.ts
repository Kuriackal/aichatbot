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

		// 1. Upload raw file to Supabase Storage
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

		// 2. Insert document record (status: processing)
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

		// 3. Process text and chunk it
		try {
			const text = await extractText(file);
			const chunks = chunkText(text);

			// 4. Generate embeddings and insert chunks
			for (const chunk of chunks) {
				const embedding = await generateEmbedding(chunk.content);
				
				await supabaseAdmin.from('document_chunks').insert({
					document_id: doc.id,
					chunk_index: chunk.index,
					content: chunk.content,
					embedding
				});
			}

			// 4.5 Auto-Generate Q&A pairs
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

			// 5. Update document status to ready
			await supabaseAdmin
				.from('documents')
				.update({ status: 'ready', chunk_count: chunks.length })
				.eq('id', doc.id);

			return json({ success: true, document: doc });
		} catch (processingError) {
			console.error('Processing error', processingError);
			// Mark as failed
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
