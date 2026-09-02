const fs = require('fs');
let file = fs.readFileSync('src/pages/FinalReport.tsx', 'utf8');

if (!file.includes("import { SmoothLoader }")) {
  file = "import { SmoothLoader } from '../components/layout/SmoothLoader';\n" + file;
  fs.writeFileSync('src/pages/FinalReport.tsx', file);
}
