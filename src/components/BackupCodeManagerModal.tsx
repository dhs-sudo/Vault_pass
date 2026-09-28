import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem, BackupCode } from '../types/vault';
import { parseRawBackupCodes, generateSampleBackupCodes, containsMultipleCodes } from '../utils/crypto';
import {
  X,
  KeyRound,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
  Upload,
  Copy,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface BackupCodeManagerModalProps {
  item: VaultItem;
  onClose: () => void;
}

export const BackupCodeManagerModal: React.FC<BackupCodeManagerModalProps> = ({
  item,
  onClose,
}) => {
  const {
    replaceBackupCodesForItem,
    addBackupCodesToItem,
    toggleBackupCodeStatus,
    deleteBackupCode,
    breakdownItemBackupCodes,
    showToast,
  } = useVault();

  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');

  const unusedCount = item.backupCodes.filter((c) => !c.isUsed).length;
  const usedCount = item.backupCodes.filter((c) => c.isUsed).length;
  const totalCount = item.backupCodes.length;

  const liveParsed = parseRawBackupCodes(rawText, 20);

  const handleImport = () => {
    const parsed = parseRawBackupCodes(rawText, 20);
    if (parsed.length === 0) {
      showToast('No valid backup codes found in text', 'warning');
      return;
    }

    if (importMode === 'replace') {
      const limited = parsed.slice(0, 20);
      replaceBackupCodesForItem(item.id, limited);
    } else {
      const remainingSlots = Math.max(0, 20 - item.backupCodes.length);
      if (remainingSlots <= 0) {
        showToast('Vault already has maximum of 20 backup codes for this account', 'warning');
        return;
      }
      const limited = parsed.slice(0, remainingSlots);
      addBackupCodesToItem(item.id, limited);
    }

    setRawText('');
    showToast(`Successfully saved backup codes (max 20 per item)`, 'success');
  };

  const handleGenerateFreshCodes = (count: number = 10) => {
    const newCodes = generateSampleBackupCodes(count, 'alphanumeric_dashed');
    replaceBackupCodesForItem(item.id, newCodes);
    showToast(`Generated ${count} backup codes`, 'success');
  };

  const handleResetAllToUnused = () => {
    const updated = item.backupCodes.map((bc) => ({
      ...bc,
      isUsed: false,
      usedAt: undefined,
    }));
    replaceBackupCodesForItem(item.id, updated);
    showToast('Reset all backup codes to active state', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Backup Codes Manager: {item.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage one-time recovery codes for account emergency access.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                {unusedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Available Unused</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-lg font-mono font-bold text-slate-500 tabular-nums">
                {usedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Used / Burned</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-lg font-mono font-bold text-slate-200 tabular-nums">
                {totalCount} <span className="text-xs text-slate-500 font-normal">/ 20</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Capacity (Max 20)</div>
            </div>
          </div>

          {/* Paste or Import Section */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-200 block">
                  Paste Recovery Codes List
                </label>
                <span className="text-[10px] text-slate-500">Supports up to 20 codes per account</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    importMode === 'replace'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Replace All
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    importMode === 'append'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Append to List
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste backup codes (up to 20 codes, separated by space, newlines, or commas)&#10;e.g.: 1234567 8765437 87643279 98765378 87643 xvvgdj"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />

            {rawText.trim() && (
              <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-cyan-500/30 font-mono text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detected <strong>{liveParsed.length}</strong> codes broken down 1-by-1 (separated by space or comma)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {importMode === 'replace' ? 'Will replace list' : 'Will append to list'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateFreshCodes(10)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 10 Codes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateFreshCodes(20)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 20 (Max)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={!rawText.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-md transition-colors"
              >
                Import {liveParsed.length > 0 ? `${liveParsed.length} Codes 1-by-1` : 'Codes'}
              </button>
            </div>
          </div>

          {/* Current Codes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Existing Backup Codes</span>
              {usedCount > 0 && (
                <button
                  onClick={handleResetAllToUnused}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All to Unused</span>
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {item.backupCodes.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  No emergency codes saved. Paste or generate codes above.
                </p>
              ) : (
                item.backupCodes.map((bc, idx) => (
                  <div
                    key={bc.id}
                    className={`flex items-center justify-between p-2 rounded border text-xs font-mono transition-colors ${
                      bc.isUsed
                        ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-950 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleBackupCodeStatus(item.id, bc.id)}
                        className={bc.isUsed ? 'text-slate-600 hover:text-slate-400' : 'text-emerald-400'}
                        title={bc.isUsed ? 'Mark as unused' : 'Mark as used'}
                      >
                        {bc.isUsed ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <span className="text-slate-500 select-none text-[11px]">#{idx + 1}</span>
                      <span className="font-bold tracking-wider">{bc.code}</span>
                      {containsMultipleCodes(bc.code) && (
                        <button
                          type="button"
                          onClick={() => breakdownItemBackupCodes(item.id)}
                          className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 rounded transition-colors"
                          title="Break down this combined list into separate 1-by-1 codes"
                        >
                          Separate 1-by-1
                        </button>
                      )}
                      {bc.usedAt && (
                        <span className="text-[10px] text-slate-600 no-underline italic">
                          (Used {new Date(bc.usedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deleteBackupCode(item.id, bc.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded"
                      title="Delete code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
