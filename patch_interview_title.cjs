const fs = require('fs');
let code = fs.readFileSync('src/components/Interview.tsx', 'utf8');

code = code.replace(
  '<h1 className="text-2xl font-semibold text-slate-900">Live Assessment</h1>',
  '<h1 className="text-2xl font-semibold text-slate-900">Friendly HR <span className="text-slate-400 text-lg font-normal ml-2">(Round 1 of 9)</span></h1>'
);

fs.writeFileSync('src/components/Interview.tsx', code);
