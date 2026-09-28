export type VaultCategory = 'login' | 'card' | 'identity_doc' | 'secure_note' | 'api_key' | 'custom';

export type ServiceDomainCategory =
  | 'developer'
  | 'finance'
  | 'productivity'
  | 'social'
  | 'entertainment'
  | 'shopping'
  | 'identity'
  | 'general';

export type DocumentType =
  | 'passport'
  | 'id_card'
  | 'drivers_license'
  | 'residence_permit'
  | 'insurance'
  | 'custom_document';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'date' | 'masked' | 'number';
}

export type CustomDocumentField = CustomField;

export interface IdentityDocumentData {
  documentType: DocumentType;
  customTypeName?: string; // e.g. "Tax Residency Certificate", "National Insurance Card"
  fullName: string;
  documentNumber: string;
  issuingCountry?: string;
  issuingStateOrAuthority?: string;
  dateOfBirth?: string;
  issueDate?: string;
  expiryDate?: string;
  nationality?: string;
  gender?: string;
  address?: string;
  attachmentDataUrl?: string; // Encrypted document scan / photo preview
  attachmentName?: string;
  customFields: CustomDocumentField[];
}

export interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  note?: string;
}

export const MAX_BACKUP_CODES_PER_ITEM = 20;

export interface LinkedAppInfo {
  appName: string; // e.g. "Discord Desktop", "Slack", "Steam", "Spotify"
  appIdentifier?: string; // Process name or bundle id e.g. "discord.exe", "com.tinyspeck.slackmacgap"
  customProtocolUri?: string; // URI scheme e.g. "discord://", "slack://", "spotify://"
  platform?: 'desktop' | 'mobile' | 'universal' | 'cli';
  launchSupported?: boolean;
}

export interface KeyPassData {
  type: 'keyfile' | 'passkey' | 'raw_key';
  name: string; // e.g. "primary-vault.key" or "GitHub FIDO2 Passkey"
  content: string; // Hex key, Base64 data, XML KeePass keyfile, or credential payload
  credentialId?: string;
  relyingParty?: string;
  createdAt: string;
}

export interface VaultItem {
  id: string;
  title: string;
  category: VaultCategory;
  customCategoryName?: string; // e.g. "Crypto Wallet", "Server / SSH", "Software License", "Bank Account"
  serviceCategory?: ServiceDomainCategory; // Auto-detected from app/website
  username: string;
  password: string;
  websiteUrl: string;
  
  // Linked desktop / mobile application
  linkedApp?: LinkedAppInfo;
  
  // 2FA Authenticator fields
  totpSecret?: string; // Base32 encoded secret key
  totpDigits?: 6 | 8;
  totpPeriod?: number; // Standard 30 seconds
  totpAlgorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  
  // Backup codes list (up to 20 backup codes per item)
  backupCodes: BackupCode[];
  
  // KeyPass / KeyFile / Passkey Storage
  keyPass?: KeyPassData;
  
  // Personal Identity & Custom Documents
  identityDoc?: IdentityDocumentData;
  
  // Custom option fields (available across ANY item / category!)
  customFields?: CustomField[];
  
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastFilledAt?: string;
  autoCategorized?: boolean;
}

export interface AutoCategoryResult {
  category: VaultCategory;
  serviceCategory: ServiceDomainCategory;
  categoryLabel: string;
  suggestedTags: string[];
  brandName?: string;
  confidence: number;
}

export interface AutofillEvent {
  id: string;
  timestamp: string;
  itemId: string;
  itemTitle: string;
  type: 'credentials' | 'totp' | 'backup_code';
  codeUsed?: string;
  targetDomain: string;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  entropy: number; // in bits
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
}
