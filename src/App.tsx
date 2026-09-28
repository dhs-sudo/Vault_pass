import React, { useState, useEffect } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Sidebar } from './components/Sidebar';
import { VaultList } from './components/VaultList';
import { VaultItemDetail } from './components/VaultItemDetail';
import { AutofillPlayground } from './components/AutofillPlayground';
import { SecurityAuditView } from './components/SecurityAuditView';
import { VaultItemEditModal } from './components/VaultItemEditModal';
import { BackupCodeManagerModal } from './components/BackupCodeManagerModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { FloatingAutofillAssistant } from './components/FloatingAutofillAssistant';
import { LockScreen } from './components/LockScreen';
import { ToastContainer } from './components/ToastContainer';
import { VaultItem, VaultCategory } from './types/vault';
import { auth, onAuthStateChanged, User } from './services/firebase';
import { Shield, Sparkles, KeyRound, Cloud, Menu } from 'lucide-react';

const MainVaultApp: React.FC = () => {
  const {
    isLocked,
    activeItem,
    setActiveItemId,
    selectedCategory,
    setSelectedCategory,
  } = useVault();

  // Auth & Cloud state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  // Mobile Drawer & Modals state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<VaultItem | null>(null);
  const [initialModalCategory, setInitialModalCategory] = useState<VaultCategory | undefined>(undefined);

  const [batchCodesItem, setBatchCodesItem] = useState<VaultItem | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Handlers
  const handleAddNew = (cat?: VaultCategory) => {
    setItemToEdit(null);
    setInitialModalCategory(cat);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: VaultItem) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
  };

  const handleOpenBatchCodes = (item: VaultItem) => {
    setBatchCodesItem(item);
  };

  const handleLaunchAutofillSimulator = (item: VaultItem) => {
    setActiveItemId(item.id);
    setSelectedCategory('autofill_playground');
  };

  const handleSelectItemFromAudit = (item: VaultItem) => {
    setActiveItemId(item.id);
    setSelectedCategory('all');
  };

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#070714] text-slate-100 font-sans">
      {/* Sidebar: Desktop permanent, Mobile slide-in drawer */}
      <Sidebar
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onAddNew={handleAddNew}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {selectedCategory === 'autofill_playground' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile Back Header */}
            <div className="md:hidden px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-pink-400 flex items-center gap-1.5"
              >
                <span>← Back to Vault</span>
              </button>
              <span className="text-xs font-mono text-purple-300">Autofill Simulator</span>
            </div>
            <AutofillPlayground initialItem={activeItem} />
          </div>
        ) : selectedCategory === 'security_audit' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile Back Header */}
            <div className="md:hidden px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-pink-400 flex items-center gap-1.5"
              >
                <span>← Back to Vault</span>
              </button>
              <span className="text-xs font-mono text-purple-300">Security Audit</span>
            </div>
            <SecurityAuditView
              onSelectItem={handleSelectItemFromAudit}
              onOpenBatchCodes={handleOpenBatchCodes}
            />
          </div>
        ) : (
          <>
            {/* On mobile: show list if no active item selected. On desktop: always show list */}
            <div className={`${activeItem ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-auto h-full`}>
              <VaultList
                onAddNew={handleAddNew}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              />
            </div>
            {/* On mobile: show detail if active item selected. On desktop: always show detail */}
            <div className={`${activeItem ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full overflow-hidden`}>
              <VaultItemDetail
                onEdit={handleEdit}
                onOpenBatchCodes={handleOpenBatchCodes}
                onLaunchAutofillSimulator={handleLaunchAutofillSimulator}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden bg-slate-950/95 border-t border-purple-500/20 px-2 py-2 flex items-center justify-around z-30 shrink-0 backdrop-blur-md">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setActiveItemId(null);
          }}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors ${
            selectedCategory === 'all' && !activeItem
              ? 'text-pink-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Vault</span>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('totp_active');
            setActiveItemId(null);
          }}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors ${
            selectedCategory === 'totp_active'
              ? 'text-pink-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span>2FA Codes</span>
        </button>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <KeyRound className="w-5 h-5 text-purple-400" />
          <span>Generator</span>
        </button>

        <button
          onClick={() => setIsCloudSyncOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium relative transition-colors ${
            currentUser ? 'text-purple-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Cloud className="w-5 h-5 text-pink-400" />
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-pulse" />
            )}
          </div>
          <span>Cloud Sync</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors ${
            isMobileMenuOpen ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Floating Universal Autofill Assistant */}
      <FloatingAutofillAssistant
        onOpenItem={(item) => {
          setActiveItemId(item.id);
          setSelectedCategory('all');
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Modals */}
      {isEditModalOpen && (
        <VaultItemEditModal
          itemToEdit={itemToEdit}
          initialCategory={initialModalCategory}
          onClose={() => {
            setIsEditModalOpen(false);
            setItemToEdit(null);
            setInitialModalCategory(undefined);
          }}
        />
      )}

      {batchCodesItem && (
        <BackupCodeManagerModal
          item={batchCodesItem}
          onClose={() => setBatchCodesItem(null)}
        />
      )}

      {isGeneratorOpen && (
        <PasswordGeneratorModal onClose={() => setIsGeneratorOpen(false)} />
      )}

      {isExportImportOpen && (
        <ExportImportModal onClose={() => setIsExportImportOpen(false)} />
      )}

      {/* Cloud Sync & 2-Account Auth Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <MainVaultApp />
    </VaultProvider>
  );
}
