import { Router } from 'express';
import { rateLimit } from '../middleware.js';
import { getState, cleanupExpiredAndStaleState } from '../state.js';
import { renderSessionPage } from '../views.js';

export default function sessionRoutes() {
  const router = Router();

  router.get('/api/session/:id', rateLimit('sessionPoll'), (req, res) => {
    cleanupExpiredAndStaleState();

    const sessionId = req.params.id;
    const { sessions } = getState();
    const active = sessions.active?.id === sessionId ? sessions.active : null;
    const historical = sessions.history.findLast?.((session) => session.id === sessionId)
      ?? [...sessions.history].reverse().find((session) => session.id === sessionId)
      ?? null;
    const session = active || historical;

    if (!session) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }

    const { id, status, result, error, startedAt, finishedAt } = session;
    return res.json({ ok: true, id, status, result, error, startedAt, finishedAt });
  });

  router.get('/session/:id', (req, res) => {
    const sessionId = req.params.id;
    res.type('html').send(renderSessionPage(sessionId));
  });

  return router;
}
