import React from 'react';
import { useVault } from '../context/VaultContext';
import { VaultCategory } from '../types/vault';
import {
  KeyRound,
  ShieldCheck,
  CreditCard,
  FileText,
  Terminal,
  Lock,
  Download,
  RefreshCw,
  FolderSync,
  Code2,
  DollarSign,
  Briefcase,
  MessageSquare,
  Tv,
  ShoppingBag,
  Wand2,
  FileBadge,
  ToggleLeft,
  ToggleRight,
  Plus,
  Smartphone,
  Cloud,
  X,
  Sparkles,
} from 'lucide-react';
import { User } from '../services/firebase';

interface SidebarProps {
  onOpenGenerator: () => void;
  onOpenExportImport: () => void;
  onOpenCloudSync: () => void;
  onAddNew?: (category?: VaultCategory) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenGenerator,
  onOpenExportImport,
  onOpenCloudSync,
  onAddNew,
  isMobileOpen = false,
  onCloseMobile,
  currentUser,
}) => {
  const {
    items,
    selectedCategory,
    setSelectedCategory,
    lockVault,
    resetVaultToDefault,
    autoCategoryEnabled,
    setAutoCategoryEnabled,
    batchAutoCategorizeAll,
    showToast,
  } = useVault();

  // Stats
  const totalCount = items.length;
  const loginCount = items.filter((i) => i.category === 'login').length;
  const identityCount = items.filter((i) => i.category === 'identity_doc').length;
  const cardCount = items.filter((i) => i.category === 'card').length;
  const noteCount = items.filter((i) => i.category === 'secure_note').length;
  const apiKeyCount = items.filter((i) => i.category === 'api_key').length;
  const favoritesCount = items.filter((i) => i.isFavorite).length;

  // Custom Categories Breakdown
  const customCategoryItems = items.filter((i) => i.category === 'custom');
  const customCategoriesMap = customCategoryItems.reduce((acc, item) => {
    const catName = item.customCategoryName?.trim() || 'Custom Category';
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const customCategoryNames = Object.keys(customCategoriesMap).sort();

  // Smart Categories Stats
  const devCount = items.filter((i) => i.serviceCategory === 'developer').length;
  const financeCount = items.filter((i) => i.serviceCategory === 'finance').length;
  const productivityCount = items.filter((i) => i.serviceCategory === 'productivity').length;
  const socialCount = items.filter((i) => i.serviceCategory === 'social').length;
  const entertainmentCount = items.filter((i) => i.serviceCategory === 'entertainment').length;
  const shoppingCount = items.filter((i) => i.serviceCategory === 'shopping').length;

  const lowBackupCodeCount = items.filter((i) => {
    const remaining = (i.backupCodes || []).filter((c) => !c.isUsed).length;
    return remaining > 0 && remaining <= 2;
  }).length;

  const totpCount = items.filter((i) => !!i.totpSecret).length;

  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setInstallPrompt(null);
      } catch (err) {
        showToast('Install prompt opened. Check your phone screen.', 'info');
      }
    } else {
      showToast('Swipe down to refresh the page once, then tap Chrome menu (⋮) -> Install App.', 'info');
    }
  };

  const selectCatAndClose = (id: string) => {
    setSelectedCategory(id as any);
    onCloseMobile?.();
  };

  const navItems = [
    { id: 'all', label: 'All Vault Items', icon: ShieldCheck, count: totalCount },
    { id: 'login', label: 'Logins & 2FA', icon: KeyRound, count: loginCount },
    { id: 'identity_doc', label: 'Personal Documents', icon: FileBadge, count: identityCount },
    { id: 'custom', label: 'Custom Categories', icon: FolderSync, count: customCategoryItems.length },
    { id: 'card', label: 'Payment Cards', icon: CreditCard, count: cardCount },
    { id: 'secure_note', label: 'Secure Notes', icon: FileText, count: noteCount },
    { id: 'api_key', label: 'API Keys & Secrets', icon: Terminal, count: apiKeyCount },
  ];

  const smartNavItems = [
    { id: 'smart_developer', label: 'Developer & Cloud', icon: Code2, count: devCount },
    { id: 'smart_finance', label: 'Finance & Banking', icon: DollarSign, count: financeCount },
    { id: 'smart_productivity', label: 'Productivity & Work', icon: Briefcase, count: productivityCount },
    { id: 'smart_social', label: 'Social & Messaging', icon: MessageSquare, count: socialCount },
    { id: 'smart_entertainment', label: 'Entertainment & Media', icon: Tv, count: entertainmentCount },
    { id: 'smart_shopping', label: 'Shopping & Commerce', icon: ShoppingBag, count: shoppingCount },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-slate-900/95 md:bg-slate-900/90 border-r border-slate-800 flex flex-col h-full select-none shrink-0 z-50 transition-all duration-200 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl flex'
            : 'hidden md:flex w-64'
        }`}
      >
        {/* Brand Header with Purple & Bubblegum Pink Gradient */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900 to-pink-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-fuchsia-400 p-[1.5px] shadow-md shadow-pink-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-pink-400">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-300 tracking-tight text-base block leading-none">
                CipherKey
              </span>
              <span className="text-[11px] text-pink-300/70 font-mono tracking-tight mt-1 block">
                Vault & 2FA Autofill
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={lockVault}
              title="Lock Vault"
              className="p-1.5 text-slate-400 hover:text-pink-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                title="Close Menu"
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg md:hidden transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            )}
          </div>
        </div>

        {/* Cloud Sync & Account Bar */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onOpenCloudSync();
              onCloseMobile?.();
            }}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-pink-950/50 hover:from-purple-900/60 hover:to-pink-900/60 border border-purple-500/30 flex items-center justify-between text-left transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                  <span>{currentUser ? 'Cloud Synced' : 'Cloud Sync'}</span>
                  {currentUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                </div>
                <div className="text-[10px] text-pink-300/80 font-mono truncate">
                  {currentUser ? currentUser.email : 'Google / Custom Domain'}
                </div>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          </button>
        </div>

        {/* Main Categories */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Item Types */}
          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider font-mono">
              Vault Types
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectCatAndClose(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-pink-300 font-semibold border-l-2 border-pink-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Auto-Categories */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider font-mono">
                Smart Categories
              </span>
              <button
                onClick={() => batchAutoCategorizeAll()}
                title="Auto-scan and categorize all vault items from website domains"
                className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-mono transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Classify</span>
              </button>
            </div>
            <div className="space-y-0.5">
              {smartNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectCatAndClose(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-pink-300 font-semibold border-l-2 border-pink-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-pink-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Categories Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider font-mono">
                Custom Categories
              </span>
              <button
                onClick={() => {
                  onAddNew?.('custom');
                  onCloseMobile?.();
                }}
                title="Add item in a custom category"
                className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5 font-mono transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Category</span>
              </button>
            </div>

            <div className="space-y-0.5">
              {customCategoryNames.length === 0 ? (
                <button
                  onClick={() => {
                    onAddNew?.('custom');
                    onCloseMobile?.();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-md text-[11px] text-slate-500 hover:text-pink-300 hover:bg-slate-800/40 transition-colors italic flex items-center justify-between"
                >
                  <span>+ Create custom category...</span>
                </button>
              ) : (
                customCategoryNames.map((name) => {
                  const filterId = `custom_name:${name}`;
                  const isActive = selectedCategory === filterId;
                  const count = customCategoriesMap[name] || 0;
                  return (
                    <button
                      key={name}
                      onClick={() => selectCatAndClose(filterId)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 font-semibold border-l-2 border-pink-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FolderSync className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-pink-400' : 'text-slate-500'}`} />
                        <span className="truncate">{name}</span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider font-mono">
              Quick Filters
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => selectCatAndClose('totp_active')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === 'totp_active'
                    ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-pink-300 font-semibold border-l-2 border-pink-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2FA Active (TOTP)</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {totpCount}
                </span>
              </button>

              <button
                onClick={() => selectCatAndClose('low_backup')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === 'low_backup'
                    ? 'bg-amber-500/15 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <span>Low Backup Codes</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-amber-400">
                  {lowBackupCodeCount}
                </span>
              </button>

              <button
                onClick={() => selectCatAndClose('favorites')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === 'favorites'
                    ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-pink-300 font-semibold border-l-2 border-pink-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span>Favorites</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {favoritesCount}
                </span>
              </button>
            </div>
          </div>

          {/* Tools & Utilities */}
          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider font-mono">
              Tools & Audit
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => selectCatAndClose('autofill_playground')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === 'autofill_playground'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-pink-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 shrink-0 text-pink-400" />
                  <span className="truncate">Autofill Simulator</span>
                </div>
              </button>

              <button
                onClick={() => selectCatAndClose('security_audit')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedCategory === 'security_audit'
                    ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/15 text-pink-300 font-semibold border-l-2 border-pink-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="truncate">Security Audit</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenGenerator();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Password Generator</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Utility Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          {/* Auto-categorization option toggle */}
          <div className="px-2 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-300 font-medium">Auto-Categorize</div>
            <button
              onClick={() => setAutoCategoryEnabled(!autoCategoryEnabled)}
              className={`text-xs font-medium flex items-center gap-1 ${
                autoCategoryEnabled ? 'text-pink-400 font-semibold' : 'text-slate-500'
              }`}
            >
              {autoCategoryEnabled ? (
                <>
                  <span>Active</span>
                  <ToggleRight className="w-4 h-4 text-pink-400" />
                </>
              ) : (
                <>
                  <span>Off</span>
                  <ToggleLeft className="w-4 h-4 text-slate-500" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              onOpenExportImport();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export / Import Vault</span>
          </button>

          <button
            onClick={() => {
              resetVaultToDefault();
              onCloseMobile?.();
            }}
            title="Reset to sample vault items"
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Sample Vault</span>
          </button>

          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="w-full mt-1 flex items-center justify-center gap-2 px-2.5 py-2 text-xs font-medium text-pink-200 bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/30 rounded-xl transition-all shadow-sm group"
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
              <span>Install on Pixel / Phone</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
