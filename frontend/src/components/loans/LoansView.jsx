import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { HandCoins, Plus, ArrowLeft, CheckCircle2, User, Calendar, History, Check } from 'lucide-react';

export function LoansView({ onOpenQuickAdd, onOpenRepayModal }) {
  const { currency, refreshTrigger } = useApp();
  const [loans, setLoans] = useState([]);
  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [personDetail, setPersonDetail] = useState(null);
  const [showSettled, setShowSettled] = useState(false); // Default: Hide settled loans from history
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedPersonId) {
      loadPersonDetail(selectedPersonId);
    }
  }, [selectedPersonId, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lns, ppl] = await Promise.all([
        api.getLoans(),
        api.getPeople()
      ]);
      setLoans(lns);
      setPeople(ppl);
    } catch (err) {
      console.error('Failed to load loans data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonDetail = async (personId) => {
    try {
      setDetailLoading(true);
      const data = await api.getPersonDetail(personId);
      setPersonDetail(data);
    } catch (err) {
      console.error('Failed to load person detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalLentAll = loans.reduce((sum, l) => sum + l.originalAmount, 0);
  const totalOutstandingAll = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalRecoveredAll = totalLentAll - totalOutstandingAll;

  // Filter people: Default to showing ONLY active people with remaining loans > 0
  const activePeopleWithLoans = people.filter(p => p.financials.remainingLoans > 0).map(p => {
    const personLoans = loans.filter(l => l.person && l.person._id === p._id);
    return {
      _id: p._id,
      name: p.name,
      phone: p.phone,
      totalTaken: p.financials.totalLent,
      totalRepaid: p.financials.totalLoanRepaid,
      remaining: p.financials.remainingLoans,
      loansCount: personLoans.length,
      activeLoan: personLoans.find(l => l.status === 'active') || personLoans[0]
    };
  });

  const settledPeopleWithLoans = people.filter(p => p.financials.totalLent > 0 && p.financials.remainingLoans === 0).map(p => {
    const personLoans = loans.filter(l => l.person && l.person._id === p._id);
    return {
      _id: p._id,
      name: p.name,
      phone: p.phone,
      totalTaken: p.financials.totalLent,
      totalRepaid: p.financials.totalLoanRepaid,
      remaining: 0,
      loansCount: personLoans.length
    };
  });

  const displayedPeople = showSettled ? settledPeopleWithLoans : activePeopleWithLoans;

  // If viewing a specific Person Detail Page
  if (selectedPersonId && personDetail) {
    const { person, loans: personLoans, transactions: personTxs } = personDetail;
    const loanTxs = personTxs.filter(tx => tx.type === 'loan_given' || tx.type === 'loan_repayment');
    
    const totalTaken = personLoans.reduce((sum, l) => sum + l.originalAmount, 0);
    const totalRemaining = personLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const activeLoan = personLoans.find(l => l.status === 'active');

    return (
      <div className="space-y-6">
        
        {/* Navigation Back Button & Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => { setSelectedPersonId(null); setPersonDetail(null); }}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Active Loans List
          </button>

          <div className="flex items-center gap-2">
            {activeLoan && (
              <button
                onClick={() => onOpenRepayModal(activeLoan)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <CheckCircle2 className="h-4 w-4" /> Record Repayment
              </button>
            )}

            <button
              onClick={() => onOpenQuickAdd('loan_given')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="h-4 w-4" /> Give Additional Loan
            </button>
          </div>
        </div>

        {/* Person Detail Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center text-xl font-bold">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white capitalize">{person.name}</h2>
                <p className="text-xs text-slate-400">Loan & Repayment Ledger Details</p>
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 px-5 py-3 rounded-2xl text-right shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Taken</span>
              <span className="text-2xl font-black text-blue-400 block mt-0.5">
                {formatCurrency(totalTaken, currency.symbol)}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Remaining: <strong className={totalRemaining > 0 ? "text-amber-400" : "text-emerald-400"}>
                  {totalRemaining > 0 ? formatCurrency(totalRemaining, currency.symbol) : 'Settled (0)'}
                </strong>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <History className="h-4 w-4 text-blue-400" />
              Loan History Ledger
            </h3>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : loanTxs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                <p className="text-xs">No transactions found for {person.name}.</p>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {loanTxs.map(tx => {
                      const isLent = tx.type === 'loan_given';
                      return (
                        <tr key={tx._id} className="hover:bg-slate-800/40 transition">
                          <td className="px-5 py-3.5 font-medium whitespace-nowrap text-slate-400">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${isLent ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                              {tx.description || (isLent ? `Loan Given to ${person.name}` : `Repayment from ${person.name}`)}
                            </div>
                            {tx.note && <div className="text-[11px] text-slate-400 mt-0.5">{tx.note}</div>}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap font-bold text-sm">
                            <span className={isLent ? 'text-blue-400' : 'text-emerald-400'}>
                              {isLent ? '+' : '-'}{formatCurrency(tx.amount, currency.symbol)}
                            </span>
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

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-blue-400" />
            Money You Lent (Loans)
          </h2>
          <p className="text-xs text-slate-400">Active loan receivables automatically clear out when fully settled</p>
        </div>

        <button
          onClick={() => onOpenQuickAdd('loan_given')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
        >
          <Plus className="h-4 w-4" /> Give New Loan
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Money Lent</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalLentAll, currency.symbol)}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Recovered</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalRecoveredAll, currency.symbol)}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">Outstanding Receivable</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {formatCurrency(totalOutstandingAll, currency.symbol)}
          </p>
        </div>
      </div>

      {/* People Loan List Box (Filter Tab: Active vs Settled History) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              {showSettled ? 'Settled Loans History' : 'Active People Given Loans'}
            </h3>
            <span className="text-xs text-slate-500">({displayedPeople.length})</span>
          </div>

          {/* Filter Toggle: Active Loans vs Settled History */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setShowSettled(false)}
              className={`px-3 py-1.5 rounded-lg transition ${!showSettled ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Active Loans ({activePeopleWithLoans.length})
            </button>
            <button
              onClick={() => setShowSettled(true)}
              className={`px-3 py-1.5 rounded-lg transition ${showSettled ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Settled History ({settledPeopleWithLoans.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : displayedPeople.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <p className="text-sm">
              {showSettled ? 'No settled loans history found.' : 'No active outstanding loans! All loans have been cleared out.'}
            </p>
            {!showSettled && (
              <button
                onClick={() => onOpenQuickAdd('loan_given')}
                className="inline-flex items-center gap-2 text-xs bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold"
              >
                <Plus className="h-4 w-4" /> Record First Loan Given
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPeople.map(p => (
              <div
                key={p._id}
                onClick={() => setSelectedPersonId(p._id)}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-blue-500/60 rounded-2xl p-4 flex items-center justify-between shadow-lg transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white rounded-xl flex items-center justify-center font-bold text-base transition">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition capitalize">
                      {p.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Total Taken: {formatCurrency(p.totalTaken, currency.symbol)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Remaining</span>
                    <span className={`text-base font-extrabold ${p.remaining > 0 ? 'text-amber-400' : 'text-emerald-400 flex items-center justify-end gap-1'}`}>
                      {p.remaining > 0 ? formatCurrency(p.remaining, currency.symbol) : <><Check className="h-4 w-4" /> Settled (0)</>}
                    </span>
                  </div>

                  <div className="bg-slate-900 group-hover:bg-blue-600 text-slate-400 group-hover:text-white p-2 rounded-xl transition">
                    &rarr;
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
