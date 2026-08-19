const fs = require('fs');
let code = fs.readFileSync('src/components/InterviewInstructions.tsx', 'utf8');

const importReplacement = `import { useState, useEffect } from 'react';\nimport { AlertTriangle, Info, Clock, RotateCcw, Send } from 'lucide-react';`;
code = code.replace("import { useState } from 'react';\nimport { AlertTriangle, Info, Clock, RotateCcw } from 'lucide-react';", importReplacement);

const stateReplacement = `
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("Loading instructions...");
  const [inputText, setInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const token = localStorage.getItem('ravengard_uid');
        const res = await fetch(\`/api/interview/instructions/confirm\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ text: "" })
        });
        if (res.ok) {
          const data = await res.json();
          setAiMessage(data.response);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstructions();
  }, []);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid');
      const res = await fetch(\`/api/interview/instructions/confirm\`, {
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
        if (inputText.toLowerCase().includes('i understand')) {
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
              placeholder={agreed ? "Instructions Understood" : "Type 'I Understand' or ask a question..."}
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
  /<label className="flex items-start gap-3 mb-8 cursor-pointer group bg-slate-50 border border-slate-200 rounded-xl p-6">[\s\S]*?<\/label>/,
  chatBlock.trim()
);

fs.writeFileSync('src/components/InterviewInstructions.tsx', code);
