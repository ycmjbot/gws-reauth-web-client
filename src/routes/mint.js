import { Router } from 'express';
import { rateLimit, authInternal } from '../middleware.js';
import {
  getState,
  setState,
  mintToken,
  getBaseUrl,
  cleanupExpiredAndStaleState,
  nowTimestamp,
} from '../state.js';

export default function mintRoutes(config) {
  const router = Router();

  router.post('/api/internal/mint', rateLimit('mint'), (req, res) => {
    if (!authInternal(req, config)) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    cleanupExpiredAndStaleState();

    const { tokens, sessions } = getState();
    const existing = Object.entries(tokens)
      .map(([tokenHash, record]) => ({ tokenHash, record }))
      .filter(({ record }) => !record.usedAt && record.expiresAt > nowTimestamp())
      .sort((a, b) => b.record.createdAt - a.record.createdAt)[0];

    const baseUrl = getBaseUrl(req);

    if (existing) {
      return res.json({
        ok: true,
        startUrl: `${baseUrl}/s/${existing.record.publicId}`,
        reused: true,
        expiresAt: existing.record.expiresAt,
      });
    }

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
      expiresAt,
    });
  });

  return router;
}
