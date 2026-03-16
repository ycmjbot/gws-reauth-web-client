import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function loadEncryptionKey(keyPath) {
  const keyB64 = fs.readFileSync(keyPath, 'utf8').trim();
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) {
    throw new Error(`Invalid encryption key length: expected 32 bytes after base64 decode, got ${key.length}`);
  }
  return key;
}

export function encryptAuthorizedUserJson(refreshToken, config) {
  const plaintext = JSON.stringify({
    type: 'authorized_user',
    client_id: config.GWS_WEB_CLIENT_ID,
    client_secret: config.GWS_WEB_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const key = loadEncryptionKey(config.GWS_ENCRYPTION_KEY_PATH);
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([nonce, encrypted, authTag]);
}

export function writeCredentialsEncrypted(refreshToken, config) {
  const encrypted = encryptAuthorizedUserJson(refreshToken, config);
  const filePath = path.resolve(config.GWS_CREDENTIALS_ENC_PATH);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, encrypted);
  fs.chmodSync(tmpPath, 0o600);
  fs.renameSync(tmpPath, filePath);
  fs.chmodSync(filePath, 0o600);
}

export function clearTokenCacheFiles(config) {
  if (!config.GWS_TOKEN_CACHE_DIR) return [];

  const dir = path.resolve(config.GWS_TOKEN_CACHE_DIR);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }

  const deleted = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/^token_cache.*\.json$/.test(entry.name)) continue;
    const filePath = path.join(dir, entry.name);
    fs.unlinkSync(filePath);
    deleted.push(filePath);
  }
  return deleted;
}
