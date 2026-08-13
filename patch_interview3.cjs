const fs = require('fs');
let code = fs.readFileSync('src/components/Interview.tsx', 'utf8');

const stateToAdd = `
  const [showWarning, setShowWarning] = useState(false);

  useVisibilityCheck(session?.id, () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  });
`;

if (!code.includes('const [showWarning, setShowWarning] = useState(false);')) {
  code = code.replace(
    'const [thinkAgainLeft, setThinkAgainLeft] = useState(2 - (session?.thinkAgainUsed || 0));',
    'const [thinkAgainLeft, setThinkAgainLeft] = useState(2 - (session?.thinkAgainUsed || 0));' + stateToAdd
  );
  fs.writeFileSync('src/components/Interview.tsx', code);
}
