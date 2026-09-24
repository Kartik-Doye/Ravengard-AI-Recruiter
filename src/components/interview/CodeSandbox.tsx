import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Copy, Check, Code2, Terminal, CheckCircle2, XCircle, Clock, ListFilter } from "lucide-react";
import { Button } from "../ui/Button";
import { executeCodeInBrowser, ExecutionReport, DEFAULT_TEST_SUITES } from "../../utils/codeRunner";

interface CodeSandboxProps {
  code: string;
  setCode: (newCode: string) => void;
  language: string;
  setLanguage?: (newLang: string) => void;
  onRunTest?: (code: string, language: string, report?: ExecutionReport) => void;
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

# Example Execution
lru = LRUCache(2)
lru.put(1, 100)
lru.put(2, 200)
print("Initial get(1):", lru.get(1))
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
  const [isRunning, setIsRunning] = useState(false);
  const [executionReport, setExecutionReport] = useState<ExecutionReport | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"tests" | "console">("tests");

  // Load default snippet on mount if empty
  useEffect(() => {
    if (!code || !code.trim()) {
      setCode(DEFAULT_SNIPPETS[language] || DEFAULT_SNIPPETS.python);
    }
  }, [language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    const snippet = DEFAULT_SNIPPETS[language] || DEFAULT_SNIPPETS.python;
    setCode(snippet);
    setExecutionReport(null);
  };

  const handleLanguageChange = (newLang: string) => {
    if (setLanguage) setLanguage(newLang);
    if (!code.trim() || code === DEFAULT_SNIPPETS[language]) {
      setCode(DEFAULT_SNIPPETS[newLang] || "");
    }
    setExecutionReport(null);
  };

  const handleRunWasmTests = async () => {
    setIsRunning(true);
    try {
      const report = await executeCodeInBrowser(code, language);
      setExecutionReport(report);
      if (onRunTest) {
        onRunTest(code, language, report);
      }
    } catch (err: any) {
      console.error("Code execution failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const testCases = DEFAULT_TEST_SUITES[language.toLowerCase()] || [];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Sandbox Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
            <Code2 className="w-4 h-4" />
            <span className="font-semibold tracking-wide">WASM EXECUTION SANDBOX</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={readOnly || isRunning}
            className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 font-mono focus:outline-none focus:border-amber-500"
          >
            <option value="python">Python 3 (WASM / Pyodide)</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript (V8 Sandboxed)</option>
            <option value="sql">PostgreSQL / SQL</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={handleReset}
            title="Reset to Template"
            disabled={readOnly || isRunning}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <Button
            variant="outline"
            onClick={handleRunWasmTests}
            disabled={isRunning || readOnly}
            className="h-7 text-xs px-3 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          >
            <Play className={`w-3 h-3 mr-1 fill-current ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Running in WASM..." : "Run & Test Cases"}</span>
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative flex min-h-[160px] overflow-hidden">
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
          readOnly={readOnly || isRunning}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-100 font-mono text-xs p-3 leading-6 resize-none focus:outline-none selection:bg-amber-500/20"
          placeholder="// Type or paste your code solution here..."
        />
      </div>

      {/* Bottom Panel: Unit Test Suite & Execution Console */}
      <div className="border-t border-slate-800 bg-slate-900/95 flex flex-col max-h-48 overflow-hidden">
        {/* Sub-Tabs Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBottomTab("tests")}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded transition-colors ${
                activeBottomTab === "tests"
                  ? "bg-slate-800 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>Unit Tests ({executionReport ? `${executionReport.passedCount}/${executionReport.totalCount}` : testCases.length})</span>
            </button>

            <button
              onClick={() => setActiveBottomTab("console")}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded transition-colors ${
                activeBottomTab === "console"
                  ? "bg-slate-800 text-amber-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Stdout / Console</span>
            </button>
          </div>

          {executionReport && (
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{executionReport.runtimeMs}ms</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  executionReport.passedCount === executionReport.totalCount
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {executionReport.passedCount === executionReport.totalCount ? "ALL TESTS PASSED" : `${executionReport.passedCount}/${executionReport.totalCount} PASSED`}
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Unit Tests Matrix */}
        {activeBottomTab === "tests" && (
          <div className="p-3 overflow-y-auto space-y-2 max-h-36">
            {!executionReport ? (
              <div className="text-slate-400 text-xs font-mono space-y-1.5">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Ready to evaluate {testCases.length} unit tests:
                </div>
                {testCases.map((tc, idx) => (
                  <div key={tc.id} className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded border border-slate-800/80 text-[11px]">
                    <span className="text-slate-300">Test {idx + 1}: {tc.name}</span>
                    <span className="text-slate-500 text-[10px]">{tc.input}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {executionReport.results.map((res, idx) => (
                  <div
                    key={res.id}
                    className={`flex items-start justify-between p-2 rounded border text-xs font-mono transition-colors ${
                      res.passed
                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200"
                        : "bg-rose-950/20 border-rose-900/40 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-100">Test {idx + 1}: {res.name}</div>
                        <div className="text-[10px] text-slate-400">Input: {res.input}</div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] shrink-0 font-mono">
                      <div>Expected: <span className="text-emerald-300">{JSON.stringify(res.expected)}</span></div>
                      <div>Actual: <span className={res.passed ? "text-emerald-300" : "text-rose-300 font-bold"}>{JSON.stringify(res.actual)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Console Output Log */}
        {activeBottomTab === "console" && (
          <div className="p-3 font-mono text-xs overflow-y-auto max-h-36">
            {executionReport?.stdout || executionReport?.stderr ? (
              <pre className="whitespace-pre-wrap text-[11px] text-emerald-300">
                {executionReport.stdout || ""}
                {executionReport.stderr && (
                  <span className="text-rose-400 block mt-1">Error: {executionReport.stderr}</span>
                )}
              </pre>
            ) : (
              <div className="text-slate-500 text-xs italic">
                No stdout logs emitted. Run the tests to view execution traces and print outputs.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
