const fs = require('fs');

// Creating a valid minimal PDF file
const minimalPDF = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
  '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
  '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >> endobj\n' +
  '4 0 obj << /Length 51 >> stream\n' +
  'BT /F1 12 Tf 100 700 Td (Hello World) Tj ET\n' +
  'endstream endobj\n' +
  'xref\n' +
  '0 5\n' +
  '0000000000 65535 f \n' +
  '0000000009 00000 n \n' +
  '0000000058 00000 n \n' +
  '0000000115 00000 n \n' +
  '0000000288 00000 n \n' +
  'trailer << /Size 5 /Root 1 0 R >>\n' +
  'startxref\n' +
  '388\n' +
  '%%EOF\n'
);
fs.writeFileSync('test.pdf', minimalPDF);
