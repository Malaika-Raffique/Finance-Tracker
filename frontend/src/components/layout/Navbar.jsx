import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Wallet, Lock, Settings, Calendar, RefreshCw } from 'lucide-react';
import { getMonthName } from '../../utils/formatters';

export function Navbar({ onOpenQuickAdd, onOpenSettings }) {
  const { selectedMonth, setSelectedMonth, currency, passcode, updatePasscode, triggerRefresh } = useApp();

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Finance Control</h1>
            <span className="text-xs text-slate-400 font-medium">Personal Ledger & Loans</span>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg p-1 text-sm font-medium">
          <button 
            onClick={handlePrevMonth}
            className="px-2.5 py-1 text-slate-400 hover:text-white rounded transition hover:bg-slate-700"
            title="Previous Month"
          >
            &larr;
          </button>
          <div className="flex items-center gap-1.5 px-3 text-emerald-400 font-semibold min-w-[130px] justify-center">
            <Calendar className="h-4 w-4" />
            <span>{getMonthName(selectedMonth)}</span>
          </div>
          <button 
            onClick={handleNextMonth}
            className="px-2.5 py-1 text-slate-400 hover:text-white rounded transition hover:bg-slate-700"
            title="Next Month"
          >
            &rarr;
          </button>
        </div>

        {/* Actions & Prominent Quick Add */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={triggerRefresh}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {passcode && (
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition"
              title="Lock Application"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Settings & Backup"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
        </div>

      </div>
    </header>
  );
}
