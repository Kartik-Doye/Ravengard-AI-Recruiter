const fs = require('fs');
// 1x1 transparent png
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(pngBase64, 'base64');
fs.writeFileSync('public/apple-touch-icon.png', buffer);
fs.writeFileSync('public/favicon-192.png', buffer);
fs.writeFileSync('public/favicon-512.png', buffer);
