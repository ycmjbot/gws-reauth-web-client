import { Router } from 'express';
import { rateLimit, authInternal } from '../middleware.js';
import {
  getState,
  setState,
  mintToken,
  getBaseUrl,
  cleanupExpiredAndStaleState,
  finishActiveSession,
  revokeUnusedTokens,
} from '../state.js';

export default function mintRoutes(config) {
  const router = Router();

  router.post('/api/internal/mint', rateLimit('mint'), (req, res) => {
    if (!authInternal(req, config)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    cleanupExpiredAndStaleState();

    const { tokens, sessions } = getState();
    const baseUrl = getBaseUrl(req);

    // Minting from the trusted local API means the operator wants a clean new
    // attempt. Do not let an abandoned browser tab, Telegram preview, or old
    // unused link block the next reauth. This is deliberately stricter than the
    // public start route: old public links cannot cancel active sessions, but the
    // internal broker can reset the flow atomically.
    const replacedActiveSession = !!sessions.active;
    if (sessions.active) {
      finishActiveSession(sessions, 'error', {
        result: 'Superseded by a freshly minted reauth link',
        error: 'Superseded by a freshly minted reauth link',
      });
    }
    const { revoked: revokedUnusedLinks } = revokeUnusedTokens(tokens);

    const ttlMs = config.LINK_TTL_DAYS * 24 * 60 * 60 * 1000;
    const { raw, tokenHash, createdAt, expiresAt } = mintToken(ttlMs);
    tokens[tokenHash] = {
      publicId: raw,
      createdAt,
      expiresAt,
      usedAt: null,
      startedAt: null,
    };
    setState(tokens, sessions);

    return res.json({
      ok: true,
      startUrl: `${baseUrl}/s/${raw}`,
      reused: false,
      replacedActiveSession,
      revokedUnusedLinks,
      expiresAt,
    });
  });

  return router;
}
