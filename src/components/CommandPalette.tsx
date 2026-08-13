import { useState, useEffect } from 'react';
import { Search, FileText, User, Home, Calendar, Moon, Sun, Monitor, Clock } from 'lucide-react';

export default function CommandPalette({ isOpen, setIsOpen, onNavigate, onThemeChange }: any) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev: boolean) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            className="flex-1 px-4 text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-400"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>
        
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</div>
          <button onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <Home className="w-4 h-4 text-slate-400" /> Dashboard
          </button>
          <button onClick={() => { onNavigate('history'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <Clock className="w-4 h-4 text-slate-400" /> Interview History
          </button>
          <button onClick={() => { onNavigate('forms'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <FileText className="w-4 h-4 text-slate-400" /> Workspace Integrations
          </button>

          <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Theme</div>
          <button onClick={() => { onThemeChange('light'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <Sun className="w-4 h-4 text-slate-400" /> Light Mode
          </button>
          <button onClick={() => { onThemeChange('dark'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <Moon className="w-4 h-4 text-slate-400" /> Dark Mode
          </button>
          <button onClick={() => { onThemeChange('high-contrast'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors">
            <Monitor className="w-4 h-4 text-slate-400" /> High Contrast
          </button>
        </div>
      </div>
    </div>
  );
}
