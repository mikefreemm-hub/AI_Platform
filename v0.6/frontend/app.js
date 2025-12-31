const sendBtn = document.getElementById("sendBtn");
const responseEl = document.getElementById("response");

sendBtn.addEventListener("click", async () => {
  const trace = document.getElementById("traceToggle").checked;
  const deterministic = document.getElementById("deterministicToggle").checked;
  const explain = document.getElementById("explainToggle").checked;
  const userInput = document.getElementById("userInput").value;

  const payload = {
    trace,
    deterministic,
    explain,
    sessionMutation: userInput || null
  };

  const res = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  responseEl.textContent = JSON.stringify(data, null, 2);
});
