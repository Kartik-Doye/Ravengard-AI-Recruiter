import { extractTextFromFile } from './src/services/resume-processor';
import fs from 'fs';

async function run() {
  const buf = fs.readFileSync('package.json'); // not a real pdf but let's test if the function crashes early or throws properly, actually let's create a dummy pdf first or just see if the code compiles
}
