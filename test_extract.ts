import { extractTextFromFile } from './src/services/resume-processor';
import fs from 'fs';

async function run() {
  try {
    const buf = fs.readFileSync('test.pdf');
    const text = await extractTextFromFile(buf, 'pdf');
    console.log("Extracted text length:", text.length);
    console.log("Extracted text snippet:", text.substring(0, 20));
  } catch (e) {
    console.error("Extraction failed:", e);
  }
}
run();
