import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Wallet, TrendingUp, TrendingDown, HandCoins, CreditCard, 
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, PieChart, Plus, Database
} from 'lucide-react';

export function DashboardView({ onOpenQuickAdd }) {
  const { selectedMonth, currency, refreshTrigger, setActiveTab } = useApp();
  const [data, setData] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, refreshTrigger]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await api.getDashboard(selectedMonth);
      const txs = await api.getTransactions({ limit: 6 });
      setData(res);
      setRecentTxs(txs);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (err.response?.status === 503 || err.message?.includes('503') || err.message?.includes('Network Error')) {
        setDbError('Database connection pending. Please configure MONGODB_URI in backend/.env.');
      } else {
        setDbError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="text-xs">Loading financial data...</p>
      </div>
    );
  }

  if (dbError || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto my-8 text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
          <Database className="h-8 w-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">MongoDB Connection Required</h2>
          <p className="text-sm text-slate-400 mt-2">
            The application frontend is running smoothly, but the backend requires your MongoDB Atlas connection string.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left text-xs font-mono text-emerald-400 space-y-2">
          <p className="text-slate-400 font-sans font-semibold">Step-by-step setup:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-sans">
            <li>Open your MongoDB Atlas dashboard (Cluster0).</li>
            <li>Click <strong>Connect</strong> &rarr; <strong>Drivers</strong> &rarr; copy your Connection String.</li>
            <li>Paste it into <code className="text-emerald-400 font-mono">backend/.env</code> as:</li>
          </ol>
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] break-all text-emerald-300 select-all">
            MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/finance_tracker
          </div>
        </div>

        <button
          onClick={loadDashboard}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition text-xs shadow-lg shadow-emerald-500/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { totalCash, totalReceivables, totalPayables, netPosition, monthly, loansSummary, debtsSummary, alerts } = data;

  return (
    <div className="space-y-6">

      {/* Alerts Banner if any overdue */}
      {(alerts.overdueLoansCount > 0 || alerts.overdueDebtsCount > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Attention Required: </span>
              {alerts.overdueLoansCount > 0 && `${alerts.overdueLoansCount} loan receivable(s) due.`}
              {alerts.overdueDebtsCount > 0 && ` ${alerts.overdueDebtsCount} debt payment(s) due.`}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab(alerts.overdueLoansCount > 0 ? 'loans' : 'debts')}
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-1.5 rounded-lg transition font-semibold"
          >
            View Details
          </button>
        </div>
      )}

      {/* Top Cards: Total Cash & Net Financial Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cash Balance */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute right-3 top-3 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Cash Balance</p>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            {formatCurrency(totalCash, currency.symbol)}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Across all cash, bank & mobile accounts</p>
        </div>

        {/* Receivables */}
        <div 
          onClick={() => setActiveTab('loans')}
          className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">People Owe You</p>
            <HandCoins className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-blue-400 mt-2">
            {formatCurrency(totalReceivables, currency.symbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">{loansSummary.activeCount} active loan receivable(s)</p>
        </div>

        {/* Payables */}
        <div 
          onClick={() => setActiveTab('debts')}
          className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-emerald-500/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">You Owe Others</p>
            <CreditCard className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mt-2">
            {formatCurrency(totalPayables, currency.symbol)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">{debtsSummary.activeCount} active debt obligation(s)</p>
        </div>

        {/* Net Position (Net Worth) */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Net Position</p>
            <Layers className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-300 mt-2">
            {formatCurrency(netPosition, currency.symbol)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            Formula: Cash + Loans - Debts
          </p>
        </div>

      </div>

      {/* Monthly Overview Section */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Monthly Cash Flow</span>
            </h3>
            <p className="text-xs text-slate-400">Income vs Expenses for selected month</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Monthly Net</span>
              <span className={`text-lg font-bold ${monthly.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(monthly.netCashFlow, currency.symbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Income vs Expense KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Money In (Income)</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(monthly.income, currency.symbol)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Money Out (Expense)</p>
                <p className="text-xl font-bold text-rose-400 mt-0.5">
                  {formatCurrency(monthly.expense, currency.symbol)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Income & Expense Breakdown Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Income Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Income Breakdown
            </h4>
            {Object.keys(monthly.incomeBreakdown).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No income recorded for this month</p>
            ) : (
              Object.entries(monthly.incomeBreakdown).map(([cat, amt]) => {
                const pct = monthly.income > 0 ? Math.round((amt / monthly.income) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-emerald-400">{formatCurrency(amt, currency.symbol)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Expense Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              Expense Breakdown
            </h4>
            {Object.keys(monthly.expenseBreakdown).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No expenses recorded for this month</p>
            ) : (
              Object.entries(monthly.expenseBreakdown).map(([cat, amt]) => {
                const pct = monthly.expense > 0 ? Math.round((amt / monthly.expense) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-rose-400">{formatCurrency(amt, currency.symbol)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Financial Activity</h3>
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View All Ledger &rarr;
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No recent transactions.</p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-3 inline-flex items-center gap-2 bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-medium"
            >
              <Plus className="h-4 w-4" /> Record First Entry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentTxs.map(tx => {
              const isPositive = ['income', 'loan_repayment', 'debt_received'].includes(tx.type);
              return (
                <div key={tx._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl font-bold text-xs ${
                      tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400' :
                      tx.type === 'loan_given' ? 'bg-blue-500/10 text-blue-400' :
                      tx.type === 'debt_received' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {tx.type === 'income' && 'IN'}
                      {tx.type === 'expense' && 'OUT'}
                      {tx.type === 'loan_given' && 'LENT'}
                      {tx.type === 'debt_received' ? 'DEBT' : ''}
                      {tx.type === 'loan_repayment' && 'REPAY'}
                      {tx.type === 'debt_payment' && 'PAID'}
                      {tx.type === 'transfer' && 'XFER'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {tx.description || tx.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(tx.date)} • Account: {tx.account ? tx.account.name : 'Default'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(tx.amount, currency.symbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
