import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarChart3, Layers, Calendar, Search, HelpCircle, FileText, Printer, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export function ReportsView() {
  const { currency, selectedMonth } = useApp();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [yearlyReport, setYearlyReport] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wireframe Row 4: Daily, Weekly, Custom Date, Debt -> PDF
  const [timeframe, setTimeframe] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'custom'
  const [categories, setCategories] = useState([]);
  const [queryCategory, setQueryCategory] = useState('');
  const [queryStartDate, setQueryStartDate] = useState('');
  const [queryEndDate, setQueryEndDate] = useState('');
  const [timeframeReport, setTimeframeReport] = useState(null);
  const [timeframeLoading, setTimeframeLoading] = useState(false);

  useEffect(() => {
    loadReports();
    loadCategories();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadTimeframeData();
  }, [timeframe, queryCategory, queryStartDate, queryEndDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [yr, db] = await Promise.all([
        api.getYearlyReport(selectedYear),
        api.getDashboard(selectedMonth)
      ]);
      setYearlyReport(yr);
      setDashboardData(db);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTimeframeData = async () => {
    try {
      setTimeframeLoading(true);
      if (timeframe === 'custom' || queryCategory) {
        const res = await api.queryReport({
          categoryId: queryCategory || undefined,
          startDate: queryStartDate || undefined,
          endDate: queryEndDate || undefined
        });
        setTimeframeReport({
          period: 'Custom Query',
          income: res.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: res.totalAmount,
          count: res.count,
          transactions: res.transactions
        });
      } else {
        const res = await api.getTimeframeReport({
          period: timeframe
        });
        setTimeframeReport(res);
      }
    } catch (err) {
      console.error('Timeframe report error:', err);
    } finally {
      setTimeframeLoading(false);
    }
  };

  if (loading || !dashboardData || !yearlyReport) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { totalCash, totalReceivables, totalPayables, netPosition } = dashboardData;

  return (
    <div className="space-y-6">

      {/* Top Header with Instant PDF Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Financial Reports & Analytics
          </h2>
          <p className="text-xs text-slate-400">Daily, Weekly, Custom Date & Category Reports with instant PDF statement export</p>
        </div>

        <a
          href={api.exportPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition shrink-0"
        >
          <FileText className="h-4 w-4" /> Export PDF Statement
        </a>
      </div>

      {/* Wireframe Row 4: Daily | Weekly | Custom Date | Debt Query -> PDF */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-5">
        
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Report Filter Mode</h3>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-xl transition ${timeframe === 'daily' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              📅 Daily
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-xl transition ${timeframe === 'weekly' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              🗓️ Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-xl transition ${timeframe === 'monthly' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              📆 Monthly
            </button>
            <button
              onClick={() => setTimeframe('custom')}
              className={`px-3 py-1.5 rounded-xl transition ${timeframe === 'custom' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              🔍 Custom Date / Debt
            </button>
          </div>
        </div>

        {/* Custom Date & Category Filters */}
        {timeframe === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Filter by Category / Debt</label>
              <select
                value={queryCategory}
                onChange={(e) => setQueryCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Categories & Debts</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name} ({cat.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={queryStartDate}
                onChange={(e) => setQueryStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={queryEndDate}
                onChange={(e) => setQueryEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Timeframe Report Results */}
        {timeframeLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : timeframeReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium block">Timeframe Income</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">
                  {formatCurrency(timeframeReport.income || 0, currency.symbol)}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium block">Timeframe Expenses</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block">
                  {formatCurrency(timeframeReport.expense || 0, currency.symbol)}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Net Result</span>
                  <span className={`text-xl font-bold mt-1 block ${(timeframeReport.net || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(timeframeReport.net || 0, currency.symbol)}
                  </span>
                </div>
                <a
                  href={api.exportPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 p-2 rounded-xl text-xs font-bold transition"
                  title="Print Report PDF"
                >
                  <Printer className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Timeframe Transaction List */}
            {timeframeReport.transactions && timeframeReport.transactions.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {timeframeReport.transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-slate-400">{formatDate(tx.date)}</td>
                        <td className="px-4 py-2.5 font-semibold text-white">
                          {tx.description || tx.type}
                          {tx.category && <span className="text-[10px] text-emerald-400 block font-normal">Category: {tx.category.name}</span>}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold ${['income', 'loan_repayment', 'debt_received'].includes(tx.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(tx.amount, currency.symbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Financial Position Statement (Balance Sheet) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            Financial Position Statement (Balance Sheet)
          </h2>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
            Net Position: {formatCurrency(netPosition, currency.symbol)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">1. Liquid Cash Assets</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {formatCurrency(totalCash, currency.symbol)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Physically available money</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">2. Loans Receivable (Assets)</span>
            <span className="text-xl font-bold text-blue-400 mt-1 block">
              + {formatCurrency(totalReceivables, currency.symbol)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Money owed to you by others</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">3. Debts Payable (Liabilities)</span>
            <span className="text-xl font-bold text-amber-400 mt-1 block">
              - {formatCurrency(totalPayables, currency.symbol)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Money you owe to others</span>
          </div>

        </div>
      </div>

      {/* Yearly Performance Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Annual Cash Flow ({selectedYear})
            </h3>
            <p className="text-xs text-slate-400">Monthly Income vs. Expense analysis</p>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
            <option value="2024">Year 2024</option>
          </select>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyReport.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val) => formatCurrency(val, currency.symbol)}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
