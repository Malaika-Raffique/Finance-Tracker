import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Landmark, Wallet, Plus, ArrowLeftRight, CreditCard } from 'lucide-react';

export function AccountsView({ onOpenQuickAdd }) {
  const { currency, refreshTrigger, triggerRefresh } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [refreshTrigger]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getAccounts();
      setAccounts(res);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.createAccount({ name, type, initialBalance: Number(initialBalance) || 0 });
      setName('');
      setInitialBalance('');
      setShowAddModal(false);
      triggerRefresh();
    } catch (err) {
      alert('Error creating account: ' + err.message);
    }
  };

  const totalCashAcrossAccounts = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-400" />
            Financial Accounts Management
          </h2>
          <p className="text-xs text-slate-400">Manage Cash, Bank, NayaPay, Easypaisa accounts & transfer funds between them</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenQuickAdd('transfer')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
          >
            <ArrowLeftRight className="h-4 w-4" /> Transfer Funds
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(acc => (
          <div key={acc._id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                {acc.type === 'bank' ? <Landmark className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                {acc.type}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300">{acc.name}</h3>
              <p className="text-2xl font-extrabold text-white mt-1">
                {formatCurrency(acc.balance, currency.symbol)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium block">Total Liquid Cash</span>
          <span className="text-2xl font-bold text-emerald-400">
            {formatCurrency(totalCashAcrossAccounts, currency.symbol)}
          </span>
        </div>
        <button
          onClick={() => onOpenQuickAdd('transfer')}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-medium transition"
        >
          Transfer Between Accounts
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. NayaPay Wallet, Meezan Bank"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Account</option>
                  <option value="wallet">Mobile Wallet (NayaPay / Easypaisa)</option>
                  <option value="other">Other Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Opening Balance</label>
                <input
                  type="number"
                  placeholder="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
