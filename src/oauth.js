const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export function buildAuthUrl(sessionId, config) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', config.GWS_WEB_CLIENT_ID);
  url.searchParams.set('redirect_uri', config.GWS_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.GWS_SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', sessionId);
  return url.toString();
}

export async function exchangeCodeForTokens(code, config) {
  const body = new URLSearchParams({
    code,
    client_id: config.GWS_WEB_CLIENT_ID,
    client_secret: config.GWS_WEB_CLIENT_SECRET,
    redirect_uri: config.GWS_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!response.ok) {
    const detail = json ? JSON.stringify(json) : text;
    throw new Error(`Google token exchange failed (${response.status}): ${detail}`);
  }

  if (!json || typeof json !== 'object') {
    throw new Error('Google token exchange returned invalid JSON');
  }

  return json;
}
