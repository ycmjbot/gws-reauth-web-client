import { Router } from 'express';
import {
  getState,
  updateActiveSession,
  finalizeActiveSession,
  cleanupExpiredAndStaleState,
} from '../state.js';
import { exchangeCodeForTokens } from '../oauth.js';
import { writeCredentialsEncrypted, clearTokenCacheFiles } from '../crypto.js';
import { telegramSend } from '../notify.js';
import { renderInvalidSessionPage } from '../views.js';

export default function callbackRoutes(config) {
  const router = Router();

  router.get('/oauth2/callback', async (req, res) => {
    cleanupExpiredAndStaleState();

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    const { tokens, sessions } = getState();
    const active = sessions.active;

    if (!state || !active || active.id !== state) {
      return res.status(400).type('html').send(renderInvalidSessionPage());
    }

    if (oauthError) {
      const errorMessage = `Google returned an OAuth error: ${oauthError}`;
      await finalizeActiveSession('error', { error: errorMessage, result: errorMessage });
      await telegramSend(`❌ gws reauth failed\n${errorMessage}`, config);
      return res.redirect(`/session/${encodeURIComponent(state)}`);
    }

    if (!code) {
      const errorMessage = 'Google callback did not include an authorization code';
      await finalizeActiveSession('error', { error: errorMessage, result: errorMessage });
      await telegramSend(`❌ gws reauth failed\n${errorMessage}`, config);
      return res.redirect(`/session/${encodeURIComponent(state)}`);
    }

    try {
      updateActiveSession((session) => {
        session.status = 'starting';
        session.result = 'Exchanging authorization code with Google';
      });

      const tokenResponse = await exchangeCodeForTokens(code, config);
      const refreshToken = tokenResponse.refresh_token;
      if (!refreshToken) {
        throw new Error('Google token response did not include a refresh_token. Ensure prompt=consent and access_type=offline are honored.');
      }

      writeCredentialsEncrypted(refreshToken, config);
      const deletedCacheFiles = clearTokenCacheFiles(config);

      const successMessage = `Credentials updated successfully${deletedCacheFiles.length ? `; cleared ${deletedCacheFiles.length} token cache file(s)` : ''}`;
      await finalizeActiveSession('success', {
        result: successMessage,
        error: null,
        extra: {
          cacheFilesCleared: deletedCacheFiles.length,
        },
      });
      await telegramSend(`✅ gws reauth succeeded\n${successMessage}`, config);
      return res.redirect(`/session/${encodeURIComponent(state)}`);
    } catch (error) {
      const errorMessage = String(error?.message || error);
      await finalizeActiveSession('error', { error: errorMessage, result: errorMessage });
      await telegramSend(`❌ gws reauth failed\n${errorMessage}`, config);
      return res.redirect(`/session/${encodeURIComponent(state)}`);
    }
  });

  return router;
}
