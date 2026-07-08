import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { Buffer } from 'node:buffer';


export async function extractText(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const type = file.type;
	const name = file.name.toLowerCase();

	if (type === 'application/pdf' || name.endsWith('.pdf')) {
		const parser = new PDFParse({ data: buffer });
		const data = await parser.getText();
		return data.text;
	} else if (
		type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		name.endsWith('.docx')
	) {
		const result = await mammoth.extractRawText({ buffer });
		return result.value;
	} else if (type === 'text/plain' || name.endsWith('.txt')) {
		return buffer.toString('utf-8');
	} else {
		throw new Error(`Unsupported file type: ${type} / ${name}`);
	}
}
