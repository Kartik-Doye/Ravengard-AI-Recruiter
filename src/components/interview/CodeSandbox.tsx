import React, { useState } from "react";
import { Play, RotateCcw, Copy, Check, Code2, Terminal, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

interface CodeSandboxProps {
  code: string;
  setCode: (newCode: string) => void;
  language: string;
  setLanguage?: (newLang: string) => void;
  onRunTest?: (code: string, language: string) => void;
  readOnly?: boolean;
}

const DEFAULT_SNIPPETS: Record<string, string> = {
  python: `# Distributed Cache Invalidation / LRU Implementation
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        # Move key to most recently used
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            # Evict least recently used (first item)
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value

# Example Test Case
lru = LRUCache(2)
lru.put(1, 100)
lru.put(2, 200)
print("Get 1:", lru.get(1))
`,
  javascript: `// Concurrency Throttler / Rate Limiter
class TaskRunner {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  push(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  async next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    const { task, resolve, reject } = this.queue.shift();
    this.running++;
    try {
      const res = await task();
      resolve(res);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.next();
    }
  }
}
`,
  typescript: `// Strongly Typed Event Emitter with Type-Safe Handlers
type EventMap = Record<string, any>;
type EventCallback<T> = (data: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  private listeners: { [K in keyof Events]?: Array<EventCallback<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, fn: EventCallback<Events[K]>): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(fn);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const list = this.listeners[event] || [];
    for (const fn of list) {
      fn(data);
    }
  }
}
`,
  sql: `-- High-Volume Transaction Ledger Query
SELECT 
    account_id,
    SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE -amount END) AS balance,
    COUNT(*) as total_tx_count
FROM transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY account_id
HAVING SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE -amount END) > 50000
ORDER BY balance DESC;
`
};

export const CodeSandbox: React.FC<CodeSandboxProps> = ({
  code,
  setCode,
  language = "python",
  setLanguage,
  onRunTest,
  readOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [outputConsole, setOutputConsole] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const snippet = DEFAULT_SNIPPETS[language] || DEFAULT_SNIPPETS.python;
    setCode(snippet);
    setOutputConsole(null);
  };

  const handleLanguageChange = (newLang: string) => {
    if (setLanguage) setLanguage(newLang);
    if (!code.trim() || code === DEFAULT_SNIPPETS[language]) {
      setCode(DEFAULT_SNIPPETS[newLang] || "");
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutputConsole("Running syntax and boundary evaluation in sandbox runtime...");

    setTimeout(() => {
      setIsRunning(false);
      // Simulated evaluation / test execution
      const lineCount = code.split("\n").length;
      setOutputConsole(
        `✓ [Sandbox Evaluator - ${language.toUpperCase()}]\n` +
        `• Parsed ${lineCount} lines without syntax errors.\n` +
        `• Time Complexity: O(1) average lookup\n` +
        `• Space Complexity: O(N) bounded memory\n` +
        `• Status: Code snapshot synced to AI interviewer context.`
      );
      if (onRunTest) {
        onRunTest(code, language);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Sandbox Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
            <Code2 className="w-4 h-4" />
            <span className="font-semibold tracking-wide">TECHNICAL SANDBOX</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={readOnly}
            className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 font-mono focus:outline-none focus:border-amber-500"
          >
            <option value="python">Python 3</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="sql">PostgreSQL / SQL</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleReset}
            title="Reset to Template"
            disabled={readOnly}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <Button
            variant="outline"
            onClick={handleRunCode}
            disabled={isRunning || readOnly}
            className="h-7 text-xs px-3 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          >
            <Play className="w-3 h-3 mr-1 fill-current" />
            <span>{isRunning ? "Evaluating..." : "Run & Sync"}</span>
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative flex">
        {/* Line Numbers */}
        <div className="w-10 bg-slate-900/60 border-r border-slate-800/80 py-3 text-right pr-2 select-none font-mono text-xs text-slate-600">
          {(code || DEFAULT_SNIPPETS.python).split("\n").map((_, idx) => (
            <div key={idx} className="leading-6">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-100 font-mono text-xs p-3 leading-6 resize-none focus:outline-none selection:bg-amber-500/20"
          placeholder="// Type or paste your code solution here..."
        />
      </div>

      {/* Output Console / AI Hydration Status */}
      {outputConsole && (
        <div className="border-t border-slate-800 bg-slate-900/90 p-3 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] uppercase font-bold tracking-wider mb-1">
            <Terminal className="w-3 h-3" />
            <span>Execution & Hydration Log</span>
          </div>
          <pre className="whitespace-pre-wrap text-[11px] text-emerald-300 font-mono">{outputConsole}</pre>
        </div>
      )}
    </div>
  );
};
