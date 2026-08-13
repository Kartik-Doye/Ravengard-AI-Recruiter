const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'liveSession.send({ parts: [{ text: parsed.text }] });',
  "liveSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: parsed.text }] }] });"
);

fs.writeFileSync('server.ts', code);
