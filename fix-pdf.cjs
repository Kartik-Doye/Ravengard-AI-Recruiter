const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import pdfParse from "pdf-parse";',
  'import pdfParse from "pdf-parse/lib/pdf-parse.js";\n// @ts-ignore\nconst pdfParseFn = typeof pdfParse === "function" ? pdfParse : (pdfParse.default || pdfParse);'
);

code = code.replace(
  'const pdfData = await pdfParse(file.buffer);',
  'const pdfData = await pdfParseFn(file.buffer);'
);

fs.writeFileSync('server.ts', code);
