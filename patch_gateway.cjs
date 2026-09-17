const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');
code = code.replace(/45000/g, '600000');
fs.writeFileSync('src/pages/InterviewGateway.tsx', code);
