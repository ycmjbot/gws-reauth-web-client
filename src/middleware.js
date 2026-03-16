import crypto from 'node:crypto';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const defaultLimiter = new RateLimiterMemory({ points: 60, duration: 60 });

const limiters = {
  startLink: new RateLimiterMemory({ points: 30, duration: 60 }),
  sessionPoll: new RateLimiterMemory({ points: 120, duration: 60 }),
  mint: new RateLimiterMemory({ points: 10, duration: 60 }),
  startAction: new RateLimiterMemory({ points: 10, duration: 60 }),
};

export function rateLimit(group) {
  const limiter = (group && limiters[group]) || defaultLimiter;
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch {
      res.status(429).send('Too many requests');
    }
  };
}

export function authInternal(req, config) {
  const auth = req.get('authorization') || '';
  const prefix = 'Bearer ';
  if (!auth.startsWith(prefix)) return false;
  const provided = auth.slice(prefix.length);
  const expected = config.MINT_BEARER;
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(provided, 'utf8'),
    Buffer.from(expected, 'utf8'),
  );
}
