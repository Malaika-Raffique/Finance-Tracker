import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { X, Plus, ArrowUpRight, ArrowDownRight, HandCoins, CreditCard, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';

export function QuickAddModal({ initialTab = 'income', onClose }) {
  const { currency, triggerRefresh } = useApp();
  const [tab, setTab] = useState(initialTab);
  
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loans, setLoans] = useState([]);
  const [debts, setDebts] = useState([]);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [personName, setPersonName] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [debtType, setDebtType] = useState('borrowed');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accs, cats, lns, dbts] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getLoans(),
        api.getDebts()
      ]);
      setAccounts(accs);
      setCategories(cats);
      setLoans(lns.filter(l => l.status === 'active'));
      setDebts(dbts.filter(d => d.status === 'active'));
      
      if (accs.length > 0) setAccountId(accs[0]._id);
      const incCats = cats.filter(c => c.type === 'income');
      if (incCats.length > 0) setCategoryId(incCats[0]._id);
    } catch (err) {
      console.error('Error loading quick add dropdown data:', err);
    }
  };

  // Handle Tab Switch & Auto Select matching Category
  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'income') {
      const incCats = categories.filter(c => c.type === 'income');
      if (incCats.length > 0) setCategoryId(incCats[0]._id);
    } else if (newTab === 'expense') {
      const expCats = categories.filter(c => c.type === 'expense');
      if (expCats.length > 0) setCategoryId(expCats[0]._id);
    }
  };

  const selectedAccount = accounts.find(a => a._id === accountId);
  const isOutgoing = ['expense', 'loan_given', 'transfer', 'debt_payment'].includes(tab);
  const hasInsufficientFunds = isOutgoing && selectedAccount && selectedAccount.balance < Number(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !accountId) {
      alert('Please select a payment account and enter a valid amount');
      return;
    }

    // Client-side Sufficient Balance Check
    if (isOutgoing && selectedAccount && selectedAccount.balance < Number(amount)) {
      alert(`⚠️ Insufficient Funds!\n\nYour account "${selectedAccount.name}" has a current balance of ${currency.symbol} ${selectedAccount.balance}.\n\nYou cannot ${tab === 'loan_given' ? 'lend' : tab === 'expense' ? 'spend' : 'transfer'} ${currency.symbol} ${amount} because your account does not have enough money.`);
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'income' || tab === 'expense') {
        await api.createTransaction({
          type: tab,
          amount: Number(amount),
          accountId,
          categoryId: categoryId || undefined,
          personName,
          date,
          description: description || (tab === 'income' ? 'Income' : 'Expense'),
          note
        });
      } else if (tab === 'loan_given') {
        await api.giveLoan({
          personName,
          amount: Number(amount),
          dateGiven: date,
          dueDate,
          accountId,
          note
        });
      } else if (tab === 'debt_received') {
        await api.borrowDebt({
          creditorName: personName,
          type: debtType,
          amount: Number(amount),
          dateReceived: date,
          dueDate,
          accountId,
          note
        });
      } else if (tab === 'loan_repayment') {
        if (!selectedLoanId) {
          alert('Select active loan to repay');
          setSubmitting(false);
          return;
        }
        await api.repayLoan(selectedLoanId, {
          amount: Number(amount),
          accountId,
          date,
          note
        });
      } else if (tab === 'debt_payment') {
        if (!selectedDebtId) {
          alert('Select active debt to pay');
          setSubmitting(false);
          return;
        }
        await api.payDebt(selectedDebtId, {
          amount: Number(amount),
          accountId,
          date,
          note
        });
      } else if (tab === 'transfer') {
        if (!toAccountId || accountId === toAccountId) {
          alert('Select a valid destination account');
          setSubmitting(false);
          return;
        }
        await api.createTransaction({
          type: 'transfer',
          amount: Number(amount),
          accountId,
          toAccountId,
          date,
          description: 'Transfer between accounts',
          note
        });
      }

      triggerRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save transaction: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-400" />
            Quick Financial Entry
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('income')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'income' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" /> Money In
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('expense')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'expense' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="h-4 w-4" /> Money Out
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('loan_given')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'loan_given' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <HandCoins className="h-4 w-4" /> Give Loan
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('debt_received')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'debt_received' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Borrow Debt
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('transfer')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap ${
              tab === 'transfer' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" /> Transfer
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1">
          
          {/* Insufficient Balance Warning Banner */}
          {hasInsufficientFunds && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Insufficient Funds: </span>
                Selected account balance is {currency.symbol} {selectedAccount.balance}. You cannot {tab === 'loan_given' ? 'lend' : 'spend'} {currency.symbol} {amount}.
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Amount ({currency.symbol})</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none transition ${
                hasInsufficientFunds ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
              required
              autoFocus
            />
          </div>

          {/* Account selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {tab === 'transfer' ? 'From Account' : 'Payment Account'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            >
              {accounts.length === 0 && <option value="">Loading accounts...</option>}
              {accounts.map(acc => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({currency.symbol} {acc.balance})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Target Account */}
          {tab === 'transfer' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">To Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Destination Account</option>
                {accounts.filter(a => a._id !== accountId).map(acc => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({currency.symbol} {acc.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Income Category */}
          {tab === 'income' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Income Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {incomeCategories.length === 0 && <option value="">Select Category</option>}
                {incomeCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Expense Category */}
          {tab === 'expense' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Expense Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {expenseCategories.length === 0 && <option value="">Select Category</option>}
                {expenseCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Person Name (for Loans / Debts / Income source) */}
          {(tab === 'loan_given' || tab === 'debt_received' || tab === 'income') && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {tab === 'loan_given' ? 'Borrower Person Name' : tab === 'debt_received' ? 'Creditor / Employer Name' : 'Payer / Company (Optional)'}
              </label>
              <input
                type="text"
                placeholder="e.g. Ahmed, Bilal"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required={tab === 'loan_given' || tab === 'debt_received'}
              />
            </div>
          )}

          {/* Salary Advance Type Selector */}
          {tab === 'debt_received' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Debt Type</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="borrowed">Borrowed Money</option>
                <option value="salary_advance">Salary Received as Advance / Debt</option>
                <option value="other">Other Obligation</option>
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            {(tab === 'loan_given' || tab === 'debt_received') && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Expected Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Description & Note */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Note / Description</label>
            <input
              type="text"
              placeholder="e.g. August salary, grocery expense, lent for laptop"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setNote(e.target.value); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || hasInsufficientFunds}
              className={`w-full font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
                hasInsufficientFunds
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25'
              }`}
            >
              <Check className="h-5 w-5" />
              <span>{submitting ? 'Recording Entry...' : hasInsufficientFunds ? 'Insufficient Account Balance' : 'Save Financial Record'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
