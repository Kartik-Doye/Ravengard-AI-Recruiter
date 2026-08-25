const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import pdfParse from "pdf-parse";')) {
  code = code.replace(
    'import express from "express";',
    'import express from "express";\nimport pdfParse from "pdf-parse";\nimport mammoth from "mammoth";\nimport { GoogleGenAI } from "@google/genai";'
  );
  fs.writeFileSync('server.ts', code);
}
