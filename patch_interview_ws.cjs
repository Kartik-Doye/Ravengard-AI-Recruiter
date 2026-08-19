const fs = require('fs');
let code = fs.readFileSync('src/components/Interview.tsx', 'utf8');

code = code.replace(
  "const wsUrl = `${protocol}//${window.location.host}/api/live`;",
  "const token = localStorage.getItem('ravengard_uid');\n    const wsUrl = `${protocol}//${window.location.host}/api/live?sessionId=${session?.id}&token=${token}`;"
);

fs.writeFileSync('src/components/Interview.tsx', code);
