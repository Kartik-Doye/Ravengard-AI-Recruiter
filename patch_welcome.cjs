const fs = require('fs');
let code = fs.readFileSync('src/components/Welcome.tsx', 'utf8');

code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");

const fetchCode = `
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAiMessage = async () => {
      try {
        const token = localStorage.getItem('traineer_uid');
        const res = await fetch('/api/welcome-message', {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        if (res.ok) {
          const data = await res.json();
          setAiMessage(data.message);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAiMessage();
  }, []);
`;

code = code.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);\n' + fetchCode);

const aiBlock = `
      {aiMessage ? (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 shadow-sm mb-8 whitespace-pre-line text-slate-800">
          {aiMessage}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        </div>
      )}
`;

code = code.replace(/<div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm mb-8">[\s\S]*?<\/div>/, aiBlock.trim());

fs.writeFileSync('src/components/Welcome.tsx', code);
