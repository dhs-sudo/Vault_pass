import { LinkedAppInfo, KeyPassData } from '../types/vault';

export interface AppPreset {
  appName: string;
  appIdentifier: string;
  customProtocolUri: string;
  platform: 'desktop' | 'mobile' | 'universal' | 'cli';
  keywords: string[];
}

export const POPULAR_APP_PRESETS: AppPreset[] = [
  {
    appName: 'Discord',
    appIdentifier: 'com.hnc.Discord / Discord.exe',
    customProtocolUri: 'discord://',
    platform: 'universal',
    keywords: ['discord', 'discordapp.com', 'discord.gg', 'discord.com'],
  },
  {
    appName: 'Slack',
    appIdentifier: 'com.tinyspeck.slackmacgap / slack.exe',
    customProtocolUri: 'slack://',
    platform: 'desktop',
    keywords: ['slack', 'slack.com'],
  },
  {
    appName: 'Spotify',
    appIdentifier: 'com.spotify.client / spotify.exe',
    customProtocolUri: 'spotify://',
    platform: 'universal',
    keywords: ['spotify', 'spotify.com'],
  },
  {
    appName: 'Steam',
    appIdentifier: 'com.valvesoftware.steam / steam.exe',
    customProtocolUri: 'steam://',
    platform: 'desktop',
    keywords: ['steam', 'steampowered.com', 'steamcommunity.com'],
  },
  {
    appName: 'Telegram Desktop',
    appIdentifier: 'ru.keepcoder.Telegram / Telegram.exe',
    customProtocolUri: 'tg://',
    platform: 'universal',
    keywords: ['telegram', 't.me', 'web.telegram.org'],
  },
  {
    appName: 'GitHub Desktop',
    appIdentifier: 'com.github.GitHubClient / GitHubDesktop.exe',
    customProtocolUri: 'x-github-client://',
    platform: 'desktop',
    keywords: ['github', 'github.com', 'github.io'],
  },
  {
    appName: 'Figma Desktop',
    appIdentifier: 'com.figma.Desktop / Figma.exe',
    customProtocolUri: 'figma://',
    platform: 'desktop',
    keywords: ['figma', 'figma.com'],
  },
  {
    appName: 'Zoom Workplace',
    appIdentifier: 'us.zoom.xos / Zoom.exe',
    customProtocolUri: 'zoommtg://',
    platform: 'universal',
    keywords: ['zoom', 'zoom.us', 'zoom.com'],
  },
  {
    appName: 'Notion',
    appIdentifier: 'notion.id / Notion.exe',
    customProtocolUri: 'notion://',
    platform: 'universal',
    keywords: ['notion', 'notion.so', 'notion.site'],
  },
  {
    appName: 'WhatsApp Desktop',
    appIdentifier: 'net.whatsapp.WhatsApp / WhatsApp.exe',
    customProtocolUri: 'whatsapp://',
    platform: 'universal',
    keywords: ['whatsapp', 'web.whatsapp.com'],
  },
  {
    appName: 'Obsidian',
    appIdentifier: 'md.obsidian / Obsidian.exe',
    customProtocolUri: 'obsidian://',
    platform: 'desktop',
    keywords: ['obsidian', 'obsidian.md'],
  },
  {
    appName: 'VS Code',
    appIdentifier: 'com.microsoft.VSCode / Code.exe',
    customProtocolUri: 'vscode://',
    platform: 'desktop',
    keywords: ['vscode', 'visualstudio.com', 'code.visualstudio.com'],
  },
];

/**
 * Automatically detects if a given title or URL matches a native/desktop application
 */
export function detectLinkedApp(input: string): LinkedAppInfo | null {
  if (!input) return null;
  const clean = input.toLowerCase();

  for (const preset of POPULAR_APP_PRESETS) {
    if (preset.keywords.some((kw) => clean.includes(kw))) {
      return {
        appName: preset.appName,
        appIdentifier: preset.appIdentifier,
        customProtocolUri: preset.customProtocolUri,
        platform: preset.platform,
        launchSupported: !!preset.customProtocolUri,
      };
    }
  }

  return null;
}

/**
 * Generates a standard KeePass 2.x XML Keyfile content
 */
export function generateKeePassXmlKeyfile(fileName: string = 'master-vault.key'): {
  content: string;
  name: string;
} {
  // Generate 256 bits (32 bytes) of cryptographically secure random bytes
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  
  // Convert to Base64
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = window.btoa(binary);

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<KeyFile>
  <Meta>
    <Version>1.00</Version>
  </Meta>
  <Key>
    <Data>${base64Data}</Data>
  </Key>
</KeyFile>`;

  return {
    content: xml,
    name: fileName.endsWith('.key') ? fileName : `${fileName}.key`,
  };
}

/**
 * Generates a 256-bit Hex Key (64 hex characters)
 */
export function generate256BitHexKey(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a simulated FIDO2 Passkey credential payload
 */
export function generateFido2Passkey(relyingParty: string, username: string): KeyPassData {
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  const credId = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    type: 'passkey',
    name: `${relyingParty} FIDO2 Passkey (${username})`,
    content: JSON.stringify({
      credentialId: credId,
      relyingParty,
      userHandle: username,
      algorithm: 'ES256 (ECDSA P-256 with SHA-256)',
      authenticatorAttachment: 'cross-platform / hardware',
      created: new Date().toISOString(),
    }, null, 2),
    credentialId: `fido2_${credId}`,
    relyingParty,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Download a key file directly to the user's laptop
 */
export function triggerKeyFileDownload(filename: string, content: string, mimeType: string = 'application/octet-stream') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
