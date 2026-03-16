import { Router } from 'express';

export default function healthRoutes() {
  const router = Router();

  router.get('/healthz', (req, res) => {
    res.json({ ok: true });
  });

  return router;
}
