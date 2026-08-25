const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/variant="[^"]*"\s*/g, '');
  code = code.replace(/padding="[^"]*"\s*/g, '');
  fs.writeFileSync(file, code);
}

fixFile('src/components/ui/EmptyState.tsx');
fixFile('src/components/ui/Modal.tsx');
