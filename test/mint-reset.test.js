import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { getState, initState } from '../src/state.js';

function makeConfig(dataDir) {
  return {
    GWS_WEB_CLIENT_ID: 'test-client-id',
    GWS_WEB_CLIENT_SECRET: 'test-client-secret',
    GWS_REDIRECT_URI: 'https://example.test/oauth2/callback',
    GWS_ENCRYPTION_KEY_PATH: '/unused/test/key',
    GWS_CREDENTIALS_ENC_PATH: '/unused/test/credentials.enc',
    MINT_BEARER: 'test-mint-bearer',
    GWS_TOKEN_CACHE_DIR: '',
    GWS_SCOPES: 'https://www.googleapis.com/auth/drive',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
    PORT: 0,
    DATA_DIR: dataDir,
    LINK_TTL_DAYS: 1,
  };
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function withServer(fn) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gws-reauth-test-'));
  const config = makeConfig(dataDir);
  initState(config);
  const server = await listen(createApp(config));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function mint() {
    const response = await fetch(`${baseUrl}/api/internal/mint`, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.MINT_BEARER}` },
    });
    assert.equal(response.status, 200);
    return response.json();
  }

  try {
    await fn({ baseUrl, mint });
  } finally {
    await close(server);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

function localPathFromStartUrl(startUrl) {
  return new URL(startUrl).pathname;
}

async function startOAuthAttempt(baseUrl, startUrl) {
  const startResponse = await fetch(`${baseUrl}${localPathFromStartUrl(startUrl)}/start`, {
    method: 'POST',
    redirect: 'manual',
  });

  assert.equal(startResponse.status, 302);
  assert.match(startResponse.headers.get('location'), /^https:\/\/accounts\.google\.com\//);
  return getState().sessions.active;
}

test('internal mint creates a fresh link instead of reusing an old unused link', async () => {
  await withServer(async ({ mint }) => {
    const first = await mint();
    const second = await mint();

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(first.reused, false);
    assert.equal(second.reused, false);
    assert.notEqual(first.startUrl, second.startUrl);
    assert.equal(second.revokedUnusedLinks, 1);
  });
});

test('session API exposes authUrl while waiting so the resume page can continue OAuth', async () => {
  await withServer(async ({ baseUrl, mint }) => {
    const fresh = await mint();
    const active = await startOAuthAttempt(baseUrl, fresh.startUrl);

    assert.equal(active.status, 'waiting');

    const sessionResponse = await fetch(`${baseUrl}/api/session/${active.id}`);
    const body = await sessionResponse.json();

    assert.equal(body.ok, true);
    assert.equal(body.status, 'waiting');
    assert.equal(body.authUrl, active.authUrl);
    assert.match(body.authUrl, /^https:\/\/accounts\.google\.com\//);
  });
});

test('internal mint supersedes a stuck active session and unblocks the new start page', async () => {
  await withServer(async ({ baseUrl, mint }) => {
    const first = await mint();
    const oldSession = await startOAuthAttempt(baseUrl, first.startUrl);

    const fresh = await mint();
    assert.equal(fresh.ok, true);
    assert.equal(fresh.replacedActiveSession, true);

    const afterMint = getState();
    assert.equal(afterMint.sessions.active, null);
    assert.equal(afterMint.sessions.history.at(-1).id, oldSession.id);
    assert.equal(afterMint.sessions.history.at(-1).status, 'error');
    assert.match(afterMint.sessions.history.at(-1).error, /Superseded/);

    const pageResponse = await fetch(`${baseUrl}${localPathFromStartUrl(fresh.startUrl)}`);
    const page = await pageResponse.text();
    assert.equal(pageResponse.status, 200);
    assert.doesNotMatch(page, /Another session is already active/);
  });
});
