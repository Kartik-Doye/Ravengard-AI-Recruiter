const fs = require('fs');
let code = fs.readFileSync('src/components/DeviceCheck.tsx', 'utf8');

const importReplacement = `import { useState, useRef, useEffect } from 'react';\nimport { Camera, Mic, Volume2, Globe, CheckCircle2, XCircle, Loader2, AlertCircle, Send } from 'lucide-react';`;
code = code.replace("import { useState, useRef, useEffect } from 'react';\nimport { Camera, Mic, Volume2, Globe, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';", importReplacement);

const stateReplacement = `
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [inputText, setInputText] = useState("");

  const checkCompleted = Object.values(checks).every((c: any) => c.status !== 'pending');
  const allPassed = Object.values(checks).every((c: any) => c.status === 'success');
  const anyFailed = Object.values(checks).some((c: any) => c.status === 'error');

  useEffect(() => {
    if (checkCompleted) {
      const validateWithAi = async () => {
        setAiLoading(true);
        try {
          const token = localStorage.getItem('traineer_uid');
          const payload = {
            camera: checks.camera.status === 'success',
            microphone: checks.mic.status === 'success',
            speaker: checks.speaker.status === 'success',
            browser: checks.browser.message,
            internetMbps: 15 // Mocking internet speed
          };
          const res = await fetch(\`/api/device-check/validate\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            setAiMessage(data.message);
            if (data.allPassed) {
               // Initiate readiness confirm
               const readyRes = await fetch(\`/api/interview/readiness/confirm\`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': \`Bearer \${token}\`
                },
                body: JSON.stringify({ text: "", sessionId: session.id })
               });
               if (readyRes.ok) {
                 const readyData = await readyRes.json();
                 setAiMessage(readyData.response);
               }
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setAiLoading(false);
        }
      };
      validateWithAi();
    }
  }, [checkCompleted, checks.camera.status, checks.mic.status, checks.speaker.status, checks.browser.status, session.id]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('traineer_uid');
      const res = await fetch(\`/api/interview/readiness/confirm\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ text: inputText, sessionId: session.id })
      });
      if (res.ok) {
        const data = await res.json();
        setAiMessage(data.response);
        if (inputText.toLowerCase().includes("i'm ready") || inputText.toLowerCase().includes("i am ready") || inputText.toLowerCase().includes("ready")) {
          setReadinessConfirmed(true);
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
  "const allPassed = Object.values(checks).every((c: any) => c.status === 'success');\n  const anyFailed = Object.values(checks).some((c: any) => c.status === 'error');",
  stateReplacement.trim()
);

const aiBlock = `
        </div>
      </div>

      {checkCompleted && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 mt-4">
          <div className="flex flex-col space-y-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-slate-800 whitespace-pre-line text-sm">
              {aiLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing setup...</span> : aiMessage}
            </div>
            
            {allPassed && (
              <form onSubmit={handleChat} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={readinessConfirmed || aiLoading}
                  placeholder={readinessConfirmed ? "Ready to begin!" : "Type 'I'm Ready'..."}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-100"
                />
                <button 
                  type="submit" 
                  disabled={readinessConfirmed || aiLoading || !inputText.trim()}
                  className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
`;

code = code.replace(
  '        </div>\n      </div>\n\n      <button',
  aiBlock
);

code = code.replace(
  'disabled={!allPassed || loading}',
  'disabled={!allPassed || !readinessConfirmed || loading}'
);

fs.writeFileSync('src/components/DeviceCheck.tsx', code);
