import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock } from 'lucide-react';

export function PasscodeLock() {
  const { unlockApp } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!pin) {
      setError(true);
      return;
    }
    const success = unlockApp(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <Lock className="h-8 w-8" />
        </div>
        
        <div>
          <h2 className="text-xl font-extrabold text-white">Finance Control Center</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your PIN passcode to unlock financial records</p>
        </div>

        <form onSubmit={handleUnlock} autoComplete="off" className="space-y-4">
          <div className="relative">
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN"
              autoComplete="new-password"
              name="app-security-pin-code"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold">Incorrect PIN code. Please enter the correct PIN.</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            Unlock App
          </button>
        </form>
      </div>
    </div>
  );
}
