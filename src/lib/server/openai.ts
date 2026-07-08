import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

if (!OPENAI_API_KEY) {
	console.warn('OPENAI_API_KEY is missing');
}

export const openai = new OpenAI({
	apiKey: OPENAI_API_KEY || 'dummy'
});

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const CHAT_MODEL = 'gpt-4o-mini';

export async function generateEmbedding(text: string): Promise<number[]> {
	const response = await openai.embeddings.create({
		model: EMBEDDING_MODEL,
		input: text
	});
	return response.data[0].embedding;
}

export async function generateAutoQAPairs(text: string): Promise<{question: string, answer: string}[]> {
	const truncated = text.substring(0, 15000);
	
	const response = await openai.chat.completions.create({
		model: CHAT_MODEL,
		messages: [
			{ 
				role: 'system', 
				content: 'You are a helpful assistant. Generate exactly 3 relevant and useful question-and-answer pairs based on the provided document text. Your response must be valid JSON in this format: {"qa_pairs": [{"question": "...", "answer": "..."}]}.' 
			},
			{ role: 'user', content: truncated }
		],
		response_format: { type: 'json_object' }
	});

	try {
		const content = response.choices[0].message.content;
		if (!content) return [];
		const parsed = JSON.parse(content);
		return parsed.qa_pairs || [];
	} catch (e) {
		console.error("Error parsing auto Q&A", e);
		return [];
	}
}
