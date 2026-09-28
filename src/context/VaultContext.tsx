import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VaultItem, BackupCode, AutofillEvent } from '../types/vault';
import { INITIAL_MOCK_VAULT } from '../utils/mockVault';
import { generateTOTPCode } from '../utils/totp';
import { detectAutoCategory } from '../utils/autoCategory';
import { parseRawBackupCodes } from '../utils/crypto';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface VaultContextType {
  items: VaultItem[];
  activeItemId: string | null;
  activeItem: VaultItem | null;
  setActiveItemId: (id: string | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  // Security & Lock
  isLocked: boolean;
  unlockVault: (password: string) => boolean;
  lockVault: () => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (min: number) => void;
  masterPasswordHint: string;
  
  // Auto-Categorization Feature
  autoCategoryEnabled: boolean;
  setAutoCategoryEnabled: (enabled: boolean) => void;
  batchAutoCategorizeAll: () => number;
  
  // CRUD
  addItem: (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => VaultItem;
  updateItem: (id: string, updates: Partial<VaultItem>) => void;
  deleteItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  
  // 2FA TOTP & Backup Code Autofill features
  getTotpForAccount: (secret: string, digits?: 6 | 8, period?: number) => Promise<string>;
  consumeNextBackupCode: (itemId: string, destinationDomain?: string) => { code: string; remainingCount: number } | null;
  toggleBackupCodeStatus: (itemId: string, codeId: string) => void;
  addBackupCodesToItem: (itemId: string, newCodes: BackupCode[]) => void;
  replaceBackupCodesForItem: (itemId: string, newCodes: BackupCode[]) => void;
  deleteBackupCode: (itemId: string, codeId: string) => void;
  breakdownItemBackupCodes: (itemId: string) => number;
  
  // Autofill History & Notifications
  autofillEvents: AutofillEvent[];
  recordAutofillEvent: (type: 'credentials' | 'totp' | 'backup_code', itemId: string, itemTitle: string, targetDomain: string, codeUsed?: string) => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  
  // Data actions
  exportVault: () => string;
  importVault: (jsonString: string) => { success: boolean; count: number; error?: string };
  resetVaultToDefault: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const STORAGE_KEY = 'cipherkey_vault_items_v1';
const AUTOLOCK_KEY = 'cipherkey_autolock_setting';
const AUTOCAT_KEY = 'cipherkey_autocategory_setting';
const EVENTS_KEY = 'cipherkey_autofill_events';

// Normalizes items so that any emergency backup codes accidentally saved as lumped strings
// (separated by spaces or commas) are automatically decomposed into individual 1-by-1 codes
const normalizeBackupCodesInItems = (vaultItems: VaultItem[]): VaultItem[] => {
  return vaultItems.map((item) => {
    if (!item.backupCodes || item.backupCodes.length === 0) return item;
    const hasLumpedCode = item.backupCodes.some((bc) => /[\s,;\t|]/.test(bc.code.trim()));
    if (!hasLumpedCode) return item;

    const normalizedList: BackupCode[] = [];
    for (const bc of item.backupCodes) {
      if (/[\s,;\t|]/.test(bc.code.trim())) {
        const parsed = parseRawBackupCodes(bc.code, 20);
        if (parsed.length > 1) {
          normalizedList.push(...parsed);
          continue;
        }
      }
      normalizedList.push(bc);
    }
    return {
      ...item,
      backupCodes: normalizedList.slice(0, 20),
    };
  });
};

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial vault
  const [items, setItems] = useState<VaultItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeBackupCodesInItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse stored vault items:', e);
    }
    return normalizeBackupCodesInItems(INITIAL_MOCK_VAULT);
  });

  const [activeItemId, setActiveItemId] = useState<string | null>(() => {
    return INITIAL_MOCK_VAULT[0]?.id || null;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(AUTOLOCK_KEY);
    return saved ? parseInt(saved, 10) : 15;
  });
  const [autoCategoryEnabled, setAutoCategoryEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTOCAT_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const setAutoCategoryEnabled = (enabled: boolean) => {
    setAutoCategoryEnabledState(enabled);
    localStorage.setItem(AUTOCAT_KEY, enabled.toString());
    showToast(
      enabled
        ? 'Auto-categorization from website/app enabled'
        : 'Auto-categorization disabled',
      'info'
    );
  };
  const [autofillEvents, setAutofillEvents] = useState<AutofillEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save vault to localStorage', e);
    }
  }, [items]);

  // Sync events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(autofillEvents));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }, [autofillEvents]);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Record an autofill action
  const recordAutofillEvent = useCallback((
    type: 'credentials' | 'totp' | 'backup_code',
    itemId: string,
    itemTitle: string,
    targetDomain: string,
    codeUsed?: string
  ) => {
    const newEvent: AutofillEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      itemId,
      itemTitle,
      targetDomain,
      codeUsed,
    };

    setAutofillEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events

    // Also update item's lastFilledAt
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, lastFilledAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  // Reset auto-lock timer on user interaction
  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    if (autoLockMinutes > 0 && !isLocked) {
      lockTimerRef.current = setTimeout(() => {
        setIsLocked(true);
        showToast('Vault automatically locked due to inactivity.', 'info');
      }, autoLockMinutes * 60 * 1000);
    }
  }, [autoLockMinutes, isLocked, showToast]);

  useEffect(() => {
    const handleActivity = () => resetLockTimer();
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    resetLockTimer();

    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [resetLockTimer]);

  const unlockVault = (password: string): boolean => {
    // Default master password is "master123" or empty for demo accessibility
    if (password === 'master123' || password === 'admin' || password === '') {
      setIsLocked(false);
      showToast('Vault unlocked successfully', 'success');
      return true;
    }
    showToast('Incorrect master password. Hint: "master123"', 'warning');
    return false;
  };

  const lockVault = () => {
    setIsLocked(true);
    showToast('Vault locked', 'info');
  };

  const activeItem = items.find((i) => i.id === activeItemId) || null;

  // CRUD actions
  const addItem = (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>): VaultItem => {
    let finalServiceCategory = itemData.serviceCategory;
    let finalTags = itemData.tags || [];
    let isAutoCategorized = itemData.autoCategorized;

    // Apply auto-categorization if enabled and not already customized
    if (autoCategoryEnabled && !finalServiceCategory) {
      const detected = detectAutoCategory(itemData.websiteUrl, itemData.title);
      finalServiceCategory = detected.serviceCategory;
      isAutoCategorized = true;
      if (finalTags.length === 0 && detected.suggestedTags.length > 0) {
        finalTags = detected.suggestedTags;
      }
    }

    const newItem: VaultItem = {
      ...itemData,
      serviceCategory: finalServiceCategory,
      tags: finalTags,
      autoCategorized: isAutoCategorized,
      id: `vault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    setActiveItemId(newItem.id);
    showToast(`Added "${newItem.title}" to vault`, 'success');
    return newItem;
  };

  /**
   * Batch auto-categorizes all vault items based on their website URL and title
   */
  const batchAutoCategorizeAll = (): number => {
    let updatedCount = 0;
    const updatedItems = items.map((item) => {
      const detected = detectAutoCategory(item.websiteUrl, item.title);
      // Merge suggested tags with existing tags without duplicates
      const mergedTags = Array.from(new Set([...(item.tags || []), ...detected.suggestedTags]));
      updatedCount++;
      return {
        ...item,
        serviceCategory: detected.serviceCategory,
        tags: mergedTags,
        autoCategorized: true,
        updatedAt: new Date().toISOString(),
      };
    });

    setItems(updatedItems);
    showToast(`Auto-categorized ${updatedCount} vault items based on website domains`, 'success');
    return updatedCount;
  };

  const updateItem = (id: string, updates: Partial<VaultItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
    showToast('Changes saved', 'success');
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeItemId === id) {
      const remaining = items.filter((i) => i.id !== id);
      setActiveItemId(remaining[0]?.id || null);
    }
    showToast(`Deleted "${itemToDelete?.title || 'item'}"`, 'info');
  };

  const toggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  // Helper for computing TOTP
  const getTotpForAccount = async (secret: string, digits: 6 | 8 = 6, period: number = 30): Promise<string> => {
    return generateTOTPCode(secret, digits, period);
  };

  /**
   * Consume next available backup code:
   * 1. Finds the first unused code
   * 2. Marks it as used with timestamp
   * 3. Records autofill event
   * 4. Copies to clipboard
   */
  const consumeNextBackupCode = (
    itemId: string,
    destinationDomain: string = 'Autofill Form'
  ): { code: string; remainingCount: number } | null => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem || !targetItem.backupCodes || targetItem.backupCodes.length === 0) {
      showToast('No backup codes found for this account', 'warning');
      return null;
    }

    const nextUnusedIndex = targetItem.backupCodes.findIndex((bc) => !bc.isUsed);
    if (nextUnusedIndex === -1) {
      showToast('All backup codes have been used! Please regenerate emergency codes.', 'warning');
      return null;
    }

    const targetCode = targetItem.backupCodes[nextUnusedIndex];
    const updatedCodes = [...targetItem.backupCodes];
    updatedCodes[nextUnusedIndex] = {
      ...targetCode,
      isUsed: true,
      usedAt: new Date().toISOString(),
      note: `Auto-filled into ${destinationDomain}`,
    };

    const remainingCount = updatedCodes.filter((bc) => !bc.isUsed).length;

    // Update vault item
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, backupCodes: updatedCodes, updatedAt: new Date().toISOString() }
          : i
      )
    );

    // Record autofill event
    recordAutofillEvent(
      'backup_code',
      targetItem.id,
      targetItem.title,
      destinationDomain,
      targetCode.code
    );

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetCode.code).catch(() => {});
    }

    if (remainingCount <= 1) {
      showToast(
        `Auto-filled backup code ${targetCode.code}! Warning: Only ${remainingCount} backup code left!`,
        'warning'
      );
    } else {
      showToast(
        `Auto-filled backup code: ${targetCode.code} (${remainingCount} unused codes remaining)`,
        'success'
      );
    }

    return { code: targetCode.code, remainingCount };
  };

  const toggleBackupCodeStatus = (itemId: string, codeId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updatedCodes = item.backupCodes.map((bc) => {
          if (bc.id === codeId) {
            const nextUsed = !bc.isUsed;
            return {
              ...bc,
              isUsed: nextUsed,
              usedAt: nextUsed ? new Date().toISOString() : undefined,
            };
          }
          return bc;
        });
        return { ...item, backupCodes: updatedCodes, updatedAt: new Date().toISOString() };
      })
    );
  };

  const addBackupCodesToItem = (itemId: string, newCodes: BackupCode[]) => {
    // If any code in newCodes contains space or comma delimiters, decompose it 1-by-1
    const expanded: BackupCode[] = [];
    for (const c of newCodes) {
      if (/[\s,;\t|]/.test(c.code.trim())) {
        const parsed = parseRawBackupCodes(c.code, 20);
        if (parsed.length > 1) {
          expanded.push(...parsed);
          continue;
        }
      }
      expanded.push(c);
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const combined = [...item.backupCodes, ...expanded].slice(0, 20);
        return {
          ...item,
          backupCodes: combined,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`Added ${expanded.length} backup code(s) (1-by-1 breakdown)`, 'success');
  };

  const replaceBackupCodesForItem = (itemId: string, newCodes: BackupCode[]) => {
    const expanded: BackupCode[] = [];
    for (const c of newCodes) {
      if (/[\s,;\t|]/.test(c.code.trim())) {
        const parsed = parseRawBackupCodes(c.code, 20);
        if (parsed.length > 1) {
          expanded.push(...parsed);
          continue;
        }
      }
      expanded.push(c);
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          backupCodes: expanded.slice(0, 20),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`Saved ${expanded.length} backup code(s) 1-by-1`, 'success');
  };

  const breakdownItemBackupCodes = (itemId: string): number => {
    let brokenCount = 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.backupCodes) return item;
        const expanded: BackupCode[] = [];
        for (const bc of item.backupCodes) {
          if (/[\s,;\t|]/.test(bc.code.trim())) {
            const parsed = parseRawBackupCodes(bc.code, 20);
            if (parsed.length > 1) {
              brokenCount += parsed.length;
              expanded.push(...parsed);
              continue;
            }
          }
          expanded.push(bc);
        }
        return {
          ...item,
          backupCodes: expanded.slice(0, 20),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    if (brokenCount > 0) {
      showToast(`Successfully broke down backup codes 1-by-1 (${brokenCount} codes)!`, 'success');
    }
    return brokenCount;
  };

  const deleteBackupCode = (itemId: string, codeId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          backupCodes: item.backupCodes.filter((bc) => bc.id !== codeId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast('Backup code removed', 'info');
  };

  const exportVault = (): string => {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        items,
      },
      null,
      2
    );
  };

  const importVault = (jsonString: string): { success: boolean; count: number; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingItems = parsed.items || (Array.isArray(parsed) ? parsed : null);
      if (!Array.isArray(incomingItems)) {
        return { success: false, count: 0, error: 'Invalid file format. Expected a list of vault items.' };
      }

      setItems(incomingItems);
      if (incomingItems.length > 0) {
        setActiveItemId(incomingItems[0].id);
      }
      showToast(`Imported ${incomingItems.length} items into vault`, 'success');
      return { success: true, count: incomingItems.length };
    } catch (err) {
      return { success: false, count: 0, error: (err as Error).message };
    }
  };

  const resetVaultToDefault = () => {
    setItems(INITIAL_MOCK_VAULT);
    setActiveItemId(INITIAL_MOCK_VAULT[0]?.id || null);
    showToast('Reset vault to default demo items', 'info');
  };

  return (
    <VaultContext.Provider
      value={{
        items,
        activeItemId,
        activeItem,
        setActiveItemId,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        isLocked,
        unlockVault,
        lockVault,
        autoLockMinutes,
        setAutoLockMinutes,
        masterPasswordHint: 'master123',
        autoCategoryEnabled,
        setAutoCategoryEnabled,
        batchAutoCategorizeAll,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        getTotpForAccount,
        consumeNextBackupCode,
        toggleBackupCodeStatus,
        addBackupCodesToItem,
        replaceBackupCodesForItem,
        deleteBackupCode,
        breakdownItemBackupCodes,
        autofillEvents,
        recordAutofillEvent,
        toasts,
        showToast,
        exportVault,
        importVault,
        resetVaultToDefault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
