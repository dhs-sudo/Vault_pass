import React, { useState, useEffect, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import {
  VaultItem,
  VaultCategory,
  BackupCode,
  DocumentType,
  CustomDocumentField,
  IdentityDocumentData,
  ServiceDomainCategory,
  LinkedAppInfo,
  KeyPassData,
  MAX_BACKUP_CODES_PER_ITEM,
  CustomField,
} from '../types/vault';
import { generateRandomBase32Secret, parseOtpAuthUri } from '../utils/totp';
import {
  generatePassword,
  parseRawBackupCodes,
  generateSampleBackupCodes,
  containsMultipleCodes,
} from '../utils/crypto';
import { detectAutoCategory } from '../utils/autoCategory';
import {
  detectLinkedApp,
  POPULAR_APP_PRESETS,
  generateKeePassXmlKeyfile,
  generate256BitHexKey,
  generateFido2Passkey,
} from '../utils/appLinking';
import {
  X,
  KeyRound,
  Shield,
  Sparkles,
  Plus,
  Trash2,
  QrCode,
  Tag,
  Check,
  FileBadge,
  Globe,
  Car,
  Calendar,
  User,
  Wand2,
  PlusCircle,
  Eye,
  EyeOff,
  AppWindow,
  FileKey,
  Laptop,
  Smartphone,
  Upload,
  Download,
  ExternalLink,
  ChevronDown,
  Layers,
  FolderSync,
} from 'lucide-react';

interface VaultItemEditModalProps {
  itemToEdit?: VaultItem | null;
  initialCategory?: VaultCategory;
  onClose: () => void;
}

export const VaultItemEditModal: React.FC<VaultItemEditModalProps> = ({
  itemToEdit,
  initialCategory,
  onClose,
}) => {
  const { items, addItem, updateItem, showToast, autoCategoryEnabled } = useVault();

  const isEditing = !!itemToEdit;

  // Basic Info
  const [title, setTitle] = useState(itemToEdit?.title || '');
  const [category, setCategory] = useState<VaultCategory>(
    itemToEdit?.category || initialCategory || 'login'
  );
  const [serviceCategory, setServiceCategory] = useState<ServiceDomainCategory | undefined>(
    itemToEdit?.serviceCategory
  );
  const [username, setUsername] = useState(itemToEdit?.username || '');
  const [password, setPassword] = useState(itemToEdit?.password || '');
  const [websiteUrl, setWebsiteUrl] = useState(itemToEdit?.websiteUrl || '');

  // Linked Application (Desktop / Mobile App Association)
  const [enableLinkedApp, setEnableLinkedApp] = useState(!!itemToEdit?.linkedApp);
  const [linkedAppName, setLinkedAppName] = useState(itemToEdit?.linkedApp?.appName || '');
  const [linkedAppIdentifier, setLinkedAppIdentifier] = useState(itemToEdit?.linkedApp?.appIdentifier || '');
  const [linkedAppProtocol, setLinkedAppProtocol] = useState(itemToEdit?.linkedApp?.customProtocolUri || '');
  const [linkedAppPlatform, setLinkedAppPlatform] = useState<LinkedAppInfo['platform']>(
    itemToEdit?.linkedApp?.platform || 'desktop'
  );
  const [detectedLinkedApp, setDetectedLinkedApp] = useState<LinkedAppInfo | null>(null);

  // KeyPass / KeyFile / Passkey Storage
  const [enableKeyPass, setEnableKeyPass] = useState(!!itemToEdit?.keyPass);
  const [keyPassType, setKeyPassType] = useState<KeyPassData['type']>(itemToEdit?.keyPass?.type || 'keyfile');
  const [keyPassName, setKeyPassName] = useState(itemToEdit?.keyPass?.name || 'master-credentials.key');
  const [keyPassContent, setKeyPassContent] = useState(itemToEdit?.keyPass?.content || '');
  const [keyPassCredentialId, setKeyPassCredentialId] = useState(itemToEdit?.keyPass?.credentialId || '');
  const [keyPassRelyingParty, setKeyPassRelyingParty] = useState(itemToEdit?.keyPass?.relyingParty || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2FA TOTP Secret
  const [totpSecret, setTotpSecret] = useState(itemToEdit?.totpSecret || '');
  const [totpDigits, setTotpDigits] = useState<6 | 8>(itemToEdit?.totpDigits || 6);

  // Custom Category and General Custom Option Fields
  const [customCategoryName, setCustomCategoryName] = useState(itemToEdit?.customCategoryName || '');
  const [generalCustomFields, setGeneralCustomFields] = useState<CustomField[]>(itemToEdit?.customFields || []);

  // Backup codes (up to 20 codes per account)
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>(itemToEdit?.backupCodes || []);
  const [rawPastedCodes, setRawPastedCodes] = useState('');
  const [singleCodeInput, setSingleCodeInput] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);

  // Identity / Personal Document Fields
  const existingDoc = itemToEdit?.identityDoc;
  const [docType, setDocType] = useState<DocumentType>(existingDoc?.documentType || 'id_card');
  const [customTypeName, setCustomTypeName] = useState(existingDoc?.customTypeName || '');
  const [fullName, setFullName] = useState(existingDoc?.fullName || '');
  const [documentNumber, setDocumentNumber] = useState(existingDoc?.documentNumber || '');
  const [issuingCountry, setIssuingCountry] = useState(existingDoc?.issuingCountry || '');
  const [issuingStateOrAuthority, setIssuingStateOrAuthority] = useState(
    existingDoc?.issuingStateOrAuthority || ''
  );
  const [dateOfBirth, setDateOfBirth] = useState(existingDoc?.dateOfBirth || '');
  const [issueDate, setIssueDate] = useState(existingDoc?.issueDate || '');
  const [expiryDate, setExpiryDate] = useState(existingDoc?.expiryDate || '');
  const [nationality, setNationality] = useState(existingDoc?.nationality || '');
  const [gender, setGender] = useState(existingDoc?.gender || '');
  const [address, setAddress] = useState(existingDoc?.address || '');

  // Custom Fields on Document
  const [customFields, setCustomFields] = useState<CustomDocumentField[]>(
    existingDoc?.customFields || []
  );

  // Notes & Tags
  const [notes, setNotes] = useState(itemToEdit?.notes || '');
  const [tagsInput, setTagsInput] = useState(itemToEdit?.tags?.join(', ') || '');

  // Live Auto-Categorization & Linked App Detection
  const [detectedCategory, setDetectedCategory] = useState<ReturnType<typeof detectAutoCategory> | null>(null);

  useEffect(() => {
    if (category !== 'identity_doc') {
      const result = detectAutoCategory(websiteUrl, title);
      if (result.confidence >= 0.7) {
        setDetectedCategory(result);
      } else {
        setDetectedCategory(null);
      }

      // Also detect if website/title corresponds to an installed/desktop application
      const detectedApp = detectLinkedApp(title || websiteUrl);
      if (detectedApp && (!enableLinkedApp || !linkedAppName)) {
        setDetectedLinkedApp(detectedApp);
      } else {
        setDetectedLinkedApp(null);
      }
    } else {
      setDetectedCategory(null);
      setDetectedLinkedApp(null);
    }
  }, [websiteUrl, title, category, enableLinkedApp, linkedAppName]);

  // Apply auto-detected category & tags
  const handleApplyAutoDetection = () => {
    if (!detectedCategory) return;
    setServiceCategory(detectedCategory.serviceCategory);
    if (!isEditing && detectedCategory.category !== 'identity_doc') {
      setCategory(detectedCategory.category);
    }
    // Append tags
    const existing = tagsInput ? tagsInput.split(',').map((t) => t.trim()) : [];
    const merged = Array.from(new Set([...existing, ...detectedCategory.suggestedTags]));
    setTagsInput(merged.join(', '));
    showToast(`Applied ${detectedCategory.categoryLabel} category & tags`, 'success');
  };

  // Apply auto-detected linked app
  const handleApplyDetectedApp = () => {
    if (!detectedLinkedApp) return;
    setEnableLinkedApp(true);
    setLinkedAppName(detectedLinkedApp.appName);
    setLinkedAppIdentifier(detectedLinkedApp.appIdentifier || '');
    setLinkedAppProtocol(detectedLinkedApp.customProtocolUri || '');
    setLinkedAppPlatform(detectedLinkedApp.platform || 'desktop');
    setDetectedLinkedApp(null);
    showToast(`Linked password with ${detectedLinkedApp.appName}`, 'success');
  };

  const handleSelectAppPreset = (preset: typeof POPULAR_APP_PRESETS[0]) => {
    setEnableLinkedApp(true);
    setLinkedAppName(preset.appName);
    setLinkedAppIdentifier(preset.appIdentifier);
    setLinkedAppProtocol(preset.customProtocolUri);
    setLinkedAppPlatform(preset.platform);
    showToast(`Selected application preset: ${preset.appName}`, 'info');
  };

  // Helper to generate password
  const handleGeneratePassword = () => {
    const pw = generatePassword({
      length: 18,
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSymbols: true,
      avoidAmbiguous: true,
    });
    setPassword(pw);
    showToast('Generated strong 18-char password', 'info');
  };

  // Helper to generate demo Base32 TOTP secret
  const handleGenerateTotpSecret = () => {
    const secret = generateRandomBase32Secret(16);
    setTotpSecret(secret);
    showToast('Generated sample 2FA secret key', 'info');
  };

  // KeyPass Generators & File Upload
  const handleGenerateKeyfileXml = () => {
    const generated = generateKeePassXmlKeyfile(title ? `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.key` : 'master-vault.key');
    setKeyPassType('keyfile');
    setKeyPassName(generated.name);
    setKeyPassContent(generated.content);
    setEnableKeyPass(true);
    showToast('Generated 256-bit KeePass 2.x XML keyfile', 'success');
  };

  const handleGenerateHexSeed = () => {
    const hex = generate256BitHexKey();
    setKeyPassType('raw_key');
    setKeyPassName(`${title || 'account'}-encryption-seed.key`);
    setKeyPassContent(hex);
    setEnableKeyPass(true);
    showToast('Generated 256-bit cryptographic hex key', 'success');
  };

  const handleGeneratePasskeyCredential = () => {
    const rp = websiteUrl ? websiteUrl.replace(/^https?:\/\//, '').split('/')[0] : 'security.domain';
    const passkey = generateFido2Passkey(rp, username || 'user');
    setKeyPassType('passkey');
    setKeyPassName(passkey.name);
    setKeyPassContent(passkey.content);
    setKeyPassCredentialId(passkey.credentialId || '');
    setKeyPassRelyingParty(rp);
    setEnableKeyPass(true);
    showToast(`Generated FIDO2 Passkey for ${rp}`, 'success');
  };

  const handleFileUploadKeyPass = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setKeyPassName(file.name);
      setKeyPassContent(content);
      setEnableKeyPass(true);
      if (file.name.endsWith('.key') || file.name.endsWith('.xml') || file.name.endsWith('.keyx')) {
        setKeyPassType('keyfile');
      } else {
        setKeyPassType('raw_key');
      }
      showToast(`Loaded key file: ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  // Helper to handle OTP Auth URI paste
  const handleTotpInputChange = (val: string) => {
    if (val.trim().startsWith('otpauth://')) {
      const parsed = parseOtpAuthUri(val);
      if (parsed) {
        setTotpSecret(parsed.secret);
        if (parsed.digits) setTotpDigits(parsed.digits);
        if (parsed.issuer && !title) setTitle(parsed.issuer);
        if (parsed.account && !username) setUsername(parsed.account);
        showToast('Parsed 2FA settings from otpauth:// URI', 'success');
        return;
      }
    }
    setTotpSecret(val);
  };

  // Custom Fields Handlers
  const handleAddCustomField = () => {
    const newField: CustomDocumentField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: 'Attribute Name',
      value: '',
      type: 'text',
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateCustomField = (
    id: string,
    updates: Partial<CustomDocumentField>
  ) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // General Custom Option Fields Handlers (for ANY item category)
  const [revealedGeneralFieldIds, setRevealedGeneralFieldIds] = useState<Record<string, boolean>>({});

  const toggleRevealGeneralField = (id: string) => {
    setRevealedGeneralFieldIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddGeneralCustomField = () => {
    const newField: CustomField = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: 'Field Name',
      value: '',
      type: 'text',
    };
    setGeneralCustomFields((prev) => [...prev, newField]);
  };

  const handleAddPresetField = (label: string, type: CustomField['type'] = 'text') => {
    const newField: CustomField = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      value: '',
      type,
    };
    setGeneralCustomFields((prev) => [...prev, newField]);
    showToast(`Added option field: "${label}"`, 'info');
  };

  const handleUpdateGeneralCustomField = (
    id: string,
    updates: Partial<CustomField>
  ) => {
    setGeneralCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveGeneralCustomField = (id: string) => {
    setGeneralCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Backup codes helpers (up to 20 codes per item)
  const handleApplyPastedCodes = () => {
    const parsed = parseRawBackupCodes(rawPastedCodes, MAX_BACKUP_CODES_PER_ITEM);
    if (parsed.length > 0) {
      const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - backupCodes.length);
      if (remainingSlots <= 0) {
        showToast('Maximum 20 backup codes already reached for this item', 'warning');
        return;
      }
      const toAdd = parsed.slice(0, remainingSlots);
      setBackupCodes((prev) => [...prev, ...toAdd]);
      setRawPastedCodes('');
      setShowBatchInput(false);
      showToast(`Added ${toAdd.length} backup codes (total: ${backupCodes.length + toAdd.length}/20)`, 'success');
    } else {
      showToast('Could not detect any valid backup codes in text', 'warning');
    }
  };

  const handleAddSingleCode = () => {
    if (!singleCodeInput.trim()) return;
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - backupCodes.length);
    if (remainingSlots <= 0) {
      showToast('Maximum 20 backup codes per account reached', 'warning');
      return;
    }

    // Parse input using parseRawBackupCodes so space or comma separated lists break down 1-by-1
    const parsed = parseRawBackupCodes(singleCodeInput, remainingSlots);
    if (parsed.length > 0) {
      setBackupCodes((prev) => [...prev, ...parsed]);
      setSingleCodeInput('');
      if (parsed.length === 1) {
        showToast(`Added backup code (${backupCodes.length + 1}/20)`, 'success');
      } else {
        showToast(`Broken down & added ${parsed.length} individual codes 1-by-1 (${backupCodes.length + parsed.length}/20)`, 'success');
      }
    } else {
      const newCode: BackupCode = {
        id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: singleCodeInput.trim(),
        isUsed: false,
        createdAt: new Date().toISOString(),
      };
      setBackupCodes((prev) => [...prev, newCode]);
      setSingleCodeInput('');
      showToast(`Added backup code (${backupCodes.length + 1}/20)`, 'success');
    }
  };

  const handleBreakdownModalLumpedCode = (codeId: string, lumpedCode: string) => {
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - backupCodes.length + 1);
    const parsed = parseRawBackupCodes(lumpedCode, remainingSlots);
    if (parsed.length <= 1) {
      showToast('No multiple codes detected in this entry', 'info');
      return;
    }
    const current = [...backupCodes];
    const index = current.findIndex((c) => c.id === codeId);
    if (index !== -1) {
      current.splice(index, 1, ...parsed);
      setBackupCodes(current.slice(0, MAX_BACKUP_CODES_PER_ITEM));
      showToast(`Broke down entry into ${parsed.length} separate codes 1-by-1`, 'success');
    }
  };

  const handleBreakdownAllModalLumpedCodes = () => {
    const expanded: BackupCode[] = [];
    let count = 0;
    for (const bc of backupCodes) {
      if (containsMultipleCodes(bc.code)) {
        const parsed = parseRawBackupCodes(bc.code, 20);
        if (parsed.length > 1) {
          count += parsed.length;
          expanded.push(...parsed);
          continue;
        }
      }
      expanded.push(bc);
    }
    setBackupCodes(expanded.slice(0, MAX_BACKUP_CODES_PER_ITEM));
    showToast(`Broken down into individual 1-by-1 codes!`, 'success');
  };

  const handleGenerateSampleBackupCodes = (count: number = 10) => {
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - backupCodes.length);
    const targetCount = Math.min(count, remainingSlots);
    if (targetCount <= 0) {
      showToast('Vault already has maximum 20 backup codes', 'warning');
      return;
    }
    const newCodes = generateSampleBackupCodes(targetCount, 'alphanumeric_dashed');
    setBackupCodes((prev) => [...prev, ...newCodes]);
    showToast(`Generated ${targetCount} backup codes (total: ${backupCodes.length + targetCount}/20)`, 'success');
  };

  const handleDeleteBackupCode = (id: string) => {
    setBackupCodes((prev) => prev.filter((c) => c.id !== id));
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an item or document title', 'warning');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Build identityDoc if category is identity_doc
    let identityDocPayload: IdentityDocumentData | undefined = undefined;
    if (category === 'identity_doc') {
      identityDocPayload = {
        documentType: docType,
        customTypeName: docType === 'custom_document' ? customTypeName.trim() : undefined,
        fullName: fullName.trim() || title.trim(),
        documentNumber: documentNumber.trim(),
        issuingCountry: issuingCountry.trim() || undefined,
        issuingStateOrAuthority: issuingStateOrAuthority.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        nationality: nationality.trim() || undefined,
        gender: gender || undefined,
        address: address.trim() || undefined,
        customFields,
      };
    }

    // Build Linked Application data if enabled
    const linkedAppPayload: LinkedAppInfo | undefined =
      enableLinkedApp && linkedAppName.trim()
        ? {
            appName: linkedAppName.trim(),
            appIdentifier: linkedAppIdentifier.trim() || undefined,
            customProtocolUri: linkedAppProtocol.trim() || undefined,
            platform: linkedAppPlatform,
            launchSupported: !!linkedAppProtocol.trim(),
          }
        : undefined;

    // Build KeyPass / Keyfile data if enabled
    const keyPassPayload: KeyPassData | undefined =
      enableKeyPass && keyPassContent.trim()
        ? {
            type: keyPassType,
            name: keyPassName.trim() || 'credentials.key',
            content: keyPassContent.trim(),
            credentialId: keyPassCredentialId.trim() || undefined,
            relyingParty: keyPassRelyingParty.trim() || undefined,
            createdAt: itemToEdit?.keyPass?.createdAt || new Date().toISOString(),
          }
        : undefined;

    if (isEditing && itemToEdit) {
      updateItem(itemToEdit.id, {
        title: title.trim(),
        category,
        customCategoryName: category === 'custom' ? customCategoryName.trim() : undefined,
        serviceCategory,
        username: username.trim(),
        password,
        websiteUrl: websiteUrl.trim(),
        linkedApp: linkedAppPayload,
        keyPass: keyPassPayload,
        totpSecret: totpSecret.trim() || undefined,
        totpDigits,
        totpPeriod: 30,
        backupCodes,
        identityDoc: identityDocPayload,
        customFields: category !== 'identity_doc' && generalCustomFields.length > 0 ? generalCustomFields : undefined,
        notes: notes.trim(),
        tags,
      });
    } else {
      addItem({
        title: title.trim(),
        category,
        customCategoryName: category === 'custom' ? customCategoryName.trim() : undefined,
        serviceCategory,
        username: username.trim(),
        password,
        websiteUrl: websiteUrl.trim(),
        linkedApp: linkedAppPayload,
        keyPass: keyPassPayload,
        totpSecret: totpSecret.trim() || undefined,
        totpDigits,
        totpPeriod: 30,
        backupCodes,
        identityDoc: identityDocPayload,
        customFields: category !== 'identity_doc' && generalCustomFields.length > 0 ? generalCustomFields : undefined,
        notes: notes.trim(),
        tags,
        isFavorite: false,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {category === 'identity_doc' ? (
                <FileBadge className="w-4 h-4 text-teal-400" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {isEditing
                ? `Edit "${itemToEdit.title}"`
                : category === 'identity_doc'
                ? 'Save Personal Document'
                : 'New Vault Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {category === 'identity_doc' ? 'Document Title *' : 'Item Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'identity_doc'
                    ? 'e.g. UK Biometric Passport, State Driving Licence, Health Card'
                    : 'e.g. GitHub Enterprise, AWS Console, Stripe'
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Vault Type / Category
                </label>
                {category !== 'custom' && (
                  <button
                    type="button"
                    onClick={() => setCategory('custom')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-0.5 transition-colors"
                    title="Switch to custom category"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Custom Category</span>
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VaultCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="login">Login & 2FA</option>
                <option value="identity_doc">Personal Document (ID, Passport...)</option>
                <option value="card">Payment Card</option>
                <option value="secure_note">Secure Note</option>
                <option value="api_key">API Key & Secret</option>
                <option value="custom">★ Custom Category (User Defined)...</option>
              </select>
            </div>
          </div>

          {/* CUSTOM CATEGORY INPUT */}
          {category === 'custom' && (
            <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderSync className="w-4 h-4 text-indigo-400" />
                  <label className="text-xs font-bold text-indigo-300 block">
                    Custom Category Classification *
                  </label>
                </div>
                <span className="text-[10px] text-indigo-400/80 font-mono">
                  Tailored Item Category
                </span>
              </div>
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="e.g. Crypto Hardware Wallet, Server & SSH, Software License, WiFi Network, Bank Account"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-mono">Quick Presets:</span>
                {[
                  'Crypto Wallet',
                  'Server / SSH',
                  'Software License',
                  'WiFi Network',
                  'Bank Account',
                  'Gaming',
                  'Membership',
                  'Smart Home',
                  'Medical Record',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setCustomCategoryName(sug)}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                      customCategoryName === sug
                        ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/60 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Existing Categories in User's Vault */}
              {Array.from(
                new Set(
                  items
                    .filter((i) => i.category === 'custom' && i.customCategoryName?.trim())
                    .map((i) => i.customCategoryName!.trim())
                )
              ).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-indigo-500/20">
                  <span className="text-[10px] text-indigo-400 font-mono">Existing in Vault:</span>
                  {Array.from(
                    new Set(
                      items
                        .filter((i) => i.category === 'custom' && i.customCategoryName?.trim())
                        .map((i) => i.customCategoryName!.trim())
                    )
                  ).map((existingCat) => (
                    <button
                      key={existingCat}
                      type="button"
                      onClick={() => setCustomCategoryName(existingCat)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                        customCategoryName === existingCat
                          ? 'bg-indigo-500/40 text-indigo-200 border-indigo-400 font-semibold'
                          : 'bg-slate-950 border-indigo-900 text-indigo-300 hover:bg-indigo-900/40'
                      }`}
                    >
                      {existingCat}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-indigo-300/80 italic pt-1">
                Tip: You can also define unlimited Custom Option Fields (PIN, Port, License Key, Security Question, etc.) below!
              </p>
            </div>
          )}

          {/* AUTO-CATEGORY DETECTION BANNER */}
          {detectedCategory && category !== 'identity_doc' && (
            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 min-w-0">
                <Wand2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">
                  Auto-detected category:{' '}
                  <strong className="text-slate-100">{detectedCategory.categoryLabel}</strong>
                  {detectedCategory.suggestedTags.length > 0 && (
                    <span className="text-slate-400 ml-1">
                      (Tags: {detectedCategory.suggestedTags.join(', ')})
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyAutoDetection}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION A: PERSONAL IDENTITY & CUSTOM DOCUMENTS */}
          {/* ========================================================================= */}
          {category === 'identity_doc' && (
            <div className="p-4 rounded-lg bg-slate-950/90 border border-teal-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Official Document Details
                  </span>
                </div>
                <span className="text-[11px] font-mono text-teal-400">
                  Zero-Knowledge Encrypted
                </span>
              </div>

              {/* Document Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Document Classification
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="id_card">National ID Card / Resident Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="residence_permit">Residence Permit / Visa</option>
                    <option value="insurance">Health / Insurance Card</option>
                    <option value="custom_document">Custom Document Type...</option>
                  </select>
                </div>

                {docType === 'custom_document' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Custom Document Type Name *
                    </label>
                    <input
                      type="text"
                      value={customTypeName}
                      onChange={(e) => setCustomTypeName(e.target.value)}
                      placeholder="e.g. Scuba License, Tax ID, Vehicle Reg"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Core Document Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Full Legal Name on Document *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. ALEXANDER CHEN"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Document / License Number *
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. 539108427 or CHEN952054A99AL"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    value={issuingCountry}
                    onChange={(e) => setIssuingCountry(e.target.value)}
                    placeholder="e.g. United Kingdom, United States, Germany"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Issuing Authority / State / Office
                  </label>
                  <input
                    type="text"
                    value={issuingStateOrAuthority}
                    onChange={(e) => setIssuingStateOrAuthority(e.target.value)}
                    placeholder="e.g. HMPO, DVLA, California DMV"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Nationality / Citizenship
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. British Citizen"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 42 Baker Street, London NW1 6XE"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* CUSTOM DYNAMIC FIELDS BUILDER */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Custom Document Fields & Attributes
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Add any custom data (e.g. Place of Birth, Vehicle Classes, Blood Group, MRZ, PIN)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-300 bg-teal-950/40 border border-teal-800/40 rounded hover:bg-teal-900/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                {customFields.length > 0 ? (
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-800 text-xs"
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateCustomField(field.id, { label: e.target.value })
                          }
                          placeholder="Field Label (e.g. Blood Type)"
                          className="w-1/3 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                        />
                        <input
                          type={field.type === 'masked' ? 'password' : 'text'}
                          value={field.value}
                          onChange={(e) =>
                            handleUpdateCustomField(field.id, { value: e.target.value })
                          }
                          placeholder="Field Value"
                          className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleUpdateCustomField(field.id, {
                              type: e.target.value as CustomDocumentField['type'],
                            })
                          }
                          className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300"
                        >
                          <option value="text">Text</option>
                          <option value="masked">Secret / Masked</option>
                          <option value="date">Date</option>
                          <option value="number">Number</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(field.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                          title="Remove custom field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No custom fields added yet. Click "Add Custom Field" above to add tailored attributes.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: CREDENTIALS (FOR LOGINS OR COMPLEMENTARY ACCESS) */}
          {/* ========================================================================= */}
          {category !== 'identity_doc' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alex@domain.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Secure password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://github.com/login"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* LINKED APPLICATION SECTION (Desktop / Mobile App Association) */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppWindow className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Linked Application (Desktop / Mobile App)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableLinkedApp;
                      setEnableLinkedApp(next);
                      if (next && !linkedAppName && detectedLinkedApp) {
                        handleApplyDetectedApp();
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      enableLinkedApp
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {enableLinkedApp ? 'Linked App Active' : '+ Link with App'}
                  </button>
                </div>

                {/* Auto-detected App Banner */}
                {detectedLinkedApp && !enableLinkedApp && (
                  <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        Detected matching application: <strong>{detectedLinkedApp.appName}</strong> ({detectedLinkedApp.appIdentifier})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDetectedApp}
                      className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors shrink-0"
                    >
                      Link Now
                    </button>
                  </div>
                )}

                {enableLinkedApp && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                    {/* Quick presets */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 uppercase font-mono">
                        Quick App Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_APP_PRESETS.map((p) => (
                          <button
                            key={p.appName}
                            type="button"
                            onClick={() => handleSelectAppPreset(p)}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                              linkedAppName === p.appName
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {p.appName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Application Name *
                        </label>
                        <input
                          type="text"
                          value={linkedAppName}
                          onChange={(e) => setLinkedAppName(e.target.value)}
                          placeholder="e.g. Discord, Slack, Steam, Spotify"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          required={enableLinkedApp}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Platform Target
                        </label>
                        <select
                          value={linkedAppPlatform}
                          onChange={(e) => setLinkedAppPlatform(e.target.value as LinkedAppInfo['platform'])}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="desktop">Desktop (macOS / Windows / Linux)</option>
                          <option value="universal">Universal (Desktop & Mobile)</option>
                          <option value="mobile">Mobile (iOS / Android)</option>
                          <option value="cli">CLI / Developer Tool</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Process / Bundle ID / Executable
                        </label>
                        <input
                          type="text"
                          value={linkedAppIdentifier}
                          onChange={(e) => setLinkedAppIdentifier(e.target.value)}
                          placeholder="e.g. com.tinyspeck.slackmacgap or slack.exe"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Custom Launch Protocol URI (optional)
                        </label>
                        <input
                          type="text"
                          value={linkedAppProtocol}
                          onChange={(e) => setLinkedAppProtocol(e.target.value)}
                          placeholder="e.g. slack://, discord://, spotify://"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KEYPASS / KEYFILE & PASSKEY STORAGE SECTION */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileKey className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        KeyPass / Keyfile & Passkey Storage
                      </span>
                      <span className="text-[10px] text-slate-400">
                        KeePass 2.x .key file, FIDO2 WebAuthn passkey, or cryptographic seed
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableKeyPass(!enableKeyPass)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      enableKeyPass
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {enableKeyPass ? 'KeyPass Active' : '+ Store KeyPass'}
                  </button>
                </div>

                {enableKeyPass && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                    {/* Key type and quick generator buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setKeyPassType('keyfile')}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            keyPassType === 'keyfile'
                              ? 'bg-emerald-600 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          KeePass Keyfile (.key)
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyPassType('passkey')}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            keyPassType === 'passkey'
                              ? 'bg-emerald-600 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          FIDO2 Passkey
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyPassType('raw_key')}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            keyPassType === 'raw_key'
                              ? 'bg-emerald-600 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Raw 256-bit Key
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUploadKeyPass}
                          className="hidden"
                          accept=".key,.keyx,.xml,.txt,.bin,.json"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          title="Upload existing .key or keyfile from laptop"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Upload File</span>
                        </button>

                        {keyPassType === 'keyfile' && (
                          <button
                            type="button"
                            onClick={handleGenerateKeyfileXml}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 rounded transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate 256-bit XML Key</span>
                          </button>
                        )}

                        {keyPassType === 'passkey' && (
                          <button
                            type="button"
                            onClick={handleGeneratePasskeyCredential}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 rounded transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Passkey</span>
                          </button>
                        )}

                        {keyPassType === 'raw_key' && (
                          <button
                            type="button"
                            onClick={handleGenerateHexSeed}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 rounded transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Generate Hex Key</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Key / File Name
                        </label>
                        <input
                          type="text"
                          value={keyPassName}
                          onChange={(e) => setKeyPassName(e.target.value)}
                          placeholder="e.g. master-vault.key or GitHub FIDO2"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {keyPassType === 'passkey' && (
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Relying Party (Domain)
                          </label>
                          <input
                            type="text"
                            value={keyPassRelyingParty}
                            onChange={(e) => setKeyPassRelyingParty(e.target.value)}
                            placeholder="e.g. github.com"
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Key Content / XML / Key Payload
                      </label>
                      <textarea
                        rows={3}
                        value={keyPassContent}
                        onChange={(e) => setKeyPassContent(e.target.value)}
                        placeholder="Paste KeePass XML, raw key bytes, or generated passkey payload..."
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2FA Authenticator Section */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">
                      2FA Authenticator Code Setup
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateTotpSecret}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Demo Key</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Base32 Secret Key or otpauth:// URI
                  </label>
                  <input
                    type="text"
                    value={totpSecret}
                    onChange={(e) => handleTotpInputChange(e.target.value)}
                    placeholder="e.g. JBSWY3DPEHPK3PXP or paste otpauth://totp/..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enables live 30-second TOTP generation and in-browser auto-fill during sign-in.
                  </p>
                </div>
              </div>

              {/* Backup Codes Section (Up to 20 Codes per Account) */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 block">
                        Emergency Recovery Backup Codes
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                        ({backupCodes.length} / 20 Max)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {backupCodes.filter((c) => !c.isUsed).length} unused recovery codes remaining
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {backupCodes.some((c) => containsMultipleCodes(c.code)) && (
                      <button
                        type="button"
                        onClick={handleBreakdownAllModalLumpedCodes}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-sm"
                        title="Decompose combined codes into separate 1-by-1 entries"
                      >
                        Break Down 1-by-1
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowBatchInput(!showBatchInput)}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                    >
                      {showBatchInput ? 'Hide Paste Box' : 'Paste List'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleBackupCodes(10)}
                      className="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 rounded transition-colors"
                      title="Add 10 sample codes"
                    >
                      + 10 Codes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleBackupCodes(20)}
                      className="px-2 py-1 text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 rounded transition-colors"
                      title="Generate maximum 20 codes"
                    >
                      + 20 (Max)
                    </button>
                  </div>
                </div>

                {/* Add single code or paste list inline input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={singleCodeInput}
                    onChange={(e) => setSingleCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleCode();
                      }
                    }}
                    placeholder="Add code OR paste pass list separated by space/comma (e.g. 1234567 8765437) & press Enter"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    disabled={backupCodes.length >= MAX_BACKUP_CODES_PER_ITEM}
                  />
                  <button
                    type="button"
                    onClick={handleAddSingleCode}
                    disabled={!singleCodeInput.trim() || backupCodes.length >= MAX_BACKUP_CODES_PER_ITEM}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded transition-colors shrink-0"
                  >
                    + Add / Breakdown
                  </button>
                </div>

                {/* Batch Paste Box */}
                {showBatchInput && (
                  <div className="p-3 bg-slate-900 rounded-md border border-slate-700 space-y-2">
                    <label className="text-[11px] text-slate-300 block">
                      Paste backup codes (up to 20 codes, one per line or comma/space separated):
                    </label>
                    <textarea
                      rows={3}
                      value={rawPastedCodes}
                      onChange={(e) => setRawPastedCodes(e.target.value)}
                      placeholder="84920194&#10;30291847&#10;19482034&#10;77620194"
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBatchInput(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPastedCodes}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded"
                      >
                        Add Detected Codes (Up to 20)
                      </button>
                    </div>
                  </div>
                )}

                {/* List of current backup codes */}
                {backupCodes.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 border border-slate-800/60 rounded bg-slate-900/40">
                    {backupCodes.map((bc, idx) => (
                      <div
                        key={bc.id}
                        className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono"
                      >
                        <span className="text-slate-500 mr-1 text-[10px]">#{idx + 1}</span>
                        <span className={`truncate ${bc.isUsed ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                          {bc.code}
                        </span>
                        {containsMultipleCodes(bc.code) && (
                          <button
                            type="button"
                            onClick={() => handleBreakdownModalLumpedCode(bc.id, bc.code)}
                            className="text-[9px] px-1 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded mx-1 hover:bg-indigo-500/30"
                            title="Break down into individual 1-by-1 codes"
                          >
                            Separate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteBackupCode(bc.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 ml-1 shrink-0"
                          title="Remove code"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No backup codes saved yet (allows up to 20 backup codes per account).
                  </p>
                )}
              </div>
            </>
          )}

          {/* CUSTOM OPTION FIELDS (Available for any category!) */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Custom Option Fields (Additional Attributes)
                </span>
                <span className="text-[10px] text-slate-400">
                  Store custom attributes (e.g. PIN, Recovery Phrase, Server IP, License Key, Security Question)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddGeneralCustomField}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded hover:bg-cyan-900/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Blank Option Field</span>
              </button>
            </div>

            {/* Quick Option Field Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">Quick Option Presets:</span>
              {[
                { label: 'Security PIN', type: 'masked' as const },
                { label: 'Recovery Email', type: 'text' as const },
                { label: 'Security Question', type: 'text' as const },
                { label: 'Server IP / Port', type: 'text' as const },
                { label: 'API Secret', type: 'masked' as const },
                { label: 'License Key', type: 'text' as const },
                { label: 'Account / ID #', type: 'text' as const },
                { label: 'Passphrase Seed', type: 'masked' as const },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAddPresetField(preset.label, preset.type)}
                  className="px-2 py-0.5 text-[10px] rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {generalCustomFields.length > 0 ? (
              <div className="space-y-2 pt-1">
                {generalCustomFields.map((field) => {
                  const isMaskedInput = field.type === 'masked' && !revealedGeneralFieldIds[field.id];
                  return (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-800 text-xs"
                    >
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateGeneralCustomField(field.id, { label: e.target.value })
                        }
                        placeholder="Option Name (e.g. Account PIN)"
                        className="w-1/3 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex-1 relative flex items-center">
                        <input
                          type={isMaskedInput ? 'password' : 'text'}
                          value={field.value}
                          onChange={(e) =>
                            handleUpdateGeneralCustomField(field.id, { value: e.target.value })
                          }
                          placeholder="Option Value"
                          className="w-full px-2 py-1.5 pr-8 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                        {field.type === 'masked' && (
                          <button
                            type="button"
                            onClick={() => toggleRevealGeneralField(field.id)}
                            className="absolute right-2 text-slate-400 hover:text-slate-200"
                            title={isMaskedInput ? 'Reveal secret' : 'Conceal secret'}
                          >
                            {isMaskedInput ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          handleUpdateGeneralCustomField(field.id, {
                            type: e.target.value as CustomField['type'],
                          })
                        }
                        className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="text">Text</option>
                        <option value="masked">Secret / Masked</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveGeneralCustomField(field.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        title="Remove option field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                No custom option fields added. Click "+ Preset" or "Add Blank Option Field" to store tailored key-value properties for this entry.
              </p>
            )}
          </div>

          {/* Notes & Tags */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Important account recovery instructions, physical safe location, or hints..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Identity, Passport, Travel, Work"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md shadow transition-colors"
            >
              {isEditing ? 'Save Changes' : category === 'identity_doc' ? 'Save Document' : 'Create Vault Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
