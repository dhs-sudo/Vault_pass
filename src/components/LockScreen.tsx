import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { Lock, KeyRound, Shield, ArrowRight, Sparkles } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlockVault, masterPasswordHint } = useVault();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockVault(password);
    if (!success) {
      setError(true);
    }
  };

  const handleQuickDemoUnlock = () => {
    unlockVault('master123');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070714] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-fuchsia-400 p-[2px] mx-auto shadow-2xl shadow-pink-500/25">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-pink-400">
            <Lock className="w-9 h-9" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-300 bg-clip-text text-transparent">
            CipherKey Vault
          </h1>
          <p className="text-xs text-pink-300/80 mt-1 font-mono">
            Zero-knowledge encrypted · 2FA & Backup Codes
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Enter your master password to unlock and decrypt your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Master Password"
              className={`w-full px-4 py-2.5 bg-slate-900/90 border ${
                error ? 'border-rose-500' : 'border-purple-500/30 focus:border-pink-500'
              } rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all`}
              autoFocus
            />
            {error && (
              <p className="text-[11px] text-rose-400 mt-1.5 text-left font-mono">
                Incorrect master password. Hint: "{masterPasswordHint}"
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick demo helper */}
        <div className="pt-2 border-t border-slate-900">
          <button
            onClick={handleQuickDemoUnlock}
            className="text-xs text-pink-400/90 hover:text-pink-300 font-medium inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Quick Demo Unlock ("master123")</span>
          </button>
        </div>
      </div>
    </div>
  );
};
