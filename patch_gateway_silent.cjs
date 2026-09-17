const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

code = code.replace(
  /timeoutId = setTimeout\(\(\) => \{ controller\.abort\(\); setIsTimeout\(true\); \}, 25000\);/,
  `timeoutId = setTimeout(() => { controller.abort(); if (!silent) setIsTimeout(true); }, 45000);`
);

fs.writeFileSync('src/pages/InterviewGateway.tsx', code);
