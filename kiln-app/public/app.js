const API_BASE = ''; // same origin

const state = {
  mode: 'chat',
  history: [],
  loading: false,
  token: localStorage.getItem('kiln_token') || null,
  user: null,
  authIsRegister: false,
};

const modeMeta = {
  chat: { title: "General", sub: "— ask for anything" },
  code: { title: "Code", sub: "— write, run, debug" },
  business: { title: "Business", sub: "— plan, position, pitch" },
};

const quickActionsByMode = {
  chat: [],
  code: [
    "Review this code for bugs and suggest fixes",
    "Explain what this code does, step by step",
    "Write a function that ...",
  ],
  business: [
    "Draft a one-page business plan for my idea",
    "Run a competitor analysis for my market",
    "Write a pricing strategy with 3 tiers",
    "Outline a pitch deck (10 slides)",
    "List the riskiest assumptions in my idea",
  ],
};

const el = {
  authScreen: document.getElementById('auth-screen'),
  authModeSub: document.getElementById('auth-mode-sub'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authSubmit: document.getElementById('auth-submit'),
  authError: document.getElementById('auth-error'),
  authSwitch: document.getElementById('auth-switch'),
  forgotLink: document.getElementById('forgot-link'),
  forgotScreen: document.getElementById('forgot-screen'),
  forgotEmail: document.getElementById('forgot-email'),
  forgotSubmit: document.getElementById('forgot-submit'),
  forgotError: document.getElementById('forgot-error'),
  forgotBack: document.getElementById('forgot-back'),
  resetScreen: document.getElementById('reset-screen'),
  resetPassword: document.getElementById('reset-password'),
  resetSubmit: document.getElementById('reset-submit'),
  resetError: document.getElementById('reset-error'),
  app: document.getElementById('app'),
  transcript: document.getElementById('transcript'),
  emptyState: document.getElementById('empty-state'),
  input: document.getElementById('input'),
  sendBtn: document.getElementById('send-btn'),
  modeTitle: document.getElementById('mode-title'),
  coord: document.getElementById('coord'),
  codePane: document.getElementById('code-pane'),
  codeInput: document.getElementById('code-input'),
  runBtn: document.getElementById('run-code-btn'),
  runOutput: document.getElementById('run-output'),
  quickActions: document.getElementById('quick-actions'),
  clearBtn: document.getElementById('clear-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  creditCount: document.getElementById('credit-count'),
  buyBtn: document.getElementById('buy-btn'),
  modalOverlay: document.getElementById('modal-overlay'),
  packsList: document.getElementById('packs-list'),
  modalClose: document.getElementById('modal-close'),
  usageBtn: document.getElementById('usage-btn'),
  usageOverlay: document.getElementById('usage-overlay'),
  usageSummary: document.getElementById('usage-summary'),
  usageRows: document.getElementById('usage-rows'),
  usageClose: document.getElementById('usage-close'),
};

/* ---------------- Auth ---------------- */

function showApp(user) {
  state.user = user;
  el.creditCount.textContent = user.credits;
  hideAllAuthScreens();
  el.app.classList.add('visible');
}

function hideAllAuthScreens() {
  el.authScreen.style.display = 'none';
  el.forgotScreen.style.display = 'none';
  el.resetScreen.style.display = 'none';
}

function showAuth() {
  el.app.classList.remove('visible');
  hideAllAuthScreens();
  el.authScreen.style.display = 'flex';
}

function showForgot() {
  el.app.classList.remove('visible');
  hideAllAuthScreens();
  el.forgotScreen.style.display = 'flex';
}

function showReset() {
  el.app.classList.remove('visible');
  hideAllAuthScreens();
  el.resetScreen.style.display = 'flex';
}

el.authSwitch.addEventListener('click', () => {
  state.authIsRegister = !state.authIsRegister;
  el.authSubmit.textContent = state.authIsRegister ? 'CREATE ACCOUNT' : 'LOG IN';
  el.authModeSub.textContent = state.authIsRegister
    ? 'set up an account to start building with Wick'
    : 'log in to keep building with Wick';
  el.authSwitch.textContent = state.authIsRegister ? 'Log in instead' : 'Create an account';
  el.authError.textContent = '';
});

el.authSubmit.addEventListener('click', async () => {
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  el.authError.textContent = '';
  if (!email || !password) {
    el.authError.textContent = 'Enter an email and password.';
    return;
  }
  const endpoint = state.authIsRegister ? '/api/auth/register' : '/api/auth/login';
  el.authSubmit.disabled = true;
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      el.authError.textContent = data.error || 'Something went wrong.';
      return;
    }
    state.token = data.token;
    localStorage.setItem('kiln_token', data.token);
    showApp(data.user);
  } catch (err) {
    el.authError.textContent = 'Could not reach the server.';
  } finally {
    el.authSubmit.disabled = false;
  }
});

el.logoutBtn.addEventListener('click', () => {
  state.token = null;
  localStorage.removeItem('kiln_token');
  state.history = [];
  showAuth();
});

el.forgotLink.addEventListener('click', () => {
  el.forgotError.textContent = '';
  el.forgotEmail.value = el.authEmail.value || '';
  showForgot();
});

el.forgotBack.addEventListener('click', showAuth);

el.forgotSubmit.addEventListener('click', async () => {
  const email = el.forgotEmail.value.trim();
  el.forgotError.textContent = '';
  if (!email) {
    el.forgotError.textContent = 'Enter your email.';
    return;
  }
  el.forgotSubmit.disabled = true;
  try {
    const res = await fetch(API_BASE + '/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    el.forgotError.style.color = 'var(--blue)';
    el.forgotError.textContent = data.message || 'If that account exists, check your email for a reset link.';
  } catch (err) {
    el.forgotError.style.color = 'var(--danger)';
    el.forgotError.textContent = 'Could not reach the server.';
  } finally {
    el.forgotSubmit.disabled = false;
  }
});

let pendingResetToken = null;

el.resetSubmit.addEventListener('click', async () => {
  const password = el.resetPassword.value;
  el.resetError.textContent = '';
  if (!password || password.length < 8) {
    el.resetError.textContent = 'Password must be at least 8 characters.';
    return;
  }
  el.resetSubmit.disabled = true;
  try {
    const res = await fetch(API_BASE + '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pendingResetToken, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      el.resetError.textContent = data.error || 'Could not reset password.';
      return;
    }
    state.token = data.token;
    localStorage.setItem('kiln_token', data.token);
    // Clean the token out of the URL so it can't be reused/shared by accident.
    window.history.replaceState({}, '', window.location.pathname);
    showApp(data.user);
  } catch (err) {
    el.resetError.textContent = 'Could not reach the server.';
  } finally {
    el.resetSubmit.disabled = false;
  }
});

async function tryResumeSession() {
  if (!state.token) return showAuth();
  try {
    const res = await fetch(API_BASE + '/api/auth/me', {
      headers: { Authorization: 'Bearer ' + state.token },
    });
    if (!res.ok) throw new Error('invalid session');
    const data = await res.json();
    showApp(data.user);
  } catch (err) {
    localStorage.removeItem('kiln_token');
    showAuth();
  }
}

/* ---------------- Modes ---------------- */

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  el.modeTitle.innerHTML = modeMeta[mode].title + ' <span>' + modeMeta[mode].sub + '</span>';
  el.codePane.classList.toggle('open', mode === 'code');
  renderQuickActions();
}

function renderQuickActions() {
  const actions = quickActionsByMode[state.mode];
  if (!actions.length) { el.quickActions.innerHTML = ''; return; }
  el.quickActions.innerHTML = '<div class="section-label">Quick actions</div>' +
    actions.map(a => `<button class="quick-chip" data-text="${a.replace(/"/g, '&quot;')}">${a}</button>`).join('');
  el.quickActions.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      el.input.value = btn.dataset.text;
      el.input.focus();
      autoGrow();
    });
  });
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

/* ---------------- Composer ---------------- */

function autoGrow() {
  el.input.style.height = 'auto';
  el.input.style.height = Math.min(el.input.scrollHeight, 140) + 'px';
}
el.input.addEventListener('input', autoGrow);
el.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

el.runBtn.addEventListener('click', () => {
  const code = el.codeInput.value;
  const logs = [];
  const fakeConsole = {
    log: (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => logs.push('ERR: ' + args.map(String).join(' ')),
  };
  try {
    const fn = new Function('console', code);
    fn(fakeConsole);
    el.runOutput.textContent = logs.length ? logs.join('\n') : '(ran with no output)';
    el.runOutput.style.color = 'var(--blue)';
  } catch (err) {
    el.runOutput.textContent = 'Error: ' + err.message;
    el.runOutput.style.color = 'var(--danger)';
  }
});

el.clearBtn.addEventListener('click', () => {
  state.history = [];
  el.transcript.innerHTML = '';
  el.transcript.appendChild(el.emptyState);
  updateCoord();
});

function updateCoord() {
  el.coord.textContent = 'SESSION · ' + String(state.history.length).padStart(2, '0') + ' MSGS';
}

function appendMessage(role, text) {
  if (el.emptyState.parentNode) el.emptyState.remove();
  const msg = document.createElement('div');
  msg.className = 'msg ' + role;
  const avatarLabel = role === 'user' ? 'YOU' : 'W';
  msg.innerHTML = `<div class="avatar">${avatarLabel}</div><div class="bubble"></div>`;
  msg.querySelector('.bubble').textContent = text;
  el.transcript.appendChild(msg);
  el.transcript.scrollTop = el.transcript.scrollHeight;
  return msg;
}

function appendThinking() {
  const msg = document.createElement('div');
  msg.className = 'msg assistant';
  msg.id = 'thinking-msg';
  msg.innerHTML = `<div class="avatar">W</div><div class="bubble thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  el.transcript.appendChild(msg);
  el.transcript.scrollTop = el.transcript.scrollHeight;
}

function removeThinking() {
  const t = document.getElementById('thinking-msg');
  if (t) t.remove();
}

async function sendMessage() {
  const text = el.input.value.trim();
  if (!text || state.loading) return;
  el.input.value = '';
  autoGrow();
  appendMessage('user', text);
  state.history.push({ role: 'user', content: text });
  updateCoord();

  state.loading = true;
  el.sendBtn.disabled = true;
  appendThinking();

  try {
    const res = await fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + state.token,
      },
      body: JSON.stringify({ mode: state.mode, messages: state.history }),
    });
    const data = await res.json();
    removeThinking();

    if (res.status === 402) {
      appendMessage('assistant', "You're out of credits. Hit \"Buy more\" in the sidebar to keep going.");
      state.history.pop(); // don't count the unanswered turn against context
      openBuyModal();
      return;
    }
    if (!res.ok) {
      appendMessage('assistant', 'Something went wrong: ' + (data.error || 'unknown error'));
      state.history.pop();
      return;
    }

    appendMessage('assistant', data.reply);
    state.history.push({ role: 'assistant', content: data.reply });
    el.creditCount.textContent = data.credits;
  } catch (err) {
    removeThinking();
    appendMessage('assistant', 'Could not reach the server: ' + err.message);
    state.history.pop();
  } finally {
    state.loading = false;
    el.sendBtn.disabled = false;
    updateCoord();
  }
}

el.sendBtn.addEventListener('click', sendMessage);

/* ---------------- Billing ---------------- */

async function openBuyModal() {
  el.modalOverlay.classList.add('visible');
  el.packsList.innerHTML = '<div class="modal-sub">Loading packs…</div>';
  try {
    const res = await fetch(API_BASE + '/api/billing/packs');
    const data = await res.json();
    el.packsList.innerHTML = Object.entries(data.packs).map(([id, pack]) => `
      <div class="pack" data-pack="${id}">
        <div class="pack-name">${pack.name}</div>
        <div class="pack-price">$${(pack.amountCents / 100).toFixed(2)}</div>
      </div>
    `).join('');
    el.packsList.querySelectorAll('.pack').forEach(p => {
      p.addEventListener('click', () => buyPack(p.dataset.pack));
    });
  } catch (err) {
    el.packsList.innerHTML = '<div class="modal-sub">Could not load packs.</div>';
  }
}

async function buyPack(packId) {
  try {
    const res = await fetch(API_BASE + '/api/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + state.token,
      },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (err) {
    alert('Could not start checkout.');
  }
}

el.buyBtn.addEventListener('click', openBuyModal);
el.modalClose.addEventListener('click', () => el.modalOverlay.classList.remove('visible'));

/* ---------------- Usage dashboard ---------------- */

async function openUsageModal() {
  el.usageOverlay.classList.add('visible');
  el.usageSummary.textContent = 'Loading…';
  el.usageRows.innerHTML = '';
  try {
    const res = await fetch(API_BASE + '/api/usage/me', {
      headers: { Authorization: 'Bearer ' + state.token },
    });
    const data = await res.json();
    if (!res.ok) {
      el.usageSummary.textContent = data.error || 'Could not load usage.';
      return;
    }
    const { summary, entries } = data;
    const byModeStr = Object.entries(summary.byMode)
      .map(([mode, count]) => `${mode}: ${count}`)
      .join(' · ');
    el.usageSummary.textContent =
      `${summary.totalMessages} messages · ${summary.totalCredits} credits spent` +
      (byModeStr ? ` (${byModeStr})` : '');

    if (!entries.length) {
      el.usageRows.innerHTML = `<tr><td colspan="4" style="padding:14px 4px; color:var(--text-faint);">No messages yet.</td></tr>`;
      return;
    }
    el.usageRows.innerHTML = entries.map(e => {
      const when = new Date(e.timestamp).toLocaleString();
      const preview = (e.preview || '').replace(/</g, '&lt;');
      return `<tr style="border-bottom:1px solid var(--line-soft);">
        <td style="padding:7px 4px; color:var(--text-faint); white-space:nowrap;">${when}</td>
        <td style="padding:7px 4px; color:var(--blue);">${e.mode}</td>
        <td style="padding:7px 4px; color:var(--brass);">${e.credits}</td>
        <td style="padding:7px 4px; color:var(--text-muted);">${preview}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    el.usageSummary.textContent = 'Could not reach the server.';
  }
}

el.usageBtn.addEventListener('click', openUsageModal);
el.usageClose.addEventListener('click', () => el.usageOverlay.classList.remove('visible'));

/* ---------------- Init ---------------- */

setMode('chat');
updateCoord();

const urlParams = new URLSearchParams(window.location.search);
const resetTokenFromUrl = urlParams.get('resetToken');
if (resetTokenFromUrl) {
  pendingResetToken = resetTokenFromUrl;
  showReset();
} else {
  tryResumeSession();
}

// If we just came back from a successful Stripe checkout, refresh the
// credit count so the new balance shows up right away.
if (new URLSearchParams(window.location.search).get('purchase') === 'success' && state.token) {
  fetch(API_BASE + '/api/auth/me', { headers: { Authorization: 'Bearer ' + state.token } })
    .then(r => r.json())
    .then(d => { if (d.user) el.creditCount.textContent = d.user.credits; });
}
