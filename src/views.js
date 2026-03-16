const baseCss = `
:root {
  --bg: oklch(96.5% 0.008 60);
  --surface: oklch(99% 0.003 60);
  --text: oklch(18% 0.015 50);
  --muted: oklch(50% 0.02 50);
  --accent: oklch(48% 0.17 38);
  --accent-hover: oklch(40% 0.15 38);
  --accent-subtle: oklch(94% 0.04 38);
  --success: oklch(48% 0.14 155);
  --success-bg: oklch(95% 0.03 155);
  --error: oklch(45% 0.18 25);
  --error-bg: oklch(95% 0.03 25);
  --border: oklch(88% 0.01 60);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: var(--accent); }
.page {
  max-width: 440px;
  margin: 0 auto;
  padding: 56px 24px 80px;
}
.wm {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 56px;
  user-select: none;
}
.wm-dot { color: var(--accent); margin: 0 1px; }
h1 {
  font-size: clamp(24px, 6vw, 32px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 12px;
}
.lead {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.55;
  max-width: 36ch;
}
.rule {
  width: 40px;
  height: 3px;
  background: var(--accent);
  border: none;
  border-radius: 2px;
  margin: 36px 0;
}
.flow {
  display: flex;
  align-items: center;
  gap: 0;
}
.flow-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
}
.flow-line {
  flex: 1;
  height: 2px;
  background: var(--border);
}
.flow-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.flow-meta span {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
  letter-spacing: 0.01em;
}
.btn-primary {
  display: block;
  width: 100%;
  padding: 16px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
  text-align: center;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  min-height: 52px;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.btn-link {
  display: inline-block;
  padding: 12px 20px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
}
.btn-link:hover { border-color: var(--muted); }
.btn-link:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.hint {
  font-size: 13px;
  color: var(--muted);
  margin-top: 12px;
  line-height: 1.5;
}
.blocked {
  font-size: 14px;
  color: var(--muted);
  background: var(--accent-subtle);
  padding: 14px 16px;
  border-radius: 12px;
  margin-top: 16px;
  line-height: 1.5;
}
.progress {
  display: flex;
  align-items: center;
  margin: 32px 0 8px;
}
.prog-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
  transition: background 0.5s ease, box-shadow 0.5s ease;
}
.prog-dot.active {
  background: var(--accent);
  box-shadow: 0 0 0 4px oklch(48% 0.17 38 / 0.15);
}
.prog-dot.done {
  background: var(--success);
  box-shadow: none;
}
.prog-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  transition: background 0.5s ease;
}
.prog-line.done { background: var(--success); }
.prog-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}
.prog-labels span {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
  transition: color 0.3s ease;
}
.prog-labels span.active { color: var(--accent); font-weight: 600; }
.prog-labels span.done { color: var(--success); }
#status-msg {
  font-size: 15px;
  color: var(--muted);
  min-height: 24px;
  transition: opacity 0.3s ease;
}
#action-area {
  margin-top: 24px;
  transition: opacity 0.3s ease;
}
.result-card {
  padding: 20px;
  border-radius: 14px;
  margin-top: 24px;
}
.result-card.ok {
  background: var(--success-bg);
  color: var(--success);
}
.result-card.fail {
  background: var(--error-bg);
  color: var(--error);
}
.result-card .rc-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}
.result-card .rc-detail {
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.5;
  word-break: break-word;
}
@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.breathing { animation: breathe 2s ease-in-out infinite; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.4s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .breathing { animation: none; }
  .fade-up { animation: none; }
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
`;

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderPage(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>${baseCss}</style></head><body><div class="page">
  <div class="wm">gws<span class="wm-dot">\u00b7</span>reauth</div>
  ${inner}
  </div></body></html>`;
}

export function renderHome() {
  return renderPage('gws-reauth', `
    <h1>Ready when you need it</h1>
    <p class="lead">Single-use links to refresh your Google Workspace CLI credentials.</p>
    <hr class="rule"/>
    <div class="flow">
      <div class="flow-dot"></div>
      <div class="flow-line"></div>
      <div class="flow-dot"></div>
      <div class="flow-line"></div>
      <div class="flow-dot"></div>
    </div>
    <div class="flow-meta">
      <span>Open link</span>
      <span>Authorize</span>
      <span>Done</span>
    </div>
  `);
}

export function renderStartPage(publicId, hasActive) {
  return renderPage('Start reauth', `
    <h1>Re-authenticate</h1>
    <p class="lead">This link is single-use. Nothing happens until you tap the button.</p>
    <div style="margin-top:32px">
      <form method="POST" action="/s/${escapeHtml(encodeURIComponent(publicId))}/start">
        <button class="btn-primary" type="submit" ${hasActive ? 'disabled' : ''}>Start reauth now</button>
      </form>
      ${hasActive ? '<div class="blocked">Another session is already active. Finish or wait for it to expire before starting a new one.</div>' : ''}
      <p class="hint">Telegram link previews won\u2019t trigger this flow.</p>
    </div>
  `);
}

export function renderResumePage(sessionId) {
  return renderPage('Resume reauth', `
    <h1>Session in progress</h1>
    <p class="lead">This link was already used, but the session is still active.</p>
    <div style="margin-top:28px">
      <a class="btn-primary" href="/session/${escapeHtml(encodeURIComponent(sessionId))}" style="display:flex;align-items:center;justify-content:center">Resume session</a>
    </div>
  `);
}

export function renderSessionPage(sessionId) {
  return renderPage('Reauth session', `
    <h1>Reauth session</h1>

    <div class="progress">
      <div class="prog-dot active" id="d1"></div>
      <div class="prog-line" id="l1"></div>
      <div class="prog-dot" id="d2"></div>
      <div class="prog-line" id="l2"></div>
      <div class="prog-dot" id="d3"></div>
    </div>
    <div class="prog-labels">
      <span class="active" id="lb1">Started</span>
      <span id="lb2">Google</span>
      <span id="lb3">Done</span>
    </div>

    <div id="status-msg" class="breathing">Connecting\u2026</div>
    <div id="action-area"></div>

    <script>
      const sid = ${JSON.stringify(sessionId)};
      let prev = '';

      function setProgress(step) {
        const d1 = document.getElementById('d1');
        const d2 = document.getElementById('d2');
        const d3 = document.getElementById('d3');
        const l1 = document.getElementById('l1');
        const l2 = document.getElementById('l2');
        const lb1 = document.getElementById('lb1');
        const lb2 = document.getElementById('lb2');
        const lb3 = document.getElementById('lb3');

        d1.className = 'prog-dot done';
        lb1.className = 'done';
        if (step >= 2) { l1.className = 'prog-line done'; d2.className = 'prog-dot' + (step === 2 ? ' active' : ' done'); lb2.className = step === 2 ? 'active' : 'done'; }
        if (step >= 3) { l2.className = 'prog-line done'; d3.className = 'prog-dot done'; lb3.className = 'done'; }
      }

      async function tick() {
        try {
          const r = await fetch('/api/session/' + encodeURIComponent(sid));
          const d = await r.json();
          const msg = document.getElementById('status-msg');
          const act = document.getElementById('action-area');

          if (!d.ok) {
            msg.textContent = 'Session not found.';
            msg.classList.remove('breathing');
            return;
          }

          if (d.status === prev) {
            if (d.status !== 'success' && d.status !== 'error') setTimeout(tick, 1200);
            return;
          }
          prev = d.status;

          if (d.status === 'waiting' && d.authUrl) {
            setProgress(2);
            msg.textContent = 'Waiting for Google authorization.';
            msg.classList.add('breathing');
            act.textContent = '';
            var link = document.createElement('a');
            link.className = 'btn-primary fade-up';
            link.setAttribute('href', d.authUrl);
            link.setAttribute('rel', 'noreferrer');
            link.style.marginTop = '8px';
            link.textContent = 'Continue with Google';
            var hint = document.createElement('p');
            hint.className = 'hint';
            hint.textContent = 'Complete consent in Google. You\\u2019ll be redirected back automatically.';
            act.appendChild(link);
            act.appendChild(hint);
          } else if (d.status === 'starting') {
            setProgress(2);
            msg.textContent = 'Exchanging credentials\u2026';
            msg.classList.add('breathing');
            act.textContent = '';
          } else if (d.status === 'success') {
            setProgress(3);
            msg.classList.remove('breathing');
            msg.textContent = '';
            act.textContent = '';
            var card = document.createElement('div');
            card.className = 'result-card ok fade-up';
            var title = document.createElement('div');
            title.className = 'rc-title';
            title.textContent = 'Access restored';
            var detail = document.createElement('div');
            detail.className = 'rc-detail';
            detail.textContent = 'Credentials updated. You can close this page.';
            card.appendChild(title);
            card.appendChild(detail);
            act.appendChild(card);
          } else if (d.status === 'error') {
            setProgress(3);
            msg.classList.remove('breathing');
            msg.textContent = '';
            act.textContent = '';
            var card = document.createElement('div');
            card.className = 'result-card fail fade-up';
            var title = document.createElement('div');
            title.className = 'rc-title';
            title.textContent = 'Something went wrong';
            var detail = document.createElement('div');
            detail.className = 'rc-detail';
            detail.textContent = d.error || d.result || 'Unknown error';
            card.appendChild(title);
            card.appendChild(detail);
            act.appendChild(card);
          }

          if (d.status !== 'success' && d.status !== 'error') setTimeout(tick, 1200);
        } catch (e) {
          document.getElementById('status-msg').textContent = 'Connection error. Retrying\u2026';
          setTimeout(tick, 3000);
        }
      }

      tick();
    </script>
  `);
}

export function renderErrorPage(title, message) {
  return renderPage(title, `
    <h1>${escapeHtml(title)}</h1>
    <p class="lead">${escapeHtml(message)}</p>
  `);
}

export function renderInvalidSessionPage() {
  return renderPage('Invalid session', `
    <h1>Session not found</h1>
    <p class="lead">The OAuth callback didn\u2019t match an active session. The link may have expired.</p>
  `);
}
