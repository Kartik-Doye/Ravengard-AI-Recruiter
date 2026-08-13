const fs = require('fs');
let code = fs.readFileSync('src/components/Interview.tsx', 'utf8');

code = code.replace(
  "import { useTabVisibility } from '../hooks/useTabVisibility';",
  "import { useVisibilityCheck } from '../hooks/useVisibilityCheck';"
);

code = code.replace(
  "import { Loader2, Mic, StopCircle, User } from 'lucide-react';",
  "import { Loader2, Mic, StopCircle, User, AlertTriangle } from 'lucide-react';"
);

const stateToAdd = `
  const [showWarning, setShowWarning] = useState(false);

  useVisibilityCheck(session?.id, () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  });
`;

if (!code.includes('useVisibilityCheck(session?.id')) {
  code = code.replace(
    'const [thinkAgainLeft, setThinkAgainLeft] = useState(2);',
    'const [thinkAgainLeft, setThinkAgainLeft] = useState(2);' + stateToAdd
  );
}

const warningToast = `
      {showWarning && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <p className="font-bold text-lg">Warning: Tab Switched</p>
            <p className="text-sm">Navigating away from the assessment is prohibited and has been logged.</p>
          </div>
        </div>
      )}
`;

if (!code.includes('Warning: Tab Switched')) {
  code = code.replace(
    '<div className="max-w-[1000px] mx-auto h-[85vh] flex flex-col">',
    '<div className="max-w-[1000px] mx-auto h-[85vh] flex flex-col relative">' + warningToast
  );
}

fs.writeFileSync('src/components/Interview.tsx', code);
