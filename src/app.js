import express from 'express';
import healthRoutes from './routes/health.js';
import homeRoutes from './routes/home.js';
import mintRoutes from './routes/mint.js';
import startRoutes from './routes/start.js';
import callbackRoutes from './routes/callback.js';
import sessionRoutes from './routes/session.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self'",
    );
    next();
  });
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(healthRoutes());
  app.use(homeRoutes());
  app.use(mintRoutes(config));
  app.use(startRoutes(config));
  app.use(callbackRoutes(config));
  app.use(sessionRoutes());

  return app;
}
