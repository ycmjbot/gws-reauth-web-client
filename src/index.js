import { validateConfig } from './config.js';
import { initState, cleanupExpiredAndStaleState } from './state.js';
import { createApp } from './app.js';

const config = validateConfig();
initState(config);

const app = createApp(config);

const cleanupTimer = setInterval(() => {
  try {
    cleanupExpiredAndStaleState();
  } catch (error) {
    console.error('session cleanup failed', error);
  }
}, 60 * 1000);

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`gws-reauth listening on :${config.PORT}`);
});

function shutdown(signal) {
  console.log(`received ${signal}; shutting down gracefully`);
  clearInterval(cleanupTimer);
  server.close((error) => {
    if (error) {
      console.error('server shutdown failed', error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
