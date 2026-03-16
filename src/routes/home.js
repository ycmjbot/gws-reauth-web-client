import { Router } from 'express';
import { renderHome } from '../views.js';

export default function homeRoutes() {
  const router = Router();

  router.get('/', (req, res) => {
    res.type('html').send(renderHome());
  });

  return router;
}
