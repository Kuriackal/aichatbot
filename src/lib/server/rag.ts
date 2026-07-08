import { generateEmbedding, openai, CHAT_MODEL } from './openai';
import { supabaseAdmin } from './supabase';

export interface RetrievedChunk {
	id: string;
	document_id: string;
	content: string;
	similarity: number;
	filename: string;
}

export async function retrieveChunks(query: string, matchCount = 5): Promise<RetrievedChunk[]> {
	const queryEmbedding = await generateEmbedding(query);

	const docPromise = supabaseAdmin.rpc('match_document_chunks', {
		query_embedding: queryEmbedding,
		match_threshold: 0.05,
		match_count: matchCount
	});

	const qaPromise = supabaseAdmin.rpc('match_qa_pairs', {
		query_embedding: queryEmbedding,
		match_threshold: 0.05,
		match_count: matchCount
	});

	const [docRes, qaRes] = await Promise.all([docPromise, qaPromise]);

	if (docRes.error) console.error('Error retrieving chunks:', docRes.error);
	if (qaRes.error) console.error('Error retrieving QA pairs:', qaRes.error);

	let combined: RetrievedChunk[] = [];

	if (docRes.data) {
		combined = combined.concat(docRes.data as RetrievedChunk[]);
	}

	if (qaRes.data) {
		const qaChunks = (qaRes.data as any[]).map(qa => ({
			id: qa.id,
			document_id: 'manual-qa',
			content: `Question: ${qa.question}\nAnswer: ${qa.answer}`,
			similarity: qa.similarity,
			filename: 'Manual Q&A'
		}));
		combined = combined.concat(qaChunks);
	}

	combined.sort((a, b) => b.similarity - a.similarity);

	return combined.slice(0, matchCount);
}

export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
	const qaChunks = chunks.filter(c => c.filename === 'Manual Q&A');
	const docChunks = chunks.filter(c => c.filename !== 'Manual Q&A');

	let contextText = '';
	if (docChunks.length > 0) {
		contextText += 'GENERAL CONTEXT:\n';
		contextText += docChunks
			.map((c) => `--- START SOURCE (File: ${c.filename}) ---\n${c.content}\n--- END SOURCE ---`)
			.join('\n\n');
	}

	if (qaChunks.length > 0) {
		contextText += '\n\nAUTHORITATIVE MANUAL Q&A (ABSOLUTE TRUTH, OVERRIDES ALL GENERAL CONTEXT):\n';
		contextText += qaChunks
			.map((c) => `--- START MANUAL Q&A ---\n${c.content}\n--- END MANUAL Q&A ---`)
			.join('\n\n');
	}

	return `You are a strict document-reading assistant. You are given a user query and relevant excerpts from uploaded documents.
Your absolute primary directive is to answer the user's question STRICTLY and ONLY based on the provided context excerpts.

IMPORTANT INSTRUCTION REGARDING CONTEXT:
You have been provided with "GENERAL CONTEXT" and "AUTHORITATIVE MANUAL Q&A".
If there is ANY information in the "AUTHORITATIVE MANUAL Q&A" that answers the user's question, you MUST use it and completely ignore any conflicting information in the "GENERAL CONTEXT".
The "AUTHORITATIVE MANUAL Q&A" is the absolute truth. When answering yes/no questions or formulating your response, prioritize the "AUTHORITATIVE MANUAL Q&A" over anything else. Do NOT mention the conflict or your source prioritization. Just answer the user's question directly and confidently.

If the user is just greeting you or making polite conversation (e.g., "hi", "hello", "how are you"), respond naturally and politely, and offer to help them search the uploaded documents.
If the user asks a follow-up question, asks for clarification, or repeats a question in a different way, adapt your answer to their specific wording using the provided context. Re-explain or summarize the information in a new, helpful way to ensure they understand.

CRITICAL GUARDRAIL:
You MUST NOT answer general world knowledge questions (e.g., "who is the president", "what is the weather", history, pop culture, etc.) using your own internal pre-trained knowledge. 
If the user asks ANY question—even a simple or common one—and the answer cannot be found in the provided document context, you MUST politely refuse to answer and state that you can only answer questions based on the uploaded documents.
Never hallucinate policy, facts, or information outside of the provided context.
Use markdown for formatting.

${contextText}
`;
}
