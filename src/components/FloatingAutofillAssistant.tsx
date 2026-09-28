import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem } from '../types/vault';
import { generateTOTPCode, getTOTPTimeRemaining, formatOtpDisplay } from '../utils/totp';
import {
  Zap,
  KeyRound,
  Shield,
  Copy,
  Check,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';

interface FloatingAutofillAssistantProps {
  onOpenItem: (item: VaultItem) => void;
}

export const FloatingAutofillAssistant: React.FC<FloatingAutofillAssistantProps> = ({
  onOpenItem,
}) => {
  const {
    items,
    activeItem,
    consumeNextBackupCode,
    showToast,
  } = useVault();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(activeItem || items[0] || null);

  // Live TOTP for selected item in quick bar
  const [totpCode, setTotpCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
    if (activeItem) {
      setSelectedItem(activeItem);
    }
  }, [activeItem]);

  useEffect(() => {
    if (!selectedItem?.totpSecret) {
      setTotpCode('------');
      return;
    }

    let isMounted = true;
    const updateCode = async () => {
      const code = await generateTOTPCode(selectedItem.totpSecret!, selectedItem.totpDigits || 6, 30);
      if (isMounted) {
        setTotpCode(code);
        setRemaining(getTOTPTimeRemaining(30).remainingSeconds);
      }
    };

    updateCode();
    const interval = setInterval(() => {
      const { remainingSeconds } = getTOTPTimeRemaining(30);
      setRemaining(remainingSeconds);
      if (remainingSeconds === 30 || remainingSeconds === 29) {
        updateCode();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedItem]);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q)
    );
  });

  const nextBackupCode = selectedItem?.backupCodes?.find((bc) => !bc.isUsed);
  const unusedBackupCount = selectedItem?.backupCodes?.filter((bc) => !bc.isUsed).length || 0;

  const handleCopyTotp = () => {
    if (totpCode && totpCode !== '------') {
      navigator.clipboard.writeText(totpCode);
      showToast(`Autofilled & Copied 2FA code: ${totpCode}`, 'success');
    }
  };

  const handleAutoFillBackupCode = () => {
    if (!selectedItem) return;
    consumeNextBackupCode(selectedItem.id, 'Autofill Quick Bar');
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-full shadow-xl shadow-cyan-950/40 backdrop-blur transition-all hover:scale-105"
        >
          <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>Autofill Quick Assistant</span>
          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      ) : (
        <div className="w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-slate-100">
                Autofill Quick Bar
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Item Selector */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search account to autofill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1">
              {filteredItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center justify-between ${
                    selectedItem?.id === item.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  {item.totpSecret && (
                    <span className="text-[9px] font-mono text-cyan-400">2FA</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Hub for Selected Item */}
          {selectedItem ? (
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate">
                  {selectedItem.title}
                </span>
                <button
                  onClick={() => {
                    onOpenItem(selectedItem);
                    setIsOpen(false);
                  }}
                  className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Open Item</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* TOTP Quick Autofill */}
              {selectedItem.totpSecret ? (
                <div className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Live 2FA Code ({remaining}s)</div>
                    <div className="text-sm font-mono font-bold text-cyan-300 tracking-wider">
                      {formatOtpDisplay(totpCode)}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyTotp}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] rounded transition-colors"
                  >
                    Auto-Fill TOTP
                  </button>
                </div>
              ) : (
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-500 italic text-center">
                  No 2FA configured
                </div>
              )}

              {/* Backup Code Quick Autofill */}
              {nextBackupCode ? (
                <div className="p-2 bg-slate-950 rounded border border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-emerald-400">
                      Next Backup Code ({unusedBackupCount} left)
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-200">
                      {nextBackupCode.code}
                    </div>
                  </div>
                  <button
                    onClick={handleAutoFillBackupCode}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded transition-colors"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              ) : (
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-500 italic text-center">
                  No unused backup codes
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500">
              Select an account above
            </div>
          )}
        </div>
      )}
    </div>
  );
};
