const fs = require('fs');
let code = fs.readFileSync('src/theme/motion.ts', 'utf8');
code = code.replace(/ease: \[0\.16, 1, 0\.3, 1\],/g, 'ease: [0.16, 1, 0.3, 1] as [number, number, number, number],');
fs.writeFileSync('src/theme/motion.ts', code);
