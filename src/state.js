import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

let DATA_DIR;
let TOKENS_PATH;
let SESSIONS_PATH;

const SESSION_STALE_MS = 30 * 60 * 1000;

export function initState(config) {
  DATA_DIR = path.resolve(config.DATA_DIR);
  TOKENS_PATH = path.join(DATA_DIR, 'tokens.json');
  SESSIONS_PATH = path.join(DATA_DIR, 'sessions.json');
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function nowMs() {
  return Date.now();
}

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJsonAtomic(filePath, value) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getState() {
  const tokens = loadJson(TOKENS_PATH, {});
  const sessions = loadJson(SESSIONS_PATH, { active: null, history: [] });
  if (!sessions.history || !Array.isArray(sessions.history)) sessions.history = [];
  return { tokens, sessions };
}

export function setState(tokens, sessions) {
  saveJsonAtomic(TOKENS_PATH, tokens);
  saveJsonAtomic(SESSIONS_PATH, sessions);
}

export function mintToken(ttlMs) {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const createdAt = nowMs();
  const expiresAt = createdAt + ttlMs;
  return { raw, tokenHash, createdAt, expiresAt };
}

export function getTokenRecordByPublicId(tokens, publicId) {
  const tokenHash = hashToken(publicId);
  return { tokenHash, record: tokens[tokenHash] || null };
}

export function findActiveSessionByTokenHash(sessions, tokenHash) {
  if (sessions.active?.tokenHash === tokenHash) return sessions.active;
  return null;
}

export function isTerminalStatus(status) {
  return status === 'success' || status === 'error';
}

export function makeSession({ id, tokenHash }) {
  const startedAt = nowMs();
  return {
    id,
    tokenHash,
    startedAt,
    updatedAt: startedAt,
    status: 'starting',
    authUrl: null,
    finishedAt: null,
    result: null,
    error: null,
    notifiedAt: null,
  };
}

export function updateActiveSession(mutator) {
  const { tokens, sessions } = getState();
  if (!sessions.active) return null;
  mutator(sessions.active, { tokens, sessions });
  sessions.active.updatedAt = nowMs();
  setState(tokens, sessions);
  return sessions.active;
}

export function finishActiveSession(sessions, status, details = {}) {
  const active = sessions.active;
  if (!active) return null;

  active.status = status;
  active.finishedAt = nowMs();
  active.updatedAt = active.finishedAt;
  active.result = details.result ?? active.result ?? null;
  active.error = details.error ?? active.error ?? null;
  active.authUrl = details.authUrl ?? active.authUrl ?? null;
  if (details.extra && typeof details.extra === 'object') {
    Object.assign(active, details.extra);
  }

  delete active.authUrl;
  sessions.history.push(active);
  if (sessions.history.length > 100) {
    sessions.history = sessions.history.slice(-100);
  }
  sessions.active = null;
  return active;
}

export async function finalizeActiveSession(status, details = {}) {
  const { tokens, sessions } = getState();
  const active = finishActiveSession(sessions, status, details);
  if (!active) return null;
  setState(tokens, sessions);
  return active;
}

export function revokeUnusedTokens(tokens, reason = 'superseded') {
  let revoked = 0;
  for (const [tokenHash, record] of Object.entries(tokens)) {
    if (!record || record.usedAt) continue;
    delete tokens[tokenHash];
    revoked += 1;
  }
  return { revoked, reason };
}

export function cleanupExpiredAndStaleState() {
  const { tokens, sessions } = getState();
  let changed = false;
  const cutoff = nowMs();

  for (const [tokenHash, record] of Object.entries(tokens)) {
    if (!record) continue;
    if (record.expiresAt <= cutoff && (!sessions.active || sessions.active.tokenHash !== tokenHash)) {
      delete tokens[tokenHash];
      changed = true;
    }
  }

  if (sessions.active && !isTerminalStatus(sessions.active.status)) {
    const age = cutoff - (sessions.active.updatedAt || sessions.active.startedAt || cutoff);
    if (age > SESSION_STALE_MS) {
      sessions.active.status = 'error';
      sessions.active.error = 'Session expired after being stuck for more than 30 minutes';
      sessions.active.result = 'Timed out waiting for completion';
      sessions.active.finishedAt = cutoff;
      sessions.active.updatedAt = cutoff;
      delete sessions.active.authUrl;
      sessions.history.push(sessions.active);
      sessions.active = null;
      changed = true;
    }
  }

  if (sessions.history.length > 100) {
    sessions.history = sessions.history.slice(-100);
    changed = true;
  }

  if (changed) {
    setState(tokens, sessions);
  }
}

export function getBaseUrl(req) {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  return `${proto}://${host}`;
}

export function nowTimestamp() {
  return nowMs();
}
