import React, { useState } from 'react';
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
import { FloatingAutofillAssistant } from './components/FloatingAutofillAssistant';
import { LockScreen } from './components/LockScreen';
import { ToastContainer } from './components/ToastContainer';
import { VaultItem, VaultCategory } from './types/vault';

const MainVaultApp: React.FC = () => {
  const {
    isLocked,
    activeItem,
    setActiveItemId,
    selectedCategory,
    setSelectedCategory,
  } = useVault();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<VaultItem | null>(null);
  const [initialModalCategory, setInitialModalCategory] = useState<VaultCategory | undefined>(undefined);

  const [batchCodesItem, setBatchCodesItem] = useState<VaultItem | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onAddNew={handleAddNew}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {selectedCategory === 'autofill_playground' ? (
          <AutofillPlayground initialItem={activeItem} />
        ) : selectedCategory === 'security_audit' ? (
          <SecurityAuditView
            onSelectItem={handleSelectItemFromAudit}
            onOpenBatchCodes={handleOpenBatchCodes}
          />
        ) : (
          <>
            <VaultList onAddNew={handleAddNew} />
            <VaultItemDetail
              onEdit={handleEdit}
              onOpenBatchCodes={handleOpenBatchCodes}
              onLaunchAutofillSimulator={handleLaunchAutofillSimulator}
            />
          </>
        )}
      </div>

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
