import React from 'react';
import { useVault } from '../context/VaultContext';
import { VaultCategory } from '../types/vault';
import {
  KeyRound,
  ShieldCheck,
  CreditCard,
  FileText,
  Terminal,
  Star,
  AlertTriangle,
  PlaySquare,
  Sparkles,
  Lock,
  Download,
  Upload,
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
  Check,
  ToggleLeft,
  ToggleRight,
  Plus,
  Smartphone,
} from 'lucide-react';

interface SidebarProps {
  onOpenGenerator: () => void;
  onOpenExportImport: () => void;
  onAddNew?: (category?: VaultCategory) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenGenerator,
  onOpenExportImport,
  onAddNew,
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
  const customCategoryNames = Object.keys(customCategoriesMap);

  // Smart Categories Counts (auto-detected from app/website)
  const devCount = items.filter((i) => i.serviceCategory === 'developer').length;
  const financeCount = items.filter((i) => i.serviceCategory === 'finance').length;
  const productivityCount = items.filter((i) => i.serviceCategory === 'productivity').length;
  const socialCount = items.filter((i) => i.serviceCategory === 'social').length;
  const entertainmentCount = items.filter((i) => i.serviceCategory === 'entertainment').length;
  const shoppingCount = items.filter((i) => i.serviceCategory === 'shopping').length;

  // Count items with low backup codes (less than 2 active unused codes)
  const lowBackupCount = items.filter((i) => {
    if (!i.backupCodes || i.backupCodes.length === 0) return false;
    const unused = i.backupCodes.filter((bc) => !bc.isUsed).length;
    return unused <= 1;
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

  const navItems = [
    { id: 'all', label: 'All Vault Items', icon: ShieldCheck, count: totalCount },
    { id: 'login', label: 'Logins & 2FA', icon: KeyRound, count: loginCount },
    { id: 'identity_doc', label: 'Personal Documents', icon: FileBadge, count: identityCount },
    { id: 'custom', label: 'Custom Categories', icon: FolderSync, count: customCategoryItems.length },
    { id: 'card', label: 'Payment Cards', icon: CreditCard, count: cardCount },
    { id: 'secure_note', label: 'Secure Notes', icon: FileText, count: noteCount },
    { id: 'api_key', label: 'API Keys & Secrets', icon: Terminal, count: apiKeyCount },
  ];

  const smartCategories = [
    { id: 'smart_developer', label: 'Developer & Cloud', icon: Code2, count: devCount },
    { id: 'smart_finance', label: 'Finance & Banking', icon: DollarSign, count: financeCount },
    { id: 'smart_productivity', label: 'Productivity & Work', icon: Briefcase, count: productivityCount },
    { id: 'smart_social', label: 'Social & Messaging', icon: MessageSquare, count: socialCount },
    { id: 'smart_entertainment', label: 'Entertainment & Media', icon: Tv, count: entertainmentCount },
    { id: 'smart_shopping', label: 'Shopping & Commerce', icon: ShoppingBag, count: shoppingCount },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-base block leading-none">
              CipherKey
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-tight mt-1 block">
              Vault & 2FA Autofill
            </span>
          </div>
        </div>
        <button
          onClick={lockVault}
          title="Lock Vault"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>

      {/* Main Categories */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Item Types */}
        <div>
          <div className="px-3 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Vault Types
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
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
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Smart Categories
            </span>
            <button
              onClick={() => batchAutoCategorizeAll()}
              title="Auto-scan and categorize all vault items from website domains"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              <span>Auto-Classify</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {smartCategories.map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate text-xs">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
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
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Custom Categories
            </span>
            <button
              onClick={() => onAddNew?.('custom')}
              title="Add item in a custom category"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-mono transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>+ Category</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {customCategoryNames.length === 0 ? (
              <button
                onClick={() => onAddNew?.('custom')}
                className="w-full text-left px-3 py-1.5 rounded-md text-[11px] text-slate-500 hover:text-indigo-300 hover:bg-slate-800/40 transition-colors italic flex items-center justify-between"
              >
                <span>+ Create custom category...</span>
              </button>
            ) : (
              customCategoryNames.map((name) => {
                const filterId = `custom_name:${name}`;
                const isActive = selectedCategory === filterId;
                const count = customCategoriesMap[name];
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedCategory(filterId)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderSync
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate text-xs">{name}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Security & 2FA Highlights */}
        <div>
          <div className="px-3 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Security & 2FA
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCategory('totp_active')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'totp_active'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Active TOTP Codes</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {totpCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('low_backup')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'low_backup'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${lowBackupCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">Low Backup Codes</span>
              </div>
              <span className={`text-[11px] font-mono tabular-nums ${lowBackupCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                {lowBackupCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'favorites'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Favorites</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {favoritesCount}
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Tools */}
        <div>
          <div className="px-3 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Interactive Tools
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCategory('autofill_playground')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'autofill_playground'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-cyan-300 hover:bg-cyan-950/40 hover:text-cyan-200'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <PlaySquare className="w-4 h-4 shrink-0" />
                <span className="truncate">Autofill Simulator</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200">
                Live Test
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('security_audit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'security_audit'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Security Audit</span>
              </div>
            </button>

            <button
              onClick={onOpenGenerator}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Password Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Utility Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        {/* Auto-categorization option toggle */}
        <div className="px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-300 font-medium">Auto-Categorize</div>
          <button
            onClick={() => setAutoCategoryEnabled(!autoCategoryEnabled)}
            className={`text-xs font-medium flex items-center gap-1 ${
              autoCategoryEnabled ? 'text-cyan-400 font-semibold' : 'text-slate-500'
            }`}
          >
            {autoCategoryEnabled ? (
              <>
                <span>Active</span>
                <ToggleRight className="w-4 h-4 text-cyan-400" />
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
          onClick={onOpenExportImport}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export / Import Vault</span>
        </button>

        <button
          onClick={resetVaultToDefault}
          title="Reset to sample vault items"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Sample Vault</span>
        </button>

        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            className="w-full mt-1 flex items-center justify-center gap-2 px-2.5 py-2 text-xs font-medium text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-all shadow-sm group"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Install on Pixel / Phone</span>
          </button>
        )}
      </div>
    </aside>
  );
};
