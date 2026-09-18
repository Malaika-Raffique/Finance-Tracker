import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function LoanRepaymentModal({ loan, onClose }) {
  const { currency, triggerRefresh } = useApp();
  const [amount, setAmount] = useState(loan ? loan.remainingAmount.toString() : '');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAccounts().then(accs => {
      setAccounts(accs);
      if (accs.length > 0) setAccountId(accs[0]._id);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    setSubmitting(true);
    try {
      await api.repayLoan(loan._id, {
        amount: Number(amount),
        accountId,
        date,
        note
      });
      triggerRefresh();
      onClose();
    } catch (err) {
      alert('Error recording repayment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Record Loan Repayment</h3>
            <p className="text-xs text-slate-400">From {loan.person ? loan.person.name : 'Debtor'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-800/80 p-3 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Original Loan Amount:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(loan.originalAmount, currency.symbol)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Balance:</span>
              <span className="font-bold text-blue-400">{formatCurrency(loan.remainingAmount, currency.symbol)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Repayment Amount Received</label>
            <input
              type="number"
              step="any"
              max={loan.remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Account Received Into</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            >
              {accounts.map(acc => (
                <option key={acc._id} value={acc._id}>{acc.name} ({currency.symbol} {acc.balance})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Repayment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Partial repayment via Cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> Save Loan Repayment
          </button>
        </form>
      </div>
    </div>
  );
}
