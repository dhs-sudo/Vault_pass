import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authorized emails for this private vault
export const AUTHORIZED_EMAILS = [
  'inbox.dhs@gmail.com',
  'work@dhnj.co.uk',
];

export const isAuthorizedEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_EMAILS.some((auth) => auth.toLowerCase() === normalized);
};

export interface CloudVaultPayload {
  encryptedPayload: string;
  itemCount: number;
  updatedAt: string;
  userEmail: string;
}

// Upload encrypted vault blob to Cloud Firestore
export const uploadEncryptedVaultToCloud = async (
  userId: string,
  userEmail: string,
  payload: {
    encryptedPayload: string;
    itemCount: number;
  }
): Promise<void> => {
  const vaultRef = doc(db, 'users', userId, 'vault_data', 'current_vault');
  const userRef = doc(db, 'users', userId);

  const now = new Date().toISOString();

  await setDoc(userRef, {
    email: userEmail,
    updatedAt: now,
  }, { merge: true });

  await setDoc(vaultRef, {
    userId,
    userEmail,
    encryptedPayload: payload.encryptedPayload,
    itemCount: payload.itemCount,
    updatedAt: now,
  });
};

// Fetch encrypted vault blob from Cloud Firestore
export const fetchEncryptedVaultFromCloud = async (
  userId: string
): Promise<CloudVaultPayload | null> => {
  const vaultRef = doc(db, 'users', userId, 'vault_data', 'current_vault');
  const snapshot = await getDoc(vaultRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as CloudVaultPayload;
};

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
export type { User };
