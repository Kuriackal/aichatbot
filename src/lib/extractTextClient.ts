import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextClient(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const type = file.type;
	const name = file.name.toLowerCase();

	if (type === 'application/pdf' || name.endsWith('.pdf')) {
		const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
		const pdfDocument = await loadingTask.promise;
		let fullText = '';
		for (let i = 1; i <= pdfDocument.numPages; i++) {
			const page = await pdfDocument.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items.map((item: any) => item.str).join(' ');
			fullText += pageText + '\n';
		}
		return fullText;
	} else if (
		type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		name.endsWith('.docx')
	) {
		const result = await mammoth.extractRawText({ arrayBuffer });
		return result.value;
	} else if (type === 'text/plain' || name.endsWith('.txt')) {
		return await file.text();
	} else {
		throw new Error(`Unsupported file type: ${type} / ${name}`);
	}
}
