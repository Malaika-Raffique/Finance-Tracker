import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CreditCard, Plus, Calendar, CheckCircle2, Briefcase } from 'lucide-react';

export function DebtsView({ onOpenQuickAdd, onOpenDebtPayModal }) {
  const { currency, refreshTrigger } = useApp();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, [refreshTrigger]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const res = await api.getDebts();
      setDebts(res);
    } catch (err) {
      console.error('Failed to load debts:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalBorrowed = debts.reduce((sum, d) => sum + d.originalAmount, 0);
  const totalOutstanding = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalPaid = totalBorrowed - totalOutstanding;

  return (
    <div className="space-y-6">

      {/* Header & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-400" />
            Money You Owe (Debts & Salary Advances)
          </h2>
          <p className="text-xs text-slate-400">Track money borrowed, salary advance obligations & repayments made</p>
        </div>

        <button
          onClick={() => onOpenQuickAdd('debt_received')}
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="h-4 w-4" /> Add Debt / Advance
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Borrowed / Received</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalBorrowed, currency.symbol)}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Repaid</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalPaid, currency.symbol)}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Outstanding Payable</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {formatCurrency(totalOutstanding, currency.symbol)}
          </p>
        </div>

      </div>

      {/* Debt Obligations Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : debts.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-500">
          <p className="text-sm">No debt obligations or salary advances recorded yet.</p>
          <button
            onClick={() => onOpenQuickAdd('debt_received')}
            className="mt-4 inline-flex items-center gap-2 text-xs bg-amber-600 text-white px-4 py-2 rounded-xl font-medium"
          >
            <Plus className="h-4 w-4" /> Record First Debt Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map(debt => {
            const paid = debt.originalAmount - debt.remainingAmount;
            const pct = Math.min(100, Math.round((paid / debt.originalAmount) * 100));
            const isSettled = debt.status === 'settled';
            const isSalaryAdvance = debt.type === 'salary_advance';

            return (
              <div key={debt._id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      {debt.person ? debt.person.name : 'Unknown'}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isSettled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isSettled ? 'SETTLED' : 'ACTIVE'}
                    </span>
                  </div>

                  {isSalaryAdvance && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Briefcase className="h-3 w-3" /> Salary Advance
                    </span>
                  )}

                  <p className="text-xs text-slate-400 mt-2">Received on {formatDate(debt.dateReceived)}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Original Debt</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(debt.originalAmount, currency.symbol)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Remaining</span>
                      <span className="font-bold text-amber-400">{formatCurrency(debt.remainingAmount, currency.symbol)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                      <span>Repayment Progress</span>
                      <span className="text-emerald-400">{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {debt.dueDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Due: {formatDate(debt.dueDate)}</span>
                    </div>
                  )}

                  {debt.note && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2 rounded-lg italic">
                      "{debt.note}"
                    </p>
                  )}
                </div>

                {!isSettled && (
                  <button
                    onClick={() => onOpenDebtPayModal(debt)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Repay Debt
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
