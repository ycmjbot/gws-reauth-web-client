# gws-reauth-web-client

**One-tap OAuth reauth for [gws](https://github.com/googleworkspace/cli) on headless servers.**

If you run `gws` on a VPS, you know the pain: tokens expire every 7 days (in "Testing" mode), and re-authenticating requires a browser on the machine — which doesn't exist. The workaround is SSH tunnels, copy-pasting tokens, or begging someone to help.

This app fixes that. It's a lightweight web service that lets you re-authenticate from any device — phone, laptop, whatever — with a single tap on a link. Tokens are written back to gws's encrypted credential store automatically.

```
                          ┌──────────────┐
 cron detects             │  gws-reauth  │
 invalid_grant ──────────►│  web app     │──── mints single-use link
                          └──────┬───────┘
                                 │
                    sends link   │
                    via Telegram │
                                 ▼
                          ┌──────────────┐
                          │  You (phone) │
                          │  click link  │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │   Google     │
                          │   consent   │
                          └──────┬───────┘
                                 │
                     callback to │
                     /oauth2/callback
                                 ▼
                          ┌──────────────┐
                          │  gws-reauth  │
                          │  exchanges   │──── writes to credentials.enc
                          │  auth code   │     (AES-256-GCM encrypted)
                          └──────────────┘
```

**👇 Setup guide below** — written for AI agents helping humans get this running.

---

## Setup Guide (for AI agents helping humans)

> **Who is this for?** If you're an AI agent (Claude, ChatGPT, Copilot, etc.) managing gws on a headless server and your human asked you to set up reauth — this section is your runbook. Follow each step in order. Icons tell you who does what:
>
> - 🤖 **Agent can do this autonomously** (run commands, edit files, verify state)
> - 👤 **Human action required** (browser interactions, Google Cloud Console, clicking links)

---

### Step 1: Prerequisites check 🤖

Verify the following on the server before proceeding:

```bash
# gws is installed and has been used at least once
gws --version
ls ~/.config/gws/.encryption_key ~/.config/gws/credentials.enc

# Node.js 18+
node --version

# Docker (if deploying with Docker)
docker --version
```

**What to ask the human:**

> I need a few things to set up gws-reauth:
>
> 1. **A domain** pointed at this server with TLS — e.g. `gws-reauth.example.com`. Do you have one ready, or should I help you set one up?
> 2. **A reverse proxy** (nginx, Caddy, Traefik, etc.) terminating TLS and forwarding to a local port. Is one already running?
>
> The domain must support HTTPS — Google requires it for Web OAuth redirect URIs.

Wait for the human to confirm they have a domain and reverse proxy ready before continuing.

---

### Step 2: Create a Web OAuth client 👤

> **Important context for the agent:** This is a *separate* OAuth client from the Desktop client that gws already uses. The Desktop client uses `http://localhost` redirects; this Web client uses the public domain. Both are needed — gws keeps the Desktop client for initial setup, and this reauth broker replaces only the *stored credentials* when refreshing tokens. gws reads credentials generically (it just needs a valid `refresh_token`, `client_id`, and `client_secret`), so the Web client's credentials work transparently.

**Give your human these exact instructions:**

> I need you to create a Web OAuth client in Google Cloud Console. Here's how:
>
> 1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
> 2. Make sure you're in the same project that gws uses
> 3. Click **Create Credentials → OAuth client ID**
> 4. Application type: **Web application**
> 5. Name: `gws-reauth` (or whatever you like)
> 6. Under **Authorized redirect URIs**, add exactly:
>    ```
>    https://YOUR-DOMAIN/oauth2/callback
>    ```
>    (Replace `YOUR-DOMAIN` with your actual domain)
> 7. Click **Create**
> 8. Copy the **Client ID** and **Client Secret** and send them to me
>
> ⚠️ Make sure you choose "Web application", NOT "Desktop app".

**What you need back:** The Client ID (ends in `.apps.googleusercontent.com`) and the Client Secret (starts with `GOCSPX-`).

---

### Step 3: Generate secrets and configure 🤖

Once you have the Client ID and Client Secret from the human:

**3a. Generate a MINT_BEARER token:**

```bash
openssl rand -hex 32
```

Save this value — it's the bearer token for the internal mint API.

**3b. Clone the repo (if not already):**

```bash
git clone https://github.com/ycmjbot/gws-reauth-web-client.git
cd gws-reauth-web-client
```

**3c. Create the `.env` file:**

```bash
cat > .env << 'EOF'
GWS_WEB_CLIENT_ID=<client-id-from-human>
GWS_WEB_CLIENT_SECRET=<client-secret-from-human>
GWS_REDIRECT_URI=https://<domain>/oauth2/callback
GWS_ENCRYPTION_KEY_PATH=/home/<user>/.config/gws/.encryption_key
GWS_CREDENTIALS_ENC_PATH=/home/<user>/.config/gws/credentials.enc
GWS_TOKEN_CACHE_DIR=/home/<user>/.config/gws
MINT_BEARER=<generated-token>
EOF
```

Fill in all the `<placeholders>` with actual values. The `GWS_ENCRYPTION_KEY_PATH` and `GWS_CREDENTIALS_ENC_PATH` should point to the existing gws config directory (usually `~/.config/gws/`).

**Optional env vars you may want to set:**

- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — for success/failure notifications after reauth
- `PORT` — listening port (default: `3000`)
- `LINK_TTL_DAYS` — how long mint links stay valid (default: `7` days)

See the [Configuration reference](#configuration) for the full list.

---

### Step 4: Deploy 🤖

Choose one of these deployment methods:

#### Option A: Docker (recommended)

```bash
docker build -f Containerfile -t gws-reauth .

docker run -d \
  --name gws-reauth \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -e GWS_ENCRYPTION_KEY_PATH=/gws-config/.encryption_key \
  -e GWS_CREDENTIALS_ENC_PATH=/gws-config/credentials.enc \
  -e GWS_TOKEN_CACHE_DIR=/gws-config \
  -e DATA_DIR=/data \
  -v ~/.config/gws:/gws-config \
  -v ./data:/data \
  gws-reauth
```

> **Note:** When running in Docker, the env-file paths for `GWS_ENCRYPTION_KEY_PATH`, `GWS_CREDENTIALS_ENC_PATH`, and `GWS_TOKEN_CACHE_DIR` must use the *container* paths (e.g. `/gws-config/...`), not the host paths. The `-e` flags above override what's in `.env`.

> **File permissions:** The container process needs read/write access to the gws config directory. If running as a non-root user, ensure correct ownership on the mounted volume.

#### Option B: Docker Compose

```yaml
# docker-compose.yml
services:
  gws-reauth:
    build:
      context: .
      dockerfile: Containerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - GWS_ENCRYPTION_KEY_PATH=/gws-config/.encryption_key
      - GWS_CREDENTIALS_ENC_PATH=/gws-config/credentials.enc
      - GWS_TOKEN_CACHE_DIR=/gws-config
      - DATA_DIR=/data
    volumes:
      - ~/.config/gws:/gws-config
      - ./data:/data
```

```bash
docker compose up -d
```

#### Option C: Manual (no Docker)

```bash
npm install
npm start
```

Make sure your reverse proxy forwards to the app's port (default `3000`).

> **⚠️ Reverse proxy required:** This app trusts `X-Forwarded-*` headers for protocol and host detection. It **must** run behind a trusted reverse proxy that sets these headers. Do not expose directly to the internet.

**Verify deployment:**

```bash
curl http://localhost:3000/healthz
# Should return 200 OK
```

**Tell your human:**

> The reauth service is deployed at `https://<domain>/`. I've verified the health check is passing.

---

### Step 5: Test the reauth flow 👤

**5a. Mint a test link** 🤖

```bash
curl -s -X POST http://localhost:3000/api/internal/mint \
  -H "Authorization: Bearer $MINT_BEARER" \
  -H "Content-Type: application/json" | jq .
```

You should get a response like:

```json
{
  "ok": true,
  "startUrl": "https://<domain>/s/abc123...",
  "reused": false,
  "expiresAt": 1774305774190
}
```

**5b. Send the link to your human:**

> I've set up the reauth service. Let's test it! Please:
>
> 1. Open this link: `<startUrl from response>`
> 2. Press the **"Start reauth"** button on the page
> 3. Complete the Google consent screen (sign in and authorize)
> 4. You should see a success page when it's done
>
> Let me know once you've completed it!

> **Why the extra button?** Opening the link does NOT start the OAuth flow — the user must press "Start reauth". This prevents Telegram/Slack link previews from accidentally triggering it.

**5c. Verify credentials were written** 🤖

After the human confirms they completed the flow:

```bash
# Check that credentials.enc was recently updated
ls -la ~/.config/gws/credentials.enc

# Try a gws command to verify tokens work
gws auth status --json 2>/dev/null | jq '.token_valid'
# Should return: true
```

**Tell your human:**

> ✅ Reauth test successful! Your gws credentials have been refreshed.

---

### Step 6: Set up automated monitoring 🤖

Create a cron script that detects expired tokens and sends a reauth link automatically.

**6a. Create the check script:**

```bash
cat > /path/to/check-gws-reauth.sh << 'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

REAUTH_URL="http://localhost:3000"
MINT_BEARER="<your-mint-bearer-token>"

# -- Notification config --
# Example: Telegram (replace with your preferred method)
TELEGRAM_BOT_TOKEN="<your-telegram-bot-token>"
TELEGRAM_CHAT_ID="<your-chat-id>"

# Check token validity
status=$(gws auth status --json 2>/dev/null || echo '{}')
token_valid=$(echo "$status" | jq -r '.token_valid // false')

if [ "$token_valid" = "true" ]; then
  echo "Tokens are valid, nothing to do."
  exit 0
fi

echo "Tokens expired or invalid. Minting reauth link..."

response=$(curl -sf -X POST "${REAUTH_URL}/api/internal/mint" \
  -H "Authorization: Bearer ${MINT_BEARER}" \
  -H "Content-Type: application/json")

start_url=$(echo "$response" | jq -r '.startUrl')

if [ -z "$start_url" ] || [ "$start_url" = "null" ]; then
  echo "Failed to mint link"
  exit 1
fi

echo "Reauth link: $start_url"

# Send notification (Telegram example — swap for Slack, email, ntfy, etc.)
curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
    \"text\": \"🔑 gws tokens expired — tap to reauth:\\n${start_url}\",
    \"disable_web_page_preview\": true
  }"

echo "Notification sent."
SCRIPT

chmod +x /path/to/check-gws-reauth.sh
```

**6b. Add to crontab:**

```bash
# Check gws token validity every 3 hours
(crontab -l 2>/dev/null; echo "0 */3 * * * /path/to/check-gws-reauth.sh >> /var/log/gws-reauth-check.log 2>&1") | crontab -
```

---

### Step 7: Verify everything works 🤖

Final checklist:

```bash
# 1. Health check passes
curl -s http://localhost:3000/healthz

# 2. Mint endpoint works
curl -s -X POST http://localhost:3000/api/internal/mint \
  -H "Authorization: Bearer $MINT_BEARER" \
  -H "Content-Type: application/json" | jq .ok
# → true

# 3. gws tokens are currently valid
gws auth status --json 2>/dev/null | jq '.token_valid'
# → true

# 4. Cron is scheduled
crontab -l | grep gws-reauth
```

**Tell your human:**

> Everything is set up! Here's what will happen from now on:
>
> - Every 3 hours, a cron job checks if your gws tokens are still valid
> - If they've expired, you'll get a notification with a one-tap reauth link
> - Tap the link, press "Start reauth", complete Google consent — done
>
> No more SSH tunnels or copy-pasting tokens. 🎉

---

## Reference

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GWS_WEB_CLIENT_ID` | Yes | Web OAuth client ID from Google Cloud Console |
| `GWS_WEB_CLIENT_SECRET` | Yes | Web OAuth client secret |
| `GWS_REDIRECT_URI` | Yes | Full redirect URI (e.g. `https://gws-reauth.example.com/oauth2/callback`) |
| `GWS_ENCRYPTION_KEY_PATH` | Yes | Path to gws's `.encryption_key` file |
| `GWS_CREDENTIALS_ENC_PATH` | Yes | Path to gws's `credentials.enc` file |
| `MINT_BEARER` | Yes | Bearer token for the `/api/internal/mint` endpoint |
| `GWS_TOKEN_CACHE_DIR` | No | Directory containing gws token cache files (cleared on successful reauth) |
| `GWS_SCOPES` | No | Space-separated OAuth scopes (defaults to gmail, drive, calendar, tasks) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token for success/failure notifications |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID for notifications |
| `PORT` | No | Listening port (default: `3000`) |
| `DATA_DIR` | No | Directory for persistent state (default: `./data`) |
| `LINK_TTL_DAYS` | No | Single-use link TTL in days (default: `7`) |

### API Endpoints

#### Public

| Endpoint | Description |
|----------|-------------|
| `GET /` | Landing page |
| `GET /healthz` | Health check |
| `GET /s/:token` | Start link page (safe to open; does not consume token) |
| `POST /s/:token/start` | Consumes token and redirects to Google consent |
| `GET /oauth2/callback` | Google OAuth callback (exchanges code, saves tokens) |
| `GET /session/:id` | Reauth session progress page |
| `GET /api/session/:id` | Session state JSON (for polling) |

#### Internal (requires `Authorization: Bearer $MINT_BEARER`)

| Endpoint | Description |
|----------|-------------|
| `POST /api/internal/mint` | Mint a new single-use start link (or return existing unused one) |

### Security Considerations

- **Single-use, time-limited links** — start links are bearer tokens with a configurable TTL. Each can only trigger one reauth session.
- **Explicit user action** — opening a link does NOT start the flow. Users must press "Start reauth", preventing link preview bots from triggering it.
- **Bearer-protected minting** — the `/api/internal/mint` endpoint requires a secret bearer token.
- **Encrypted at rest** — credentials are stored using the same AES-256-GCM encryption as gws (`credentials.enc` + `.encryption_key`). No plaintext tokens are stored or logged.
- **Rate limiting** — sensitive endpoints have rate limits.
- **Security headers** — CSP, X-Frame-Options, Referrer-Policy, and X-Content-Type-Options are set on all responses.

#### Recommended: Add HTTP basic auth at your reverse proxy

For an extra layer of security, add HTTP basic auth at the reverse proxy level. This prevents unauthorized users from even reaching the app's UI.

Since the `/api/internal/mint` endpoint and basic auth both use the `Authorization` header, they conflict. The fix: call the mint endpoint via `localhost` (bypassing the reverse proxy), and let basic auth protect only the browser-facing routes.

```bash
# In your cron script / agent calls, use localhost:
REAUTH_URL="http://localhost:3000"
```

This way:
- **Browser routes** (`/s/:token`, `/session/:id`, etc.) → protected by basic auth
- **Internal API** (`/api/internal/mint`) → called via localhost, bypasses proxy

### Key Design Decisions

- **Direct OAuth flow** — no CLI binary spawning. The app handles the entire OAuth2 dance (auth URL generation, code exchange, token storage) using Google's token endpoint directly.
- **Writes to gws's encrypted credential store** — uses the same AES-256-GCM encryption that gws uses natively. No format conversion needed.
- **Web application client** — unlike gws's Desktop client flow, this uses a Web OAuth client so Google can redirect to your public URL.

## License

[MIT](LICENSE)
