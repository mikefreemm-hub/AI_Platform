const BACKEND_URL = 'http://localhost:3001/chat';

const chatWindow = document.getElementById('chatWindow');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const backendUrlEl = document.getElementById('backendUrl');
const sessionIdEl = document.getElementById('sessionId');

backendUrlEl.textContent = BACKEND_URL;

function newSessionId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'sess-' + Math.random().toString(16).slice(2) + '-' + Date.now();
}

let sessionId = newSessionId();
sessionIdEl.textContent = sessionId;

function append(role, text) {
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = '<span class="role">' + role + ':</span> ' + escapeHtml(text);
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  append('User', msg);
  messageInput.value = '';
  sendBtn.disabled = true;

  try {
    const resp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, session_id: sessionId })
    });

    const data = await resp.json();

    if (!resp.ok) {
      append('Error', data && data.error ? data.error : ('HTTP ' + resp.status));
      return;
    }

    append('Assistant', data.reply || '');

    // If DEBUG=true, show a small dev-only notice (not the prompt)
    if (data.debug && data.debug.approx_token_count) {
      append('Dev', 'debug enabled (approx tokens: ' + data.debug.approx_token_count + ')');
    }
  } catch (e) {
    append('Error', e.message || String(e));
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

newSessionBtn.addEventListener('click', () => {
  sessionId = newSessionId();
  sessionIdEl.textContent = sessionId;
  chatWindow.innerHTML = '';
  messageInput.focus();
});
