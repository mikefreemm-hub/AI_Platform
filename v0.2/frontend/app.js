function generateUUID() {
  return crypto.randomUUID();
}

let sessionId = localStorage.getItem("session_id");

if (!sessionId) {
  sessionId = generateUUID();
  localStorage.setItem("session_id", sessionId);
}

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");

send.onclick = async () => {
  const message = input.value;
  if (!message) return;

  chat.innerHTML += `<div>You: ${message}</div>`;
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
  chat.innerHTML += `<div>Assistant: ${data.reply}</div>`;
};
