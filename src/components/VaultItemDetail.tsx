import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem, BackupCode, MAX_BACKUP_CODES_PER_ITEM } from '../types/vault';
import { generateTOTPCode, getTOTPTimeRemaining, formatOtpDisplay } from '../utils/totp';
import { evaluatePasswordStrength, generateSampleBackupCodes, parseRawBackupCodes, containsMultipleCodes } from '../utils/crypto';
import { triggerKeyFileDownload } from '../utils/appLinking';
import {
  KeyRound,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Edit3,
  Trash2,
  Star,
  RefreshCw,
  Plus,
  AlertTriangle,
  Send,
  Sparkles,
  QrCode,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  FileBadge,
  Globe,
  Car,
  Calendar,
  User,
  MapPin,
  Building,
  CreditCard,
  Lock,
  AppWindow,
  FileKey,
  Download,
  Laptop,
  Smartphone,
  Play,
  Layers,
  FolderSync,
} from 'lucide-react';

interface VaultItemDetailProps {
  onEdit: (item: VaultItem) => void;
  onOpenBatchCodes: (item: VaultItem) => void;
  onLaunchAutofillSimulator: (item: VaultItem) => void;
}

export const VaultItemDetail: React.FC<VaultItemDetailProps> = ({
  onEdit,
  onOpenBatchCodes,
  onLaunchAutofillSimulator,
}) => {
  const {
    activeItem,
    deleteItem,
    toggleFavorite,
    consumeNextBackupCode,
    toggleBackupCodeStatus,
    deleteBackupCode,
    addBackupCodesToItem,
    replaceBackupCodesForItem,
    breakdownItemBackupCodes,
    showToast,
  } = useVault();

  const [showPassword, setShowPassword] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [showKeyPassContent, setShowKeyPassContent] = useState(false);
  const [singleBackupInput, setSingleBackupInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealedCustomFields, setRevealedCustomFields] = useState<Record<string, boolean>>({});

  // TOTP live state
  const [totpCode, setTotpCode] = useState<string>('------');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [timePercentage, setTimePercentage] = useState<number>(100);

  // Live TOTP calculation
  useEffect(() => {
    if (!activeItem?.totpSecret) {
      setTotpCode('------');
      return;
    }

    let isMounted = true;
    const updateTotp = async () => {
      const code = await generateTOTPCode(
        activeItem.totpSecret!,
        activeItem.totpDigits || 6,
        activeItem.totpPeriod || 30
      );
      if (isMounted) {
        setTotpCode(code);
        const { remainingSeconds, percentage } = getTOTPTimeRemaining(activeItem.totpPeriod || 30);
        setRemainingSeconds(remainingSeconds);
        setTimePercentage(percentage);
      }
    };

    updateTotp();
    const interval = setInterval(() => {
      const { remainingSeconds, percentage } = getTOTPTimeRemaining(activeItem.totpPeriod || 30);
      setRemainingSeconds(remainingSeconds);
      setTimePercentage(percentage);
      if (remainingSeconds === 30 || remainingSeconds === 29) {
        updateTotp();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeItem?.totpSecret, activeItem?.totpDigits, activeItem?.totpPeriod]);

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-950">
        <KeyRound className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-400">No Item Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select an item from the vault list to view credentials, personal documents, live 2FA authenticator codes, or backup codes.
        </p>
      </div>
    );
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 1800);
  };

  const toggleRevealCustomField = (id: string) => {
    setRevealedCustomFields((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAutofillNextBackupCode = () => {
    const result = consumeNextBackupCode(activeItem.id, activeItem.title);
    if (result) {
      setCopiedField('backup_next');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleLaunchLinkedApp = (protocol?: string, appName?: string) => {
    if (protocol) {
      showToast(`Launching ${appName || 'Application'} via ${protocol}...`, 'info');
      try {
        window.location.href = protocol;
      } catch (e) {
        console.error('Launch protocol error:', e);
      }
    } else {
      showToast(`Linked application: "${appName || 'Desktop App'}". Launch the app on your computer!`, 'info');
    }
  };

  const handleDownloadKeyPass = () => {
    if (!activeItem.keyPass) return;
    triggerKeyFileDownload(
      activeItem.keyPass.name || 'master-key.key',
      activeItem.keyPass.content
    );
    showToast(`Downloaded key file: ${activeItem.keyPass.name}`, 'success');
  };

  const handleGenerateSampleCodes = (count: number = 10) => {
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - (activeItem.backupCodes?.length || 0));
    const targetCount = Math.min(count, remainingSlots);
    if (targetCount <= 0) {
      showToast('Vault already has maximum 20 backup codes', 'warning');
      return;
    }
    const newCodes = generateSampleBackupCodes(targetCount, 'alphanumeric_dashed');
    addBackupCodesToItem(activeItem.id, newCodes);
    showToast(`Generated ${targetCount} backup codes (total: ${(activeItem.backupCodes?.length || 0) + targetCount}/20)`, 'success');
  };

  const handleAddSingleBackupDirect = () => {
    if (!singleBackupInput.trim()) return;
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - (activeItem.backupCodes?.length || 0));
    if (remainingSlots <= 0) {
      showToast('Maximum 20 backup codes reached for this item', 'warning');
      return;
    }

    // Automatically parse input so lists separated by spaces or commas break down 1-by-1
    const parsed = parseRawBackupCodes(singleBackupInput, remainingSlots);
    if (parsed.length > 0) {
      addBackupCodesToItem(activeItem.id, parsed);
      setSingleBackupInput('');
      if (parsed.length === 1) {
        showToast(`Added backup code: ${parsed[0].code}`, 'success');
      } else {
        showToast(`Broken down and added ${parsed.length} individual codes 1-by-1!`, 'success');
      }
    } else {
      const newCode: BackupCode = {
        id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: singleBackupInput.trim(),
        isUsed: false,
        createdAt: new Date().toISOString(),
      };
      addBackupCodesToItem(activeItem.id, [newCode]);
      setSingleBackupInput('');
      showToast('Added backup code to vault', 'success');
    }
  };

  const handleBreakdownSingleLumped = (codeId: string, lumpedText: string) => {
    const remainingSlots = Math.max(0, MAX_BACKUP_CODES_PER_ITEM - (activeItem.backupCodes?.length || 0) + 1);
    const parsed = parseRawBackupCodes(lumpedText, remainingSlots);
    if (parsed.length <= 1) {
      showToast('No multiple codes detected in this entry', 'info');
      return;
    }
    const currentList = [...(activeItem.backupCodes || [])];
    const index = currentList.findIndex((c) => c.id === codeId);
    if (index !== -1) {
      currentList.splice(index, 1, ...parsed);
      replaceBackupCodesForItem(activeItem.id, currentList.slice(0, MAX_BACKUP_CODES_PER_ITEM));
      showToast(`Successfully broke down entry into ${parsed.length} separate 1-by-1 codes!`, 'success');
    }
  };

  // Password strength check
  const pwStrength = evaluatePasswordStrength(activeItem.password);

  // Backup codes calculations
  const totalBackupCodes = activeItem.backupCodes?.length || 0;
  const unusedBackupCodes = activeItem.backupCodes?.filter((c) => !c.isUsed) || [];
  const usedBackupCodes = activeItem.backupCodes?.filter((c) => c.isUsed) || [];
  const nextBackupCode = unusedBackupCodes[0] || null;
  const isLowBackupWarning = totalBackupCodes > 0 && unusedBackupCodes.length <= 1;
  const hasLumpedBackupCodes = activeItem.backupCodes?.some((c) => containsMultipleCodes(c.code));

  // Identity document info
  const isIdentityDoc = activeItem.category === 'identity_doc' || !!activeItem.identityDoc;
  const docData = activeItem.identityDoc;

  // SVG circular timer geometry
  const circleRadius = 20;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (timePercentage / 100) * circumference;

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-y-auto">
      {/* Top Action Bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold shrink-0">
            {isIdentityDoc ? (
              docData?.documentType === 'passport' ? (
                <Globe className="w-5 h-5 text-emerald-400" />
              ) : docData?.documentType === 'drivers_license' ? (
                <Car className="w-5 h-5 text-cyan-400" />
              ) : (
                <FileBadge className="w-5 h-5 text-teal-400" />
              )
            ) : (
              activeItem.title.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 truncate">
                {activeItem.title}
              </h2>
              <button
                onClick={() => toggleFavorite(activeItem.id)}
                className={`p-1 rounded transition-colors ${
                  activeItem.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                }`}
                title="Toggle Favorite"
              >
                <Star className={`w-4 h-4 ${activeItem.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
            {isIdentityDoc ? (
              <span className="text-xs text-teal-400 font-mono inline-flex items-center gap-1.5">
                <span>
                  {docData?.documentType === 'passport'
                    ? 'Official Passport'
                    : docData?.documentType === 'drivers_license'
                    ? 'Driving Licence'
                    : docData?.customTypeName || 'Personal Identity Document'}
                </span>
                {docData?.issuingCountry && <span>· {docData.issuingCountry}</span>}
              </span>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {activeItem.category === 'custom' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 inline-flex items-center gap-1">
                    <FolderSync className="w-3 h-3 text-indigo-400" />
                    <span>Category: {activeItem.customCategoryName || 'Custom Category'}</span>
                  </span>
                )}
                {activeItem.websiteUrl && (
                  <a
                    href={activeItem.websiteUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 font-mono transition-colors"
                  >
                    <span>{activeItem.websiteUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isIdentityDoc && (
            <button
              onClick={() => onLaunchAutofillSimulator(activeItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-md transition-colors shadow-sm"
              title="Launch test simulator for this item"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Autofill</span>
            </button>
          )}

          <button
            onClick={() => onEdit(activeItem)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Delete "${activeItem.title}" from vault?`)) {
                deleteItem(activeItem.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* PERSONAL IDENTITY DOCUMENT CARD (If Identity Doc) */}
        {isIdentityDoc && docData && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-teal-500/30 rounded-xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  {docData.documentType === 'passport' ? (
                    <Globe className="w-6 h-6" />
                  ) : docData.documentType === 'drivers_license' ? (
                    <Car className="w-6 h-6" />
                  ) : (
                    <FileBadge className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 block font-semibold">
                    {docData.customTypeName || docData.documentType.replace('_', ' ')}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 tracking-tight">
                    {docData.fullName || activeItem.title}
                  </h3>
                </div>
              </div>

              {/* Document Number Prominent Box */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">
                    Document Number
                  </span>
                  <span className="font-mono text-base font-bold text-slate-100 tracking-wider">
                    {docData.documentNumber || '—'}
                  </span>
                </div>
                {docData.documentNumber && (
                  <button
                    onClick={() => copyToClipboard(docData.documentNumber, 'Document Number')}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-900 transition-colors ml-2"
                    title="Copy document number"
                  >
                    {copiedField === 'Document Number' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Standard Official Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase mb-1">
                  Issuing Authority
                </span>
                <span className="text-slate-200 font-semibold truncate block">
                  {docData.issuingStateOrAuthority || docData.issuingCountry || '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase mb-1">
                  Date of Birth
                </span>
                <span className="text-slate-200 font-semibold truncate block">
                  {docData.dateOfBirth || '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase mb-1">
                  Issue Date
                </span>
                <span className="text-slate-200 font-semibold truncate block">
                  {docData.issueDate || '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase mb-1">
                  Expiry Date
                </span>
                <span className={`font-semibold truncate block ${
                  docData.expiryDate && new Date(docData.expiryDate) < new Date()
                    ? 'text-rose-400 font-bold'
                    : 'text-emerald-400'
                }`}>
                  {docData.expiryDate || 'No Expiry'}
                </span>
              </div>

              {docData.nationality && (
                <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase mb-1">
                    Nationality
                  </span>
                  <span className="text-slate-200 font-semibold truncate block">
                    {docData.nationality}
                  </span>
                </div>
              )}

              {docData.gender && (
                <div className="p-3 bg-slate-950/80 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase mb-1">
                    Gender
                  </span>
                  <span className="text-slate-200 font-semibold truncate block">
                    {docData.gender}
                  </span>
                </div>
              )}

              {docData.address && (
                <div className="col-span-2 p-3 bg-slate-950/80 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase mb-1">
                    Registered Address
                  </span>
                  <span className="text-slate-200 truncate block">
                    {docData.address}
                  </span>
                </div>
              )}
            </div>

            {/* Custom User-Defined Document Fields */}
            {docData.customFields && docData.customFields.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Custom Document Attributes</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {docData.customFields.length} user-defined fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {docData.customFields.map((field) => {
                    const isMasked = field.type === 'masked' && !revealedCustomFields[field.id];
                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-400 block uppercase truncate">
                            {field.label}
                          </span>
                          <span className="text-slate-200 font-semibold truncate block">
                            {isMasked ? '••••••••••••••••' : field.value || '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {field.type === 'masked' && (
                            <button
                              onClick={() => toggleRevealCustomField(field.id)}
                              className="p-1 text-slate-500 hover:text-slate-200"
                              title={isMasked ? 'Reveal field' : 'Conceal field'}
                            >
                              {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(field.value, field.label)}
                            className="p-1 text-slate-500 hover:text-cyan-400"
                            title={`Copy ${field.label}`}
                          >
                            {copiedField === field.label ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Standard Credentials (If Login or non-identity item) */}
        {(!isIdentityDoc || activeItem.password) && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Login Credentials
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username / Email */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Username / Email
                </label>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-200">
                  <span className="truncate">{activeItem.username || '—'}</span>
                  {activeItem.username && (
                    <button
                      onClick={() => copyToClipboard(activeItem.username, 'Username')}
                      className="ml-2 text-slate-400 hover:text-cyan-400 shrink-0"
                      title="Copy username"
                    >
                      {copiedField === 'Username' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">Password</label>
                  {activeItem.password && (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: pwStrength.color }}
                    >
                      {pwStrength.label} ({pwStrength.entropy} bits)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono text-slate-200">
                  <span className="truncate">
                    {showPassword ? activeItem.password || '—' : '••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {activeItem.password && (
                      <button
                        onClick={() => copyToClipboard(activeItem.password, 'Password')}
                        className="text-slate-400 hover:text-cyan-400"
                        title="Copy password"
                      >
                        {copiedField === 'Password' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINKED APPLICATION (Desktop / Mobile App Association) */}
        {activeItem.linkedApp && (
          <div className="bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <AppWindow className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">
                      {activeItem.linkedApp.appName}
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      {activeItem.linkedApp.platform || 'Desktop App'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Linked Process: {activeItem.linkedApp.appIdentifier || 'Process auto-match'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeItem.linkedApp.customProtocolUri && (
                  <button
                    onClick={() => handleLaunchLinkedApp(activeItem.linkedApp?.customProtocolUri, activeItem.linkedApp?.appName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-md shadow-sm transition-colors"
                    title="Launch application on this laptop"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>Open App</span>
                  </button>
                )}
                <button
                  onClick={() => onLaunchAutofillSimulator(activeItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
                  title="Simulate autofill into this desktop app"
                >
                  <Send className="w-3 h-3 text-cyan-400" />
                  <span>Autofill in App</span>
                </button>
              </div>
            </div>

            {activeItem.linkedApp.customProtocolUri && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                <span>Protocol URI: <code className="text-cyan-300">{activeItem.linkedApp.customProtocolUri}</code></span>
                <button
                  onClick={() => copyToClipboard(activeItem.linkedApp!.customProtocolUri!, 'Protocol URI')}
                  className="hover:text-cyan-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy URI</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* KEYPASS / KEYFILE & PASSKEY STORAGE CARD */}
        {activeItem.keyPass && (
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-lg p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileKey className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">
                      {activeItem.keyPass.name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      {activeItem.keyPass.type === 'keyfile'
                        ? 'KeePass 2.x Keyfile'
                        : activeItem.keyPass.type === 'passkey'
                        ? 'FIDO2 Passkey'
                        : 'Raw 256-bit Key'}
                    </span>
                  </div>
                  {activeItem.keyPass.relyingParty && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Relying Party: {activeItem.keyPass.relyingParty} · Credential: {activeItem.keyPass.credentialId || 'Stored'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadKeyPass}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-md shadow-sm transition-colors"
                  title="Download key file to your laptop"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .key</span>
                </button>
                <button
                  onClick={() => copyToClipboard(activeItem.keyPass!.content, 'Key Content')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
                  title="Copy key payload / XML to clipboard"
                >
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>Copy Key</span>
                </button>
              </div>
            </div>

            {/* Key preview box with hide/reveal */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Key Payload:</span>
                <button
                  onClick={() => setShowKeyPassContent(!showKeyPassContent)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                >
                  {showKeyPassContent ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showKeyPassContent ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <div className="text-slate-300 font-mono text-[11px] break-all max-h-24 overflow-y-auto whitespace-pre-wrap">
                {showKeyPassContent
                  ? activeItem.keyPass.content
                  : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM OPTION FIELDS (Additional Key-Value Attributes for this Category) */}
        {!isIdentityDoc && activeItem.customFields && activeItem.customFields.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Custom Option Fields ({activeItem.customFields.length})
                </h3>
              </div>
              <button
                onClick={() => onEdit(activeItem)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                title="Edit custom option fields"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Fields</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeItem.customFields.map((field) => {
                const isMasked = field.type === 'masked' && !revealedCustomFields[field.id];
                return (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold truncate">
                          {field.label}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 border border-slate-700/60 text-slate-400 uppercase font-mono">
                          {field.type}
                        </span>
                      </div>
                      <span className="text-slate-200 font-semibold truncate block">
                        {isMasked ? '••••••••••••••••' : field.value || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {field.type === 'masked' && (
                        <button
                          onClick={() => toggleRevealCustomField(field.id)}
                          className="p-1 text-slate-500 hover:text-slate-200"
                          title={isMasked ? 'Reveal field' : 'Conceal field'}
                        >
                          {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {field.value && (
                        <button
                          onClick={() => copyToClipboard(field.value, field.label)}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                          title={`Copy ${field.label}`}
                        >
                          {copiedField === field.label ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: LIVE 2FA AUTHENTICATOR CODE (TOTP) - If Configured */}
        {activeItem.totpSecret && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Authenticator Code (2FA TOTP)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                RFC 6238 · SHA-1 · 30s Period
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-lg bg-slate-950 border border-cyan-950/60">
              {/* Monospace Code Display with Countdown Ring */}
              <div className="flex items-center gap-5">
                {/* SVG Countdown Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r={circleRadius}
                      className="text-slate-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={circleRadius}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke={remainingSeconds <= 5 ? '#f43f5e' : '#06b6d4'}
                      fill="transparent"
                      className="transition-all duration-300 ease-linear"
                    />
                  </svg>
                  <span
                    className={`absolute text-xs font-mono font-bold tabular-nums ${
                      remainingSeconds <= 5 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                    }`}
                  >
                    {remainingSeconds}s
                  </span>
                </div>

                {/* 6-digit Code */}
                <div>
                  <div className="text-3xl font-mono font-bold tracking-widest text-cyan-300 tabular-nums">
                    {formatOtpDisplay(totpCode)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Refreshes automatically every 30 seconds
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => copyToClipboard(totpCode, '2FA Code')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-md shadow-sm transition-colors"
                >
                  {copiedField === '2FA Code' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onLaunchAutofillSimulator(activeItem)}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
                  title="Simulate autofill in login form"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Autofill</span>
                </button>
              </div>
            </div>

            {/* Secret Key reveal dropdown */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>Secret Key:</span>
                <span className="font-mono text-slate-300">
                  {showTotpSecret ? activeItem.totpSecret : '•••• •••• •••• ••••'}
                </span>
                <button
                  onClick={() => setShowTotpSecret(!showTotpSecret)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {showTotpSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(activeItem.totpSecret!, 'Secret Key')}
                className="hover:text-cyan-400"
              >
                Copy Secret
              </button>
            </div>
          </div>
        )}

        {/* Section 3: EMERGENCY BACKUP CODES (If Logins or Codes Configured) */}
        {!isIdentityDoc && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Emergency Recovery Backup Codes
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    ({totalBackupCodes}/20 Max)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single-use emergency codes when your authenticator device is inaccessible.
                </p>
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onOpenBatchCodes(activeItem)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                  title="Batch paste or import backup codes"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Import / Paste</span>
                </button>

                {totalBackupCodes < MAX_BACKUP_CODES_PER_ITEM && (
                  <>
                    <button
                      onClick={() => handleGenerateSampleCodes(10)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-md hover:bg-emerald-900/40 transition-colors"
                      title="Add 10 sample codes"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ 10 Codes</span>
                    </button>
                    <button
                      onClick={() => handleGenerateSampleCodes(20)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded-md hover:bg-cyan-900/40 transition-colors"
                      title="Fill up to max 20 codes"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ 20 (Max)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick single code add input */}
            {totalBackupCodes < MAX_BACKUP_CODES_PER_ITEM && (
              <div className="flex items-center gap-2 p-2 bg-slate-950/80 rounded-md border border-slate-800">
                <input
                  type="text"
                  value={singleBackupInput}
                  onChange={(e) => setSingleBackupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSingleBackupDirect();
                    }
                  }}
                  placeholder="Paste single code OR full pass list separated by space/comma (e.g. 1234567 8765437) & press Enter"
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddSingleBackupDirect}
                  disabled={!singleBackupInput.trim()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded transition-colors shrink-0"
                >
                  + Add / Breakdown
                </button>
              </div>
            )}

            {/* Combined/Lumped Codes Detected Banner */}
            {hasLumpedBackupCodes && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-100">Combined pass list detected in backup codes</span>
                    <p className="text-indigo-300/80 text-[11px] mt-0.5">
                      Entry contains multiple codes separated by spaces or commas. Click to breakdown each code 1-by-1.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => breakdownItemBackupCodes(activeItem.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-colors whitespace-nowrap shadow-sm"
                >
                  Break Down 1-by-1
                </button>
              </div>
            )}

            {/* Low Backup Warning Banner */}
            {isLowBackupWarning && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <div className="flex-1">
                  <span className="font-semibold">Critical: Only {unusedBackupCodes.length} backup code left!</span>
                  <p className="text-amber-400/80 text-[11px] mt-0.5">
                    Sign in to {activeItem.title} and generate a fresh set of recovery codes before you lose access.
                  </p>
                </div>
                <button
                  onClick={() => onOpenBatchCodes(activeItem)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors whitespace-nowrap"
                >
                  Add New Codes
                </button>
              </div>
            )}

            {/* Prominent "Auto-Fill Next Backup Code" Feature Card */}
            {nextBackupCode && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Next Active Backup Code in Queue
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold tracking-wider text-slate-100 tabular-nums">
                    {nextBackupCode.code}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {unusedBackupCodes.length} available · {usedBackupCodes.length} used · Clicking auto-fill will use this code & record the event.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutofillNextBackupCode}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-md shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title="Auto-fill this code into clipboard / target form and mark as used"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Auto-Fill Next Code</span>
                  </button>
                </div>
              </div>
            )}

            {/* Backup Codes Table / Grid */}
            {totalBackupCodes > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>All Backup Codes ({unusedBackupCodes.length} active / {totalBackupCodes} total)</span>
                  <span>Actions</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeItem.backupCodes.map((bc, idx) => {
                    return (
                      <div
                        key={bc.id}
                        className={`flex items-center justify-between p-2.5 rounded border text-xs font-mono transition-colors ${
                          bc.isUsed
                            ? 'bg-slate-950/60 border-slate-800/80 text-slate-500 line-through'
                            : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => toggleBackupCodeStatus(activeItem.id, bc.id)}
                            className={`p-0.5 rounded transition-colors ${
                              bc.isUsed
                                ? 'text-slate-600 hover:text-slate-400'
                                : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                            title={bc.isUsed ? 'Mark as unused' : 'Mark as used'}
                          >
                            {bc.isUsed ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-[11px] text-slate-500 select-none">
                            #{idx + 1}
                          </span>
                          <span className={`font-semibold tracking-wide ${bc.isUsed ? 'text-slate-500' : 'text-slate-200'}`}>
                            {bc.code}
                          </span>
                          {containsMultipleCodes(bc.code) && (
                            <button
                              type="button"
                              onClick={() => handleBreakdownSingleLumped(bc.id, bc.code)}
                              className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 rounded transition-colors"
                              title="Separate this combined list into individual 1-by-1 codes"
                            >
                              Separate 1-by-1
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {bc.isUsed ? (
                            <span className="text-[10px] text-slate-600 no-underline italic">
                              Used
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                copyToClipboard(bc.code, `Backup Code ${bc.code}`);
                              }}
                              className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteBackupCode(activeItem.id, bc.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 rounded ml-1"
                            title="Delete code"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  No backup emergency codes saved for this account.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onOpenBatchCodes(activeItem)}
                    className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 rounded-md hover:bg-cyan-900/40 transition-colors"
                  >
                    Import Pasted Codes
                  </button>
                  <button
                    onClick={() => handleGenerateSampleCodes(8)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-md hover:bg-emerald-900/40 transition-colors"
                  >
                    Generate 8 Sample Codes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Notes & Tags */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Notes & Metadata
          </div>

          {activeItem.notes ? (
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {activeItem.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-600 italic">No notes added</p>
          )}

          {activeItem.tags && activeItem.tags.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Tags:</span>
              <span className="text-slate-300 font-mono">
                {activeItem.tags.join(' · ')}
              </span>
            </div>
          )}

          {activeItem.lastFilledAt && (
            <div className="text-[11px] text-slate-500 font-mono pt-1">
              Last autofilled: {new Date(activeItem.lastFilledAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

