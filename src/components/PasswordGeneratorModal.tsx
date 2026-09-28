import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import {
  generatePassword,
  evaluatePasswordStrength,
  PasswordGeneratorOptions,
} from '../utils/crypto';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  Shield,
} from 'lucide-react';

interface PasswordGeneratorModalProps {
  onClose: () => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  onClose,
}) => {
  const { showToast } = useVault();

  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 20,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    avoidAmbiguous: true,
    isPassphrase: false,
    wordCount: 4,
    wordSeparator: '-',
    includeNumber: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    const pw = generatePassword(options);
    setGeneratedPassword(pw);
  };

  useEffect(() => {
    handleRegenerate();
  }, [options]);

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      showToast('Generated password copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const strength = evaluatePasswordStrength(generatedPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Cryptographic Password Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Password Output Box */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-base font-semibold text-slate-100 break-all select-all">
                {generatedPassword}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleRegenerate}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                  title="Generate New Password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Strength meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Strength: {strength.label}</span>
                <span style={{ color: strength.color }}>{strength.entropy} bits entropy</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (strength.entropy / 90) * 100)}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setOptions({ ...options, isPassphrase: false })}
              className={`flex-1 py-1.5 rounded font-medium transition-colors ${
                !options.isPassphrase
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Random Characters
            </button>
            <button
              onClick={() => setOptions({ ...options, isPassphrase: true })}
              className={`flex-1 py-1.5 rounded font-medium transition-colors ${
                options.isPassphrase
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Memorable Passphrase
            </button>
          </div>

          {/* Controls */}
          {!options.isPassphrase ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Password Length</span>
                  <span className="font-mono text-cyan-400 font-bold">{options.length} chars</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={options.length}
                  onChange={(e) =>
                    setOptions({ ...options, length: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.useUppercase}
                    onChange={(e) =>
                      setOptions({ ...options, useUppercase: e.target.checked })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.useLowercase}
                    onChange={(e) =>
                      setOptions({ ...options, useLowercase: e.target.checked })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span>Lowercase (a-z)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.useNumbers}
                    onChange={(e) =>
                      setOptions({ ...options, useNumbers: e.target.checked })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span>Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.useSymbols}
                    onChange={(e) =>
                      setOptions({ ...options, useSymbols: e.target.checked })
                    }
                    className="accent-cyan-500 rounded"
                  />
                  <span>Symbols (!@#$)</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={options.avoidAmbiguous}
                  onChange={(e) =>
                    setOptions({ ...options, avoidAmbiguous: e.target.checked })
                  }
                  className="accent-cyan-500 rounded"
                />
                <span>Exclude ambiguous characters (e.g. 1, l, I, 0, O)</span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Number of Words</span>
                  <span className="font-mono text-cyan-400 font-bold">{options.wordCount} words</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={options.wordCount || 4}
                  onChange={(e) =>
                    setOptions({ ...options, wordCount: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-300">Word Separator:</label>
                <select
                  value={options.wordSeparator}
                  onChange={(e) =>
                    setOptions({ ...options, wordSeparator: e.target.value })
                  }
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                >
                  <option value="-">Hyphen (-)</option>
                  <option value=".">Period (.)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=" ">Space ( )</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNumber}
                  onChange={(e) =>
                    setOptions({ ...options, includeNumber: e.target.checked })
                  }
                  className="accent-cyan-500 rounded"
                />
                <span>Append random 2-digit number suffix</span>
              </label>
            </div>
          )}
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
