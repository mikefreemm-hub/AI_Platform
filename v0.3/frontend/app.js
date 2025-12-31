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

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const newSessionBtn = document.getElementById("newSession");
const sessionLabel = document.getElementById("sessionLabel");

let sessionId = ensureSessionId();

function setSessionLabel() {
  sessionLabel.textContent = `session_id: ${sessionId}`;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendMessage(role, content) {
  const safe = escapeHtml(content);
  chat.innerHTML += `
    <div class="msg">
      <span class="role">${role}:</span>
      <span class="content">${safe}</span>
    </div>
  `;
  chat.scrollTop = chat.scrollHeight;
}

function clearChat() {
  chat.innerHTML = "";
}

async function loadHistory() {
  try {
    const res = await fetch(`http://localhost:3000/history?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok) return;

    clearChat();

    const history = Array.isArray(data.history) ? data.history : [];
    for (const m of history) {
      if (m && typeof m.role === "string" && typeof m.content === "string") {
        appendMessage(m.role === "assistant" ? "Assistant" : "User", m.content);
      }
    }
  } catch (_) {
    // If backend isn't running yet, do nothing.
  }
}

send.onclick = async () => {
  const message = input.value.trim();
  if (!message) return;

  appendMessage("User", message);
  input.value = "";

  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message,
      session_id: sessionId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    appendMessage("Assistant", `Error: ${data?.error ?? "Unknown error"}`);
    return;
  }

  appendMessage("Assistant", data.reply ?? "");
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
