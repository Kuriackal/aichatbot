import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabase';
import { extractText } from '$lib/server/extractText';
import { chunkText } from '$lib/server/chunking';
import { generateEmbedding, generateAutoQAPairs } from '$lib/server/openai';

export const POST: RequestHandler = async (event) => {
	console.log('--- UPLOAD ENDPOINT HIT ---');
	try {
		console.log('Authenticating user...');
		const session = await requireAdmin(event);
		console.log('User authenticated:', session.user.id);
		
		console.log('Extracting form data...');
		const formData = await event.request.formData();
		const file = formData.get('file') as File;
		console.log('File extracted:', file ? file.name : 'No file');
		
		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}


		const fileExt = file.name.split('.').pop();
		const fileName = `${crypto.randomUUID()}.${fileExt}`;
		const filePath = `uploads/${fileName}`;

		console.log(`Uploading file ${file.name} to Supabase storage at ${filePath}...`);
		const { error: uploadError } = await supabaseAdmin.storage
			.from('documents')
			.upload(filePath, file);
		console.log('Supabase storage upload completed. Error:', uploadError?.message || 'None');

		if (uploadError) {
			console.error('Upload error', uploadError);
			return json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
		}


		console.log('Creating document record in Supabase database...');
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
		console.log('Database insert completed. docError:', docError?.message || 'None', 'doc:', doc?.id);

		if (docError || !doc) {
			return json({ error: `Failed to create document record: ${docError?.message || 'No doc returned'}` }, { status: 500 });
		}


		try {
			console.log('Extracting text from file...');
			const text = await extractText(file);
			console.log(`Extracted text length: ${text.length}`);

			console.log('Chunking text...');
			const chunks = chunkText(text);
			console.log(`Created ${chunks.length} chunks`);


			console.log('Generating embeddings and inserting chunks...');
			for (let i = 0; i < chunks.length; i++) {
				const chunk = chunks[i];
				console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
				const embedding = await generateEmbedding(chunk.content);
				
				await supabaseAdmin.from('document_chunks').insert({
					document_id: doc.id,
					chunk_index: chunk.index,
					content: chunk.content,
					embedding
				});
			}
			console.log('Chunks inserted successfully.');


			try {
				console.log('Generating auto Q&A pairs...');
				const autoQAs = await generateAutoQAPairs(text);
				console.log(`Generated ${autoQAs.length} auto Q&A pairs`);
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


			console.log('Updating document status to ready...');
			await supabaseAdmin
				.from('documents')
				.update({ status: 'ready', chunk_count: chunks.length })
				.eq('id', doc.id);

			console.log('--- UPLOAD PROCESS COMPLETED SUCCESSFULLY ---');
			return json({ success: true, document: doc });
		} catch (processingError) {
			console.error('Processing error', processingError);

			await supabaseAdmin
				.from('documents')
				.update({ status: 'failed' })
				.eq('id', doc.id);
				
			return json({ error: `Failed to process document content: ${processingError instanceof Error ? processingError.message : String(processingError)}` }, { status: 500 });
		}

	} catch (e: any) {
		console.error('FATAL Outer catch block hit:', e);
		return json({ error: e.message || 'Server error' }, { status: 500 });
	}
};
