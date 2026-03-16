const DEFAULT_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
].join(' ');

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateConfig() {
  const config = {
    GWS_WEB_CLIENT_ID: requiredEnv('GWS_WEB_CLIENT_ID'),
    GWS_WEB_CLIENT_SECRET: requiredEnv('GWS_WEB_CLIENT_SECRET'),
    GWS_REDIRECT_URI: requiredEnv('GWS_REDIRECT_URI'),
    GWS_ENCRYPTION_KEY_PATH: requiredEnv('GWS_ENCRYPTION_KEY_PATH'),
    GWS_CREDENTIALS_ENC_PATH: requiredEnv('GWS_CREDENTIALS_ENC_PATH'),
    MINT_BEARER: requiredEnv('MINT_BEARER'),
    GWS_TOKEN_CACHE_DIR: process.env.GWS_TOKEN_CACHE_DIR?.trim() || '',
    GWS_SCOPES: process.env.GWS_SCOPES?.trim() || DEFAULT_SCOPES,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim() || '',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID?.trim() || '',
    PORT: Number(process.env.PORT || 3000),
    DATA_DIR: process.env.DATA_DIR?.trim() || './data',
    LINK_TTL_DAYS: Number(process.env.LINK_TTL_DAYS || 7),
  };

  if (!Number.isFinite(config.PORT) || config.PORT <= 0) {
    throw new Error('PORT must be a positive number');
  }
  if (!Number.isFinite(config.LINK_TTL_DAYS) || config.LINK_TTL_DAYS <= 0) {
    throw new Error('LINK_TTL_DAYS must be a positive number');
  }

  return config;
}
