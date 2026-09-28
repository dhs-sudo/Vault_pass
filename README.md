# CipherKey — Self-Hosting Guide for Laptop

CipherKey is designed from the ground up for **local self-hosting** and **zero-knowledge privacy**.

All cryptography (PBKDF2 key derivation, AES-GCM encryption, and RFC 6238 TOTP computation) runs entirely in your browser using the native **Web Crypto API**. Your master passwords, 2FA secret keys, and backup recovery codes never leave your device.

---

## Quick Start Options

### Option 1: Run with Node.js / NPM (Fastest)

Prerequisites: [Node.js](https://nodejs.org/) (v18 or higher) installed on your laptop.

```bash
# 1. Clone or copy the project files to your laptop
git clone <your-repo-or-download>
cd cipherkey

# 2. Install dependencies
npm install

# 3. Start the local server
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

### Option 2: Run with Docker & Docker Compose

If you have Docker Desktop or OrbStack on your laptop:

```bash
# Start the container in background
docker compose up -d
```

To stop:
```bash
docker compose down
```

Accessible at `http://localhost:3000`.

---

### Option 3: Air-Gapped / Static Offline Build

Because CipherKey requires no backend database, you can build a static bundle and open it locally or serve it completely offline without an internet connection:

```bash
# 1. Build the production bundle
npm run build

# 2. Serve the static dist folder with any local HTTP server
npx serve dist -l 3000
# or with Python:
cd dist && python3 -m http.server 3000
```

---

## Data Storage & Backups

- **Local Storage**: Your vault items are encrypted and stored in your browser's local sandbox storage (`localStorage`).
- **Offline Backup**: Click **"Export / Import Vault"** in the sidebar at any time to export a full JSON backup file to your laptop's hard drive or USB key.
- **Master Password**: The default demo master password is `master123` (or leave empty). You can customize it in the settings.
