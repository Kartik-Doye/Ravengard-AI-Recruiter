const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import express from "express";[\s\S]*?import path from "path";/, 
`import express from "express";
import { extractTextFromFile, analyzeResumeWithAI } from "./src/services/resume-processor.ts";
import path from "path";`);

// Remove the other duplicate mammoth and unpdf imports
code = code.replace(/import \{ extractText, getDocumentProxy \} from "unpdf";\nimport mammoth from "mammoth";/, '');

fs.writeFileSync('server.ts', code);
