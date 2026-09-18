import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, FileText } from 'lucide-react';

export function TransactionsView() {
  const { currency, selectedMonth, refreshTrigger, triggerRefresh } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, [selectedMonth, typeFilter, accountFilter, search, refreshTrigger]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        type: typeFilter || undefined,
        accountId: accountFilter || undefined,
        search: search || undefined
      };
      const res = await api.getTransactions(params);
      setTransactions(res);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.getAccounts();
      setAccounts(res);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction from the ledger?')) return;
    try {
      await api.deleteTransaction(id);
      triggerRefresh();
    } catch (err) {
      alert('Error deleting transaction: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Financial Transactions Ledger
          </h2>
          <p className="text-xs text-slate-400">Complete chronological record of all monetary movements</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          <a
            href={api.exportPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            <FileText className="h-4 w-4" /> PDF Statement
          </a>

          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description/person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Entry Types</option>
            <option value="income">🟢 Income</option>
            <option value="expense">🔴 Expense</option>
            <option value="loan_given">🔵 Loan Given</option>
            <option value="loan_repayment">🟣 Loan Repayment</option>
            <option value="debt_received">🟠 Debt Received</option>
            <option value="debt_payment">💸 Debt Payment</option>
            <option value="transfer">↔ Account Transfer</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>{acc.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-12 text-slate-500">
            <p className="text-sm">No ledger entries match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description / Note</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transactions.map(tx => {
                  const isPositive = ['income', 'loan_repayment', 'debt_received'].includes(tx.type);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-400">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          tx.type === 'loan_given' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          tx.type === 'loan_repayment' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          tx.type === 'debt_received' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {tx.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{tx.description || 'N/A'}</div>
                        {tx.note && <div className="text-[11px] text-slate-400">{tx.note}</div>}
                        {tx.category && <div className="text-[10px] text-emerald-400 font-medium">Category: {tx.category.name}</div>}
                        {tx.person && <div className="text-[10px] text-blue-400 font-medium">Person: {tx.person.name}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300 font-medium">
                        {tx.account ? tx.account.name : 'Default Account'}
                        {tx.toAccount && <span className="text-slate-400"> &rarr; {tx.toAccount.name}</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-400' : 'text-slate-200'}>
                          {isPositive ? '+' : '-'}{formatCurrency(tx.amount, currency.symbol)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Delete Transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
