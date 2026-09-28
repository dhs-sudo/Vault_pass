/**
 * RFC 6238 Time-Based One-Time Password (TOTP) Implementation
 * Uses Web Crypto API for client-side cryptographic hashing.
 */

// Base32 character set (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Uint8Array
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  // Strip whitespace, hyphens, and convert to uppercase
  const cleaned = base32.replace(/[\s\-_=]/g, '').toUpperCase();
  const length = cleaned.length;
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < length; i++) {
    const char = cleaned.charAt(i);
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) {
      continue; // Skip invalid characters gracefully
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Generates a random Base32 secret string (16 or 32 chars)
 */
export function generateRandomBase32Secret(length: number = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE32_CHARS.charAt(bytes[i] % BASE32_CHARS.length);
  }
  return result;
}

/**
 * Calculates current TOTP code for a Base32 secret
 */
export async function generateTOTPCode(
  secret: string,
  digits: 6 | 8 = 6,
  period: number = 30,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-1',
  timestampMs: number = Date.now()
): Promise<string> {
  if (!secret || secret.trim() === '') {
    return '------';
  }

  try {
    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) {
      return '------';
    }

    const epochSeconds = Math.floor(timestampMs / 1000);
    const counter = Math.floor(epochSeconds / period);

    // Convert counter into 8-byte big-endian ArrayBuffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    // Write 64-bit integer (high 32 bits and low 32 bits)
    const high32 = Math.floor(counter / 0x100000000);
    const low32 = counter & 0xffffffff;
    counterView.setUint32(0, high32, false);
    counterView.setUint32(4, low32, false);

    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes as ArrayBufferView<ArrayBuffer>,
      { name: 'HMAC', hash: { name: algorithm } },
      false,
      ['sign']
    );

    // Sign the counter
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmacBytes = new Uint8Array(signature);

    // Dynamic Truncation (RFC 4226)
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const modulo = Math.pow(10, digits);
    const code = (binary % modulo).toString().padStart(digits, '0');
    return code;
  } catch (err) {
    console.error('Error generating TOTP:', err);
    return '------';
  }
}

/**
 * Returns remaining seconds and progress percentage (0 - 100) for the current 30s period
 */
export function getTOTPTimeRemaining(period: number = 30): {
  remainingSeconds: number;
  percentage: number;
} {
  const currentSeconds = Math.floor(Date.now() / 1000) % period;
  const remainingSeconds = period - currentSeconds;
  const percentage = (remainingSeconds / period) * 100;
  return { remainingSeconds, percentage };
}

export interface ParsedOtpAuth {
  type: 'totp';
  label: string;
  issuer?: string;
  account?: string;
  secret: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
}

/**
 * Parses otpauth:// URI (standard format used by Google Authenticator, Authy, 1Password)
 */
export function parseOtpAuthUri(uri: string): ParsedOtpAuth | null {
  try {
    const cleanUri = uri.trim();
    if (!cleanUri.startsWith('otpauth://')) {
      return null;
    }

    const url = new URL(cleanUri);
    const path = decodeURIComponent(url.pathname.replace(/^\/\/?totp\//i, ''));
    let issuer = url.searchParams.get('issuer') || '';
    let account = path;

    if (path.includes(':')) {
      const parts = path.split(':');
      if (!issuer) issuer = parts[0];
      account = parts.slice(1).join(':');
    }

    const secret = url.searchParams.get('secret') || '';
    const digitsParam = url.searchParams.get('digits');
    const digits = digitsParam === '8' ? 8 : 6;
    const periodParam = url.searchParams.get('period');
    const period = periodParam ? parseInt(periodParam, 10) : 30;
    const algorithmParam = url.searchParams.get('algorithm')?.toUpperCase();
    const algorithm = (algorithmParam === 'SHA256' || algorithmParam === 'SHA512')
      ? algorithmParam
      : 'SHA1';

    return {
      type: 'totp',
      label: account || issuer || 'Authenticator Item',
      issuer: issuer || undefined,
      account: account || undefined,
      secret,
      digits,
      period,
      algorithm,
    };
  } catch {
    return null;
  }
}

/**
 * Formats a 6-digit or 8-digit code with space in middle for human reading
 * e.g. "123456" -> "123 456", "12345678" -> "1234 5678"
 */
export function formatOtpDisplay(code: string): string {
  if (!code || code === '------') return '------';
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  if (code.length === 8) {
    return `${code.slice(0, 4)} ${code.slice(4)}`;
  }
  return code;
}
