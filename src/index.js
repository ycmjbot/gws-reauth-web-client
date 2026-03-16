import { validateConfig } from './config.js';
import { initState, cleanupExpiredAndStaleState } from './state.js';
import { createApp } from './app.js';

const config = validateConfig();
initState(config);

const app = createApp(config);

setInterval(() => {
  try {
    cleanupExpiredAndStaleState();
  } catch (error) {
    console.error('session cleanup failed', error);
  }
}, 60 * 1000);

app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`gws-reauth listening on :${config.PORT}`);
});
