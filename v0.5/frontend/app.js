function generateUUID() {
  return crypto.randomUUID();
}

function ensureSessionId() {
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

const BACKEND_URL = "http://localhost:3001";

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const newSessionBtn = document.getElementById("newSession");
const sessionLabel = document.getElementById("sessionLabel");
const traceToggle = document.getElementById("traceToggle");

let sessionId = ensureSessionId();

function setSessionLabel() {
  sessionLabel.textContent = `session_id: ${sessionId}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendMessage(role, content, trace) {
  const safe = escapeHtml(content);

  let traceHtml = "";
  if (trace && typeof trace === "object") {
    const traceJson = escapeHtml(JSON.stringify(trace, null, 2));
    traceHtml = `
      <details class="traceBlock">
        <summary>trace</summary>
        <pre>${traceJson}</pre>
      </details>
    `;
  }

  chat.innerHTML += `
    <div class="msg">
      <span class="role">${escapeHtml(role)}:</span>
      <span class="content">${safe}</span>
      ${traceHtml}
    </div>
  `;
  chat.scrollTop = chat.scrollHeight;
}

function clearChat() {
  chat.innerHTML = "";
}

async function loadHistory() {
  try {
    const res = await fetch(
      `${BACKEND_URL}/history?session_id=${encodeURIComponent(sessionId)}`
    );
    if (!res.ok) return;

    const data = await res.json();
    clearChat();

    const history = Array.isArray(data.history) ? data.history : [];
    for (const m of history) {
      if (m && typeof m.role === "string" && typeof m.content === "string") {
        appendMessage(m.role === "assistant" ? "Assistant" : "User", m.content);
      }
    }
  } catch (_) {
    // backend may not be running yet
  }
}

send.onclick = async () => {
  const message = input.value.trim();
  if (!message) return;

  appendMessage("User", message);
  input.value = "";

  const wantsTrace = traceToggle && traceToggle.checked === true;

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        session_id: sessionId,
        trace: wantsTrace
      })
    });

    const data = await response.json();

    if (!response.ok) {
      appendMessage("Assistant", `Error: ${data?.error ?? "Unknown error"}`, data?.trace);
      return;
    }

    appendMessage("Assistant", data.reply ?? "", data?.trace);
  } catch (err) {
    appendMessage("Assistant", "Error: backend not reachable");
  }
};

newSessionBtn.onclick = async () => {
  sessionId = generateUUID();
  localStorage.setItem("session_id", sessionId);
  setSessionLabel();
  clearChat();
  await loadHistory();
};

setSessionLabel();
loadHistory();
