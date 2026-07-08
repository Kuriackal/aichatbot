export interface Chunk {
	content: string;
	index: number;
}

export function chunkText(text: string, chunkSize = 2000, overlap = 200): Chunk[] {
	const chunks: Chunk[] = [];
	let index = 0;
	let start = 0;

	while (start < text.length) {
		let end = start + chunkSize;
		
		if (end < text.length) {
			const newlinePos = text.lastIndexOf('\n', end);
			const periodPos = text.lastIndexOf('.', end);
			
			if (newlinePos > start + chunkSize - overlap * 2) {
				end = newlinePos + 1;
			} else if (periodPos > start + chunkSize - overlap * 2) {
				end = periodPos + 1;
			}
		}

		chunks.push({
			content: text.slice(start, end).trim(),
			index
		});

		start = end - overlap;
		index++;
	}

	return chunks.filter(c => c.content.length > 0);
}
