import crypto from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from '../middleware.js';
import {
  getState,
  setState,
  getTokenRecordByPublicId,
  findActiveSessionByTokenHash,
  makeSession,
  cleanupExpiredAndStaleState,
  nowTimestamp,
} from '../state.js';
import { buildAuthUrl } from '../oauth.js';
import { renderStartPage, renderResumePage } from '../views.js';

export default function startRoutes(config) {
  const router = Router();

  router.get('/s/:token', rateLimit('startLink'), (req, res) => {
    cleanupExpiredAndStaleState();

    const publicId = req.params.token;
    const { tokens, sessions } = getState();
    const { tokenHash, record } = getTokenRecordByPublicId(tokens, publicId);

    if (!record) return res.status(404).send('Invalid link');
    if (record.expiresAt <= nowTimestamp()) return res.status(410).send('Link expired');

    if (record.usedAt) {
      const active = findActiveSessionByTokenHash(sessions, tokenHash);
      if (active) {
        return res.type('html').send(renderResumePage(active.id));
      }
      return res.status(410).send('Link already used');
    }

    const hasActive = !!sessions.active;
    res.type('html').send(renderStartPage(publicId, hasActive));
  });

  router.post('/s/:token/start', rateLimit('startAction'), (req, res) => {
    cleanupExpiredAndStaleState();

    const publicId = req.params.token;
    const { tokens, sessions } = getState();
    const { tokenHash, record } = getTokenRecordByPublicId(tokens, publicId);

    if (!record) return res.status(404).send('Invalid link');
    if (record.expiresAt <= nowTimestamp()) return res.status(410).send('Link expired');
    if (record.usedAt) return res.status(410).send('Link already used');
    if (sessions.active) return res.status(409).send('A reauth session is already active; finish it first.');

    const sessionId = crypto.randomUUID();
    const authUrl = buildAuthUrl(sessionId, config);

    record.usedAt = nowTimestamp();
    record.startedAt = nowTimestamp();
    sessions.active = makeSession({ id: sessionId, tokenHash });
    sessions.active.status = 'waiting';
    sessions.active.authUrl = authUrl;
    sessions.active.updatedAt = nowTimestamp();
    setState(tokens, sessions);

    return res.redirect(authUrl);
  });

  return router;
}
