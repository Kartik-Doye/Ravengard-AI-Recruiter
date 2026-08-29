import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export async function extractTextFromFile(buffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string> {
  if (fileType === 'pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (typeof text === 'string' ? text : text.join('\n')) || '';
  } else if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type');
}
