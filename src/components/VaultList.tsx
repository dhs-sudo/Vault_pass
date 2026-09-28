import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem } from '../types/vault';
import { generateTOTPCode, getTOTPTimeRemaining, formatOtpDisplay } from '../utils/totp';
import {
  Search,
  Plus,
  KeyRound,
  CreditCard,
  FileText,
  Terminal,
  Star,
  Copy,
  Check,
  ShieldAlert,
  Clock,
  ExternalLink,
  FileBadge,
  Globe,
  Car,
  Shield,
  AppWindow,
  FileKey,
  FolderSync,
} from 'lucide-react';

interface VaultListProps {
  onAddNew: () => void;
}

// Mini TOTP ticker component for list items
const MiniTotpDisplay: React.FC<{ secret: string; digits?: 6 | 8 }> = ({ secret, digits = 6 }) => {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);
  const [copied, setCopied] = useState(false);
  const { showToast } = useVault();

  useEffect(() => {
    let isMounted = true;

    const updateCode = async () => {
      const current = await generateTOTPCode(secret, digits, 30);
      if (isMounted) {
        setCode(current);
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
  }, [secret, digits]);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (code && code !== '------') {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast(`Copied 2FA code: ${code}`, 'success');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isLowTime = remaining <= 5;

  return (
    <div
      onClick={copyCode}
      title={`Click to copy live code (${remaining}s remaining)`}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800 text-xs font-mono transition-colors cursor-pointer group/totp"
    >
      <span className={`text-[10px] tabular-nums font-semibold ${isLowTime ? 'text-rose-400' : 'text-cyan-400'}`}>
        {remaining}s
      </span>
      <span className="text-slate-200 group-hover/totp:text-cyan-300 font-semibold tracking-wider tabular-nums">
        {formatOtpDisplay(code)}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 group-hover/totp:text-cyan-300 opacity-60 group-hover/totp:opacity-100 shrink-0" />
      )}
    </div>
  );
};

export const VaultList: React.FC<VaultListProps> = ({ onAddNew }) => {
  const {
    items,
    activeItemId,
    setActiveItemId,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    toggleFavorite,
  } = useVault();

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchUser = item.username.toLowerCase().includes(q);
      const matchUrl = item.websiteUrl.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const matchDocNumber = item.identityDoc?.documentNumber?.toLowerCase().includes(q);
      const matchDocName = item.identityDoc?.fullName?.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchUrl && !matchTags && !matchDocNumber && !matchDocName) {
        return false;
      }
    }

    // Category / Filter selection
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return item.isFavorite;
    if (selectedCategory === 'totp_active') return !!item.totpSecret;
    if (selectedCategory === 'low_backup') {
      if (!item.backupCodes || item.backupCodes.length === 0) return false;
      const unused = item.backupCodes.filter((bc) => !bc.isUsed).length;
      return unused <= 1;
    }

    // Smart categories
    if (selectedCategory === 'smart_developer') return item.serviceCategory === 'developer';
    if (selectedCategory === 'smart_finance') return item.serviceCategory === 'finance';
    if (selectedCategory === 'smart_productivity') return item.serviceCategory === 'productivity';
    if (selectedCategory === 'smart_social') return item.serviceCategory === 'social';
    if (selectedCategory === 'smart_entertainment') return item.serviceCategory === 'entertainment';
    if (selectedCategory === 'smart_shopping') return item.serviceCategory === 'shopping';

    // Custom Categories
    if (selectedCategory === 'custom') return item.category === 'custom';
    if (selectedCategory.startsWith('custom_name:')) {
      const targetName = selectedCategory.replace('custom_name:', '').toLowerCase();
      return item.category === 'custom' && (item.customCategoryName?.toLowerCase() === targetName);
    }

    return item.category === selectedCategory;
  });

  const getCategoryIcon = (item: VaultItem) => {
    if (item.category === 'identity_doc') {
      const docType = item.identityDoc?.documentType;
      if (docType === 'passport') return <Globe className="w-4 h-4 text-emerald-400" />;
      if (docType === 'drivers_license') return <Car className="w-4 h-4 text-cyan-400" />;
      return <FileBadge className="w-4 h-4 text-teal-400" />;
    }

    switch (item.category) {
      case 'custom':
        return <FolderSync className="w-4 h-4 text-indigo-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'secure_note':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'api_key':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'login':
      default:
        return <KeyRound className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="w-80 md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
      {/* Top search & Action bar */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items, tags, logins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>
        </div>

        {/* Category count indicator (Zero-Pill discipline: unboxed text with · separator) */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span className="capitalize">
            {selectedCategory.startsWith('custom_name:')
              ? `Custom: ${selectedCategory.replace('custom_name:', '')}`
              : selectedCategory.replace('_', ' ')}
          </span>
          <span>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Vault List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <KeyRound className="w-8 h-8 mx-auto text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">No items found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first entry'}
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 rounded-md hover:bg-cyan-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Item</span>
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.id === activeItemId;
            const backupCodesCount = item.backupCodes?.length || 0;
            const unusedBackupCount = item.backupCodes?.filter((bc) => !bc.isUsed).length || 0;
            const isLowBackup = backupCodesCount > 0 && unusedBackupCount <= 1;

            return (
              <div
                key={item.id}
                onClick={() => setActiveItemId(item.id)}
                className={`p-3 cursor-pointer transition-colors relative group ${
                  isSelected
                    ? 'bg-slate-900/90 border-l-2 border-l-cyan-400'
                    : 'hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </h4>
                        {item.linkedApp && (
                          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/70 px-1 py-0.5 rounded border border-cyan-800/50 inline-flex items-center gap-0.5" title={`Linked to ${item.linkedApp.appName}`}>
                            <AppWindow className="w-2.5 h-2.5" />
                            <span>{item.linkedApp.appName}</span>
                          </span>
                        )}
                        {item.keyPass && (
                          <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/70 px-1 py-0.5 rounded border border-emerald-800/50 inline-flex items-center gap-0.5" title={`KeyPass: ${item.keyPass.name}`}>
                            <FileKey className="w-2.5 h-2.5" />
                            <span>{item.keyPass.type === 'passkey' ? 'Passkey' : 'Keyfile'}</span>
                          </span>
                        )}
                        {item.category === 'custom' && (
                          <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950/70 px-1 py-0.5 rounded border border-indigo-800/50 inline-flex items-center gap-0.5" title={`Custom Category: ${item.customCategoryName || 'Custom'}`}>
                            <FolderSync className="w-2.5 h-2.5" />
                            <span>{item.customCategoryName || 'Custom'}</span>
                          </span>
                        )}
                        {item.customFields && item.customFields.length > 0 && (
                          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/50 px-1 py-0.5 rounded border border-cyan-800/40 inline-flex items-center gap-0.5" title={`${item.customFields.length} custom option fields`}>
                            <span>⚡ {item.customFields.length} fields</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {item.identityDoc
                          ? `#${item.identityDoc.documentNumber} · ${item.identityDoc.fullName || 'Identity'}`
                          : item.username || (item.category === 'secure_note' ? 'Secure Note' : 'No username')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className={`p-1 rounded transition-colors ${
                      item.isFavorite
                        ? 'text-amber-400'
                        : 'text-slate-400 hover:text-slate-400 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                {/* 2FA TOTP & Backup Code Status Badges */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                  {item.totpSecret ? (
                    <MiniTotpDisplay secret={item.totpSecret} digits={item.totpDigits || 6} />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      No 2FA configured
                    </span>
                  )}

                  {backupCodesCount > 0 ? (
                    <div
                      className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                        isLowBackup ? 'text-amber-400 font-semibold' : 'text-slate-400'
                      }`}
                      title={`${unusedBackupCount} unused backup codes remaining out of ${backupCodesCount}`}
                    >
                      {isLowBackup && <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span>
                        {unusedBackupCount}/{backupCodesCount} codes
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      0 backup codes
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
