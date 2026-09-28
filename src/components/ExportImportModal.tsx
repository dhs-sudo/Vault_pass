import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { X, Download, Upload, FileJson, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExportImportModalProps {
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ onClose }) => {
  const { exportVault, importVault, showToast } = useVault();
  const [importJson, setImportJson] = useState('');
  const [resultMessage, setResultMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleDownload = () => {
    const data = exportVault();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherkey-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Vault backup downloaded', 'success');
  };

  const handleImportSubmit = () => {
    if (!importJson.trim()) return;
    const res = importVault(importJson);
    if (res.success) {
      setResultMessage({ text: `Successfully imported ${res.count} items!` });
      setTimeout(() => onClose(), 1500);
    } else {
      setResultMessage({ text: `Import failed: ${res.error}`, isError: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Export & Import Vault Backup
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Export Vault</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Save all passwords, TOTP keys, and backup codes to an offline JSON file.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Import Vault Backup</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload a JSON file or paste exported contents.
              </p>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />

            <textarea
              rows={4}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Or paste backup JSON content here..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />

            {resultMessage && (
              <div
                className={`p-2 rounded text-xs flex items-center gap-1.5 ${
                  resultMessage.isError
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {resultMessage.isError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{resultMessage.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleImportSubmit}
                disabled={!importJson.trim()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import and Restore</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
