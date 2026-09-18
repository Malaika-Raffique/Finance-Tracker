import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Users, User, Phone, HandCoins, CreditCard, ChevronRight, X } from 'lucide-react';

export function PeopleView() {
  const { currency, refreshTrigger } = useApp();
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personDetails, setPersonDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, [refreshTrigger]);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const res = await api.getPeople();
      setPeople(res);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPerson = async (person) => {
    setSelectedPerson(person);
    try {
      const details = await api.getPersonDetail(person._id);
      setPersonDetails(details);
    } catch (err) {
      console.error('Error fetching person details:', err);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-purple-400" />
          People Financial Profiles
        </h2>
        <p className="text-xs text-slate-400">View individual financial relationships, lending/borrowing history per person</p>
      </div>

      {/* People Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : people.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center text-slate-500">
          <p className="text-sm">No contacts with recorded loan or debt activity yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map(p => {
            const { remainingLoans, remainingDebts, netBalance } = p.financials;

            return (
              <div
                key={p._id}
                onClick={() => handleSelectPerson(p)}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-purple-500/40 transition cursor-pointer space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center font-bold text-base">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{p.name}</h3>
                      {p.phone && <p className="text-xs text-slate-400">{p.phone}</p>}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block">They Owe You</span>
                    <span className="font-bold text-blue-400">{formatCurrency(remainingLoans, currency.symbol)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">You Owe Them</span>
                    <span className="font-bold text-amber-400">{formatCurrency(remainingDebts, currency.symbol)}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Net Position:</span>
                  <span className={`font-bold ${netBalance > 0 ? 'text-blue-400' : netBalance < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {netBalance > 0 && `Owes you ${formatCurrency(netBalance, currency.symbol)}`}
                    {netBalance < 0 && `You owe ${formatCurrency(Math.abs(netBalance), currency.symbol)}`}
                    {netBalance === 0 && 'Settled (0)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Person Detail History Modal */}
      {selectedPerson && personDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center font-bold">
                  {selectedPerson.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPerson.name}</h3>
                  <p className="text-xs text-slate-400">Complete Financial History</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedPerson(null); setPersonDetails(null); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction Ledger History</h4>
              
              {personDetails.transactions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No transactions recorded for this contact.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {personDetails.transactions.map(tx => (
                    <div key={tx._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{tx.description}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(tx.date)} • {tx.type.replace('_', ' ')}</span>
                      </div>
                      <span className="font-bold text-slate-200">
                        {formatCurrency(tx.amount, currency.symbol)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
