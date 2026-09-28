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
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mx-auto shadow-2xl shadow-cyan-950/40">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-100">CipherKey Vault Locked</h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-knowledge encrypted. Enter your master password to decrypt credentials, 2FA keys, and backup codes.
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
              className={`w-full px-4 py-2.5 bg-slate-900 border ${
                error ? 'border-rose-500' : 'border-slate-800'
              } rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500`}
              autoFocus
            />
            {error && (
              <p className="text-[11px] text-rose-400 mt-1 text-left">
                Incorrect master password. Hint: "{masterPasswordHint}"
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-950/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick demo helper */}
        <div className="pt-2 border-t border-slate-900">
          <button
            onClick={handleQuickDemoUnlock}
            className="text-xs text-cyan-400/90 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Demo Unlock ("master123")</span>
          </button>
        </div>
      </div>
    </div>
  );
};
