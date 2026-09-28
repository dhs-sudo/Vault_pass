import React from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem } from '../types/vault';
import { evaluatePasswordStrength } from '../utils/crypto';
import {
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SecurityAuditViewProps {
  onSelectItem: (item: VaultItem) => void;
  onOpenBatchCodes: (item: VaultItem) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  onSelectItem,
  onOpenBatchCodes,
}) => {
  const { items, autofillEvents } = useVault();

  // 1. Audit: Missing 2FA
  const missingTotpItems = items.filter(
    (i) => i.category === 'login' && !i.totpSecret
  );

  // 2. Audit: Low or exhausted backup codes (< 2 active codes)
  const lowBackupItems = items.filter((i) => {
    if (i.category !== 'login') return false;
    const unused = i.backupCodes?.filter((bc) => !bc.isUsed).length || 0;
    return unused <= 1;
  });

  // 3. Audit: Weak passwords (score < 2)
  const weakPasswordItems = items.filter((i) => {
    if (!i.password) return false;
    const strength = evaluatePasswordStrength(i.password);
    return strength.score <= 1;
  });

  // 4. Audit: Reused passwords
  const passwordCounts: Record<string, number> = {};
  items.forEach((i) => {
    if (i.password) {
      passwordCounts[i.password] = (passwordCounts[i.password] || 0) + 1;
    }
  });
  const reusedPasswordItems = items.filter(
    (i) => i.password && passwordCounts[i.password] > 1
  );

  const totalLoginAccounts = items.filter((i) => i.category === 'login').length;
  const totpProtectedCount = items.filter((i) => i.category === 'login' && !!i.totpSecret).length;
  const twoFactorPercentage = totalLoginAccounts > 0
    ? Math.round((totpProtectedCount / totalLoginAccounts) * 100)
    : 0;

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            Vault Security & Recovery Health Audit
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time analysis of authenticator coverage, backup code exhaustion, and password resilience.
        </p>
      </div>

      <div className="p-6 max-w-4xl space-y-6">
        {/* Metric Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="text-xs text-slate-400 font-medium">2FA Authenticator Coverage</div>
            <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
              {twoFactorPercentage}%
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {totpProtectedCount} of {totalLoginAccounts} logins protected
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="text-xs text-slate-400 font-medium">At-Risk Recovery Codes</div>
            <div className={`text-2xl font-mono font-bold tabular-nums ${lowBackupItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowBackupItems.length}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Accounts with ≤ 1 backup code
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="text-xs text-slate-400 font-medium">Weak or Reused Passwords</div>
            <div className={`text-2xl font-mono font-bold tabular-nums ${weakPasswordItems.length + reusedPasswordItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {weakPasswordItems.length + reusedPasswordItems.length}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Potential breach vulnerabilities
            </div>
          </div>
        </div>

        {/* Audit 1: Low Backup Codes Warning */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Low or Exhausted Backup Codes ({lowBackupItems.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-400/90 font-medium">
              High Risk of Lockout
            </span>
          </div>

          <p className="text-xs text-slate-400">
            If your 2FA authenticator device is lost, stolen, or damaged, you will be permanently locked out without active backup codes.
          </p>

          {lowBackupItems.length === 0 ? (
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>All accounts have sufficient emergency backup codes ready.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {lowBackupItems.map((item) => {
                const unused = item.backupCodes?.filter((bc) => !bc.isUsed).length || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-md border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono text-amber-400">
                        {unused === 0
                          ? '0 backup codes remaining — Critical!'
                          : `Only ${unused} backup code remaining`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenBatchCodes(item)}
                        className="px-2.5 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors"
                      >
                        Add Backup Codes
                      </button>
                      <button
                        onClick={() => onSelectItem(item)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="View Account"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit 2: Missing 2FA */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Logins Missing 2FA Authenticator ({missingTotpItems.length})
              </h3>
            </div>
          </div>

          {missingTotpItems.length === 0 ? (
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>All login accounts have active 2FA authenticator keys configured.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {missingTotpItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-md border border-slate-800"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.username}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Configure 2FA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Autofill Dispatch Activity Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Recent Autofill & Recovery Audit Trail
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Last {autofillEvents.length} events
            </span>
          </div>

          {autofillEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">
              No autofill events logged yet. Use the Autofill Simulator or quick bar to test.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {autofillEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs font-mono flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        evt.type === 'backup_code'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : evt.type === 'totp'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {evt.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-200 font-semibold">{evt.itemTitle}</span>
                    {evt.codeUsed && (
                      <span className="text-slate-400">({evt.codeUsed})</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
