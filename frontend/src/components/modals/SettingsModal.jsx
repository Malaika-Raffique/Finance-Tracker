import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { X, Settings, Shield, Lock, FileSpreadsheet, Plus, Trash2, FileText, CheckCircle2 } from 'lucide-react';

export function SettingsModal({ onClose }) {
  const { currency, passcode, updatePasscode, triggerRefresh } = useApp();
  
  const [pinInput, setPinInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    updatePasscode(pinInput ? pinInput.trim() : null);
    alert(pinInput ? 'Passcode lock enabled!' : 'Passcode lock disabled!');
    setPinInput('');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.createCategory({ name: newCatName, type: newCatType });
      setNewCatName('');
      loadCategories();
    } catch (err) {
      alert('Error adding category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl space-y-4">
        
        {/* Sticky Header - Always Visible */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-400" />
            App Settings & Data Export
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto space-y-5 pr-1 text-xs flex-1">
          
          {/* Locked PKR Currency Notice */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Currency Standard</h4>
              <p className="text-slate-400 mt-0.5">Exclusively locked to Pakistani Rupee (PKR / Rs.)</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> PKR / Rs.
            </span>
          </div>

          {/* Security PIN Lock */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>PIN Passcode Security Lock</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {passcode ? '🔒 PIN Active' : '🔓 Unlocked'}
              </span>
            </div>
            
            <form onSubmit={handleSavePin} autoComplete="off" className="flex gap-3">
              <input
                type="password"
                maxLength={6}
                placeholder={passcode ? "Enter new PIN or leave blank to disable" : "Enter 4-6 digit PIN to lock app"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoComplete="new-password"
                name="settings-pin-code"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                Save PIN
              </button>
            </form>
          </div>

          {/* Custom Category Manager */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-sm">Categories Manager</h4>
            
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="New Custom Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
              >
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
              </select>
              <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map(cat => (
                <span
                  key={cat._id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 font-medium text-[11px]"
                >
                  <span>{cat.name} ({cat.type})</span>
                  {cat.isCustom && (
                    <button onClick={() => handleDeleteCategory(cat._id)} className="text-slate-400 hover:text-rose-400 ml-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* PDF & CSV Export Section */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-sm">Report & Ledger Export</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <a
                href={api.exportPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold p-3 rounded-xl transition text-center shadow-lg shadow-emerald-500/20 text-xs"
              >
                <FileText className="h-4 w-4" /> Export Complete PDF Statement
              </a>

              <a
                href={api.exportCsvUrl}
                download
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold p-3 rounded-xl transition text-center text-xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-amber-400" /> Export CSV Spreadsheet
              </a>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
