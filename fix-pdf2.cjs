const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import pdfParse from "pdf-parse/lib/pdf-parse.js";\n// @ts-ignore\nconst pdfParseFn = typeof pdfParse === "function" ? pdfParse : (pdfParse.default || pdfParse);',
  'import * as pdfParseModule from "pdf-parse";\n// @ts-ignore\nconst pdfParseFn = typeof pdfParseModule === "function" ? pdfParseModule : (pdfParseModule.default || pdfParseModule);'
);

fs.writeFileSync('server.ts', code);
