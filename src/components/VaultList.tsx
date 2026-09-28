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
  Menu,
} from 'lucide-react';

interface VaultListProps {
  onAddNew: () => void;
  onOpenMobileMenu?: () => void;
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
    const interval = setInterval(updateCode, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret, digits]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(`2FA code ${code} copied to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy live 2FA code"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-purple-500/30 text-[11px] font-mono cursor-pointer hover:border-pink-500/60 transition-colors group"
    >
      <span className="text-[10px] text-pink-400 font-bold">{remaining}s</span>
      <span className="font-bold text-slate-100 tracking-wider">
        {formatOtpDisplay(code)}
      </span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 group-hover:text-pink-300" />
      )}
    </div>
  );
};

export const VaultList: React.FC<VaultListProps> = ({ onAddNew, onOpenMobileMenu }) => {
  const {
    items,
    activeItemId,
    setActiveItemId,
    toggleFavorite,
    selectedCategory,
    searchQuery,
    setSearchQuery,
  } = useVault();

  // Filter items based on selected category & search query
  const filteredItems = items.filter((item) => {
    // 1. Category Filter
    if (selectedCategory === 'favorites' && !item.isFavorite) return false;
    if (selectedCategory === 'totp_active' && !item.totpSecret) return false;
    if (selectedCategory === 'low_backup') {
      const remaining = (item.backupCodes || []).filter((c) => !c.isUsed).length;
      if (!(remaining > 0 && remaining <= 2)) return false;
    }
    if (selectedCategory.startsWith('smart_')) {
      const catKey = selectedCategory.replace('smart_', '');
      if (item.serviceCategory !== catKey) return false;
    }
    if (selectedCategory.startsWith('custom_name:')) {
      const targetName = selectedCategory.replace('custom_name:', '');
      if (item.category !== 'custom' || item.customCategoryName !== targetName) return false;
    }
    if (
      selectedCategory !== 'all' &&
      selectedCategory !== 'favorites' &&
      selectedCategory !== 'totp_active' &&
      selectedCategory !== 'low_backup' &&
      !selectedCategory.startsWith('smart_') &&
      !selectedCategory.startsWith('custom_name:') &&
      item.category !== selectedCategory
    ) {
      return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchUsername = item.username?.toLowerCase().includes(query);
      const matchUrl = item.websiteUrl?.toLowerCase().includes(query);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));
      const matchDoc = item.identityDoc && (
        item.identityDoc.documentNumber.toLowerCase().includes(query) ||
        item.identityDoc.fullName.toLowerCase().includes(query)
      );
      const matchCustom = item.customCategoryName && item.customCategoryName.toLowerCase().includes(query);
      const matchCustomFields = item.customFields && item.customFields.some((f) => 
        f.label.toLowerCase().includes(query) || f.value.toLowerCase().includes(query)
      );
      const matchKeyPass = item.keyPass && (
        item.keyPass.name.toLowerCase().includes(query) ||
        item.keyPass.content.toLowerCase().includes(query)
      );
      return Boolean(matchTitle || matchUsername || matchUrl || matchTags || matchDoc || matchCustom || matchCustomFields || matchKeyPass);
    }

    return true;
  });

  const getCategoryIcon = (item: VaultItem) => {
    switch (item.category) {
      case 'identity_doc':
        if (item.identityDoc?.documentType === 'passport') return <Globe className="w-4 h-4 text-pink-400" />;
        if (item.identityDoc?.documentType === 'drivers_license') return <Car className="w-4 h-4 text-purple-400" />;
        if (item.identityDoc?.documentType === 'id_card') return <FileBadge className="w-4 h-4 text-fuchsia-400" />;
        return <Shield className="w-4 h-4 text-pink-400" />;
      case 'login':
        return <KeyRound className="w-4 h-4 text-pink-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'secure_note':
        return <FileText className="w-4 h-4 text-fuchsia-400" />;
      case 'api_key':
        return <Terminal className="w-4 h-4 text-purple-400" />;
      case 'custom':
        return <FolderSync className="w-4 h-4 text-pink-400" />;
      default:
        return <KeyRound className="w-4 h-4 text-pink-400" />;
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
      {/* Top search & Action bar */}
      <div className="p-3 md:p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-pink-300 bg-slate-900 border border-purple-500/30 transition-colors shrink-0"
              title="Open Categories & Menu"
              aria-label="Open Categories & Menu"
            >
              <Menu className="w-5 h-5 text-pink-400" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items, tags, logins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 md:py-1.5 text-sm md:text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-pink-500/70 focus:ring-1 focus:ring-pink-500/40 transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm md:text-xs rounded-xl shadow-md shadow-pink-500/20 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Category count indicator */}
        <div className="flex items-center justify-between text-xs md:text-[11px] text-purple-300/80 px-1 font-mono">
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
            <KeyRound className="w-8 h-8 mx-auto text-pink-400/60" />
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl shadow-md shadow-pink-500/20 transition-all"
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
                className={`p-3.5 md:p-3 cursor-pointer transition-colors relative group ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-950/40 to-slate-900/90 border-l-2 border-l-pink-400'
                    : 'hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-slate-900 border border-purple-500/25 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm md:text-xs font-semibold text-slate-100 truncate group-hover:text-pink-300 transition-colors">
                          {item.title}
                        </h4>
                        {item.linkedApp && (
                          <span className="text-[9px] font-mono text-pink-300 bg-pink-950/70 px-1 py-0.5 rounded border border-pink-800/50 inline-flex items-center gap-0.5" title={`Linked to ${item.linkedApp.appName}`}>
                            <AppWindow className="w-2.5 h-2.5" />
                            <span>{item.linkedApp.appName}</span>
                          </span>
                        )}
                        {item.keyPass && (
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-950/70 px-1 py-0.5 rounded border border-purple-800/50 inline-flex items-center gap-0.5" title={`KeyPass: ${item.keyPass.name}`}>
                            <FileKey className="w-2.5 h-2.5" />
                            <span>{item.keyPass.type === 'passkey' ? 'Passkey' : 'Keyfile'}</span>
                          </span>
                        )}
                        {item.category === 'custom' && (
                          <span className="text-[9px] font-mono text-fuchsia-300 bg-fuchsia-950/70 px-1 py-0.5 rounded border border-fuchsia-800/50 inline-flex items-center gap-0.5" title={`Custom Category: ${item.customCategoryName || 'Custom'}`}>
                            <FolderSync className="w-2.5 h-2.5" />
                            <span>{item.customCategoryName || 'Custom'}</span>
                          </span>
                        )}
                        {item.customFields && item.customFields.length > 0 && (
                          <span className="text-[9px] font-mono text-pink-300 bg-pink-950/50 px-1 py-0.5 rounded border border-pink-800/40 inline-flex items-center gap-0.5" title={`${item.customFields.length} custom option fields`}>
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
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Sub-row: Active TOTP or Backup status */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    {item.totpSecret ? (
                      <MiniTotpDisplay secret={item.totpSecret} digits={item.totpDigits || 6} />
                    ) : item.websiteUrl ? (
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px] inline-block">
                        {item.websiteUrl.replace(/^https?:\/\//, '')}
                      </span>
                    ) : null}
                  </div>

                  {backupCodesCount > 0 && (
                    <div
                      title={`${unusedBackupCount} of ${backupCodesCount} backup codes remaining`}
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                        isLowBackup
                          ? 'bg-amber-950/70 text-amber-300 border-amber-800/70'
                          : 'bg-slate-900 text-purple-300 border-purple-800/50'
                      }`}
                    >
                      {isLowBackup && <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />}
                      <span>
                        {unusedBackupCount}/{backupCodesCount} codes
                      </span>
                    </div>
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
