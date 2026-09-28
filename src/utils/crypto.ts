import { PasswordStrength, BackupCode } from '../types/vault';

// Character sets for password generation
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'Il1O0';

const PASSPHRASE_WORDS = [
  'cascade', 'falcon', 'nebula', 'whisper', 'cobalt', 'horizon', 'sapphire',
  'monarch', 'crystal', 'vertex', 'timber', 'glacier', 'phantom', 'solitude',
  'quantum', 'ember', 'shield', 'compass', 'radiant', 'breeze', 'thunder',
  'zenith', 'beacon', 'harbor', 'voyage', 'summit', 'aurora', 'ironclad',
  'matrix', 'silver', 'trident', 'vector', 'canyon', 'vortex', 'shadow',
  'cosmic', 'stellar', 'plasma', 'titan', 'marble', 'granite', 'obsidian',
  'phoenix', 'lynx', 'panther', 'crescent', 'pulse', 'cipher', 'echo'
];

export interface PasswordGeneratorOptions {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean;
  isPassphrase?: boolean;
  wordCount?: number;
  wordSeparator?: string;
  includeNumber?: boolean;
}

/**
 * Generates a cryptographically strong random password or passphrase
 */
export function generatePassword(options: PasswordGeneratorOptions): string {
  if (options.isPassphrase) {
    const wordCount = options.wordCount || 4;
    const sep = options.wordSeparator !== undefined ? options.wordSeparator : '-';
    const words: string[] = [];
    const array = new Uint32Array(wordCount);
    crypto.getRandomValues(array);

    for (let i = 0; i < wordCount; i++) {
      const idx = array[i] % PASSPHRASE_WORDS.length;
      words.push(PASSPHRASE_WORDS[idx]);
    }

    let result = words.join(sep);
    if (options.includeNumber) {
      const numArr = new Uint8Array(1);
      crypto.getRandomValues(numArr);
      result += `${sep}${(numArr[0] % 90) + 10}`;
    }
    return result;
  }

  let charset = '';
  if (options.useLowercase) charset += LOWERCASE;
  if (options.useUppercase) charset += UPPERCASE;
  if (options.useNumbers) charset += NUMBERS;
  if (options.useSymbols) charset += SYMBOLS;

  if (options.avoidAmbiguous) {
    for (const ch of AMBIGUOUS) {
      charset = charset.replaceAll(ch, '');
    }
  }

  if (!charset) charset = LOWERCASE + NUMBERS;

  const length = Math.max(6, Math.min(128, options.length || 16));
  const randomBytes = new Uint32Array(length);
  crypto.getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(randomBytes[i] % charset.length);
  }

  return password;
}

/**
 * Calculates password strength and estimated entropy
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      entropy: 0,
      label: 'Very Weak',
      color: '#ef4444',
      feedback: ['Enter a password to test its strength.'],
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  if (poolSize === 0) poolSize = 1;
  const entropy = Math.round(password.length * Math.log2(poolSize));

  const feedback: string[] = [];
  if (password.length < 12) {
    feedback.push('Use at least 12 characters for better resilience.');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers to increase complexity.');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special symbols (e.g. !@#$) to increase entropy.');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    feedback.push('Mix uppercase and lowercase letters.');
  }

  let score = 0;
  let label: PasswordStrength['label'] = 'Very Weak';
  let color = '#ef4444';

  if (entropy >= 80 && password.length >= 14) {
    score = 4;
    label = 'Very Strong';
    color = '#10b981'; // emerald
  } else if (entropy >= 60 && password.length >= 12) {
    score = 3;
    label = 'Strong';
    color = '#06b6d4'; // cyan
  } else if (entropy >= 40 && password.length >= 8) {
    score = 2;
    label = 'Fair';
    color = '#f59e0b'; // amber
  } else if (entropy >= 25) {
    score = 1;
    label = 'Weak';
    color = '#f97316'; // orange
  } else {
    score = 0;
    label = 'Very Weak';
    color = '#ef4444'; // red
  }

  return {
    score,
    entropy,
    label,
    color,
    feedback: feedback.length ? feedback : ['Meets high security entropy standards.'],
  };
}

/**
 * Generates an array of fresh backup codes
 * Default format: 8-character hex alphanumeric (e.g., "7f3b-9a12" or "84920194")
 */
export function generateSampleBackupCodes(
  count: number = 8,
  format: 'alphanumeric_dashed' | 'numeric' = 'alphanumeric_dashed'
): BackupCode[] {
  const codes: BackupCode[] = [];
  const chars = '0123456789abcdef';

  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);

    let codeStr = '';
    if (format === 'numeric') {
      let numStr = '';
      for (let j = 0; j < 8; j++) {
        numStr += (bytes[j] % 10).toString();
      }
      codeStr = numStr;
    } else {
      // 4-char dash 4-char (e.g., "94ae-b8c1")
      for (let j = 0; j < 8; j++) {
        codeStr += chars[bytes[j] % chars.length];
        if (j === 3) codeStr += '-';
      }
    }

    codes.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `bc_${Date.now()}_${i}`,
      code: codeStr,
      isUsed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return codes;
}

/**
 * Detects if a string contains multiple backup codes (e.g. separated by spaces, commas, newlines, semicolons)
 */
export function containsMultipleCodes(input: string): boolean {
  if (!input) return false;
  // If input contains spaces, commas, newlines, tabs, semicolons, pipes
  return /[\s,;\n\t|]/.test(input.trim());
}

/**
 * Parses raw text containing one or more backup codes.
 * Robustly breaks down lists separated by spaces (' '), commas (','), tabs ('\t'),
 * newlines ('\n'), semicolons (';'), pipes ('|'), slashes, or bullet points.
 * Handles space-separated strings like: "1234567 8765437 87643279 98765378 87643 xvvgdj"
 * Handles comma-separated strings like: "1234567, 8765437, 87643279, 98765378"
 * Handles numbered lists like: "1. 1234567, 2. 8765437" or "#1 1234567"
 * Supports up to 20 codes per account.
 */
export function parseRawBackupCodes(rawInput: string, maxCount: number = 20): BackupCode[] {
  if (!rawInput || !rawInput.trim()) return [];

  // Normalize delimiters: replace newlines, carriage returns, tabs, commas, semicolons, pipes, slashes, brackets with spaces
  const normalized = rawInput
    .replace(/[\r\n\t,;|/]+/g, ' ')
    .replace(/[[\]()]/g, ' ');

  // Split by any sequence of whitespace
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const result: BackupCode[] = [];
  const seen = new Set<string>();

  for (const rawToken of rawTokens) {
    if (result.length >= maxCount) break;

    // Strip quotes, bullets, numbering like "1.", "1:", "#1", "- ", "* "
    let token = rawToken
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^[\s*\-•#>:]+/g, '')
      .replace(/^[#]?\d+[\.:\)\-]\s*/, '') // e.g. "1." or "12:" or "#1-"
      .replace(/[.,;:"'!]+$/g, '')
      .trim();

    // Ignore single punctuation or purely non-alphanumeric noise
    if (!token || /^[^a-zA-Z0-9]+$/.test(token)) continue;

    // Ignore common words in download headers or instructions
    const lower = token.toLowerCase();
    if (['backup', 'codes', 'recovery', 'code', 'two-factor', 'mfa', 'auth', 'keys', 'key', 'pass', 'list', 'each', 'unused', 'used', 'emergency'].includes(lower)) {
      continue;
    }

    // Must be valid code: at least 3 alphanumeric/dash/underscore characters and up to 48 characters
    if (token.length >= 3 && token.length <= 48 && /[a-zA-Z0-9]/.test(token)) {
      if (!seen.has(token.toLowerCase())) {
        seen.add(token.toLowerCase());
        result.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `bc_${Math.random().toString(36).substring(2, 9)}`,
          code: token,
          isUsed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return result;
}

/**
 * Derives AES-GCM 256-bit encryption key from password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as ArrayBufferView<ArrayBuffer>,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string with a master password using AES-GCM 256
 */
export async function encryptData(data: string, masterPassword: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveKey(masterPassword, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );

  // Combine salt + iv + ciphertext and base64 encode
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 string encrypted with encryptData
 */
export async function decryptData(encryptedBase64: string, masterPassword: string): Promise<string> {
  const binary = atob(encryptedBase64);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const key = await deriveKey(masterPassword, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}
