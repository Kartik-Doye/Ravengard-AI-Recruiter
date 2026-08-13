const fs = require('fs');
let code = fs.readFileSync('src/components/Consent.tsx', 'utf8');

const importReplacement = `import { useState, useRef, useEffect } from 'react';\nimport { Send } from 'lucide-react';`;
code = code.replace("import { useState } from 'react';", importReplacement);

const stateReplacement = `
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("Please read the policy above. When you are ready, type 'I Agree' to lock your session and begin.");
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('traineer_uid');
      const res = await fetch(\`/api/session/\${session.id}/policy-confirm\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ text: inputText })
      });
      if (res.ok) {
        const data = await res.json();
        setAiMessage(data.response);
        if (inputText.toLowerCase().includes('i agree')) {
          setAgreed(true);
        }
      }
    } catch(err) {
      console.error(err);
    } finally {
      setAiLoading(false);
      setInputText('');
    }
  };
`;
code = code.replace(
  'const [agreed, setAgreed] = useState(false);\n  const [loading, setLoading] = useState(false);',
  stateReplacement.trim()
);

const chatBlock = `
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <div className="flex flex-col space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-slate-800 whitespace-pre-line text-sm">
            {aiMessage}
          </div>
          
          <form onSubmit={handleChat} className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={agreed || aiLoading}
              placeholder={agreed ? "Session Locked" : "Type 'I Agree' or ask a question..."}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100"
            />
            <button 
              type="submit" 
              disabled={agreed || aiLoading || !inputText.trim()}
              className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
`;

code = code.replace(
  /<label className="flex items-start gap-3 mb-8 cursor-pointer group">[\s\S]*?<\/label>/,
  chatBlock.trim()
);

fs.writeFileSync('src/components/Consent.tsx', code);
