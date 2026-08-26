const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/components/Welcome.tsx', 'utf8');

code = code.replace(/const handleStart = async \(\) => \{[\s\S]*?finally \{[\s\S]*?\}\n  \};/,
`const handleStart = () => {
    onNext({ currentStage: 'consent' });
  };`);
fs.writeFileSync('/app/applet/src/components/Welcome.tsx', code);
