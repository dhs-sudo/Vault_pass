import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  isAuthorizedEmail,
  AUTHORIZED_EMAILS,
  uploadEncryptedVaultToCloud,
  fetchEncryptedVaultFromCloud,
} from '../services/firebase';
import { useVault } from '../context/VaultContext';
import { encryptData, decryptData } from '../utils/crypto';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { items, showToast, importVault, exportVault } = useVault();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user.email && !isAuthorizedEmail(res.user.email)) {
        await signOut(auth);
        setErrorMsg(
          `Unauthorized email (${res.user.email}). Only authorized accounts (${AUTHORIZED_EMAILS.join(', ')}) have access.`
        );
        return;
      }
      showToast(`Signed in as ${res.user.email}`, 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (!isAuthorizedEmail(email)) {
      setErrorMsg(
        `This vault is locked to authorized accounts only (${AUTHORIZED_EMAILS.join(', ')}).`
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isRegisterMode) {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        showToast(`Account created for ${res.user.email}`, 'success');
      } else {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        showToast(`Welcome back, ${res.user.email}!`, 'success');
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid login details. If this is your first time, switch to "Create Account".');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email already registered. Switch to "Sign In" mode.');
      } else {
        setErrorMsg(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out of cloud sync', 'info');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out');
    }
  };

  const handleSyncUpload = async () => {
    if (!currentUser || !currentUser.email) {
      setErrorMsg('Please sign in first to sync with cloud.');
      return;
    }

    const passToUse = vaultPassword || 'master123';

    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Client-Side AES-256 GCM Encryption
      const jsonStr = exportVault();
      const encryptedBase64 = await encryptData(jsonStr, passToUse);

      // 2. Upload to Firestore
      await uploadEncryptedVaultToCloud(currentUser.uid, currentUser.email, {
        encryptedPayload: encryptedBase64,
        itemCount: items.length,
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      showToast(`Synced ${items.length} items securely to cloud!`, 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload vault to cloud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!currentUser || !currentUser.email) {
      setErrorMsg('Please sign in first to fetch cloud vault.');
      return;
    }

    const passToUse = vaultPassword || 'master123';

    setIsLoading(true);
    setErrorMsg('');
    try {
      const cloudData = await fetchEncryptedVaultFromCloud(currentUser.uid);
      if (!cloudData) {
        setErrorMsg('No vault backup found on the cloud for this account.');
        return;
      }

      // Decrypt using master password
      const decryptedJson = await decryptData(cloudData.encryptedPayload, passToUse);
      const result = importVault(decryptedJson);

      if (result.success) {
        showToast(`Restored ${result.count} items from cloud!`, 'success');
      } else {
        setErrorMsg(result.error || 'Decryption failed. Ensure your master password matches.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to decrypt cloud vault. Please check your Master Password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with vibrant Purple & Bubblegum Pink Gradient */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/70 via-slate-900 to-pink-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-fuchsia-400 p-[1.5px] shadow-lg shadow-pink-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-pink-400">
                <Cloud className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-200 bg-clip-text text-transparent">
                Cloud Sync & Accounts
              </h3>
              <p className="text-[11px] text-pink-300/70 font-mono">
                End-to-End Encrypted · 2 Authorized Emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Signed In</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors font-mono"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-bold text-white block truncate">
                    {currentUser.email}
                  </span>
                  <span className="text-[11px] text-purple-300/80 font-mono mt-0.5 block">
                    Authorized Vault Member
                  </span>
                </div>
              </div>

              {/* Master Password input for encryption/decryption */}
              <div>
                <label className="text-[11px] font-medium text-purple-300 block mb-1">
                  Vault Master Password (for encryption)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Enter Master Password (default: master123)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSyncUpload}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50"
                >
                  <CloudUpload className="w-5 h-5 mb-1.5" />
                  <span>Sync to Cloud</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">
                    ({items.length} items)
                  </span>
                </button>

                <button
                  onClick={handleRestoreFromCloud}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-purple-500/30 text-purple-200 font-semibold text-xs transition-all disabled:opacity-50"
                >
                  <CloudDownload className="w-5 h-5 mb-1.5 text-pink-400" />
                  <span>Restore from Cloud</span>
                  <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                    Download backup
                  </span>
                </button>
              </div>

              {lastSyncTime && (
                <p className="text-[11px] text-center text-slate-400 font-mono">
                  Last uploaded at {lastSyncTime}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Authorized Email Notice */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/25 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-purple-200 leading-relaxed">
                  <strong>Authorized accounts for this vault:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-pink-300 font-mono">
                    <li>inbox.dhs@gmail.com (Google Sign-In)</li>
                    <li>work@dhnj.co.uk (Email Login)</li>
                  </ul>
                </div>
              </div>

              {/* One-Click Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google (inbox.dhs@gmail.com)</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] uppercase font-mono text-slate-500">or email login</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="work@dhnj.co.uk"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition-all disabled:opacity-50"
                >
                  {isRegisterMode ? 'Create Account' : 'Sign In with Email'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    {isRegisterMode
                      ? 'Already have an account? Sign In'
                      : 'First time using this email? Create Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-purple-300">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>AES-256 GCM Zero-Knowledge</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">Firebase Spark Free Tier</span>
          </div>
        </div>
      </div>
    </div>
  );
};
