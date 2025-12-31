const API = "http://localhost:3001";

const elChat = document.getElementById("chat");
const elPrompt = document.getElementById("prompt");
const elSend = document.getElementById("sendBtn");

const elStatus = document.getElementById("statusText");

const elEntityList = document.getElementById("entityList");
const elNewEntity = document.getElementById("newEntityBtn");
const elEntityName = document.getElementById("entityName");
const elEntitySystem = document.getElementById("entitySystem");
const elSaveEntity = document.getElementById("saveEntityBtn");
const elDeleteEntity = document.getElementById("deleteEntityBtn");
const elActiveEntityPill = document.getElementById("activeEntityPill");

const elDrawer = document.getElementById("traceDrawer");
const elToggleTrace = document.getElementById("toggleTraceBtn");
const elCloseTrace = document.getElementById("closeTraceBtn");
const elRefreshRuns = document.getElementById("refreshRunsBtn");
const elRunList = document.getElementById("runList");
const elTraceMeta = document.getElementById("traceMeta");
const elTraceView = document.getElementById("traceView");

// ---------- local “entity registry” (v0.7 = browser-only; v0.8 can persist on backend) ----------
const STORAGE_KEY = "aiplatform_v07_entities";

function loadEntities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveEntities(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let entities = loadEntities();
let activeEntityId = entities[0]?.id ?? null;

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function setStatus(text) {
  elStatus.textContent = text;
}

function renderEntities() {
  elEntityList.innerHTML = "";
  if (!entities.length) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="itemLeft"><div class="itemTitle">(no entities)</div><div class="itemSub">Create one to begin.</div></div>`;
    div.style.cursor = "default";
    elEntityList.appendChild(div);
  }

  for (const e of entities) {
    const div = document.createElement("div");
    div.className = "item" + (e.id === activeEntityId ? " itemActive" : "");
    div.innerHTML = `
      <div class="itemLeft">
        <div class="itemTitle">${escapeHtml(e.name || "Untitled")}</div>
        <div class="itemSub">${escapeHtml((e.system || "").slice(0, 46))}${(e.system || "").length > 46 ? "…" : ""}</div>
      </div>
      <div class="itemSub">${e.id.slice(0, 6)}</div>
    `;
    div.onclick = () => {
      activeEntityId = e.id;
      hydrateEntityEditor();
      renderEntities();
      renderActivePill();
    };
    elEntityList.appendChild(div);
  }
}

function getActiveEntity() {
  return entities.find(e => e.id === activeEntityId) || null;
}

function hydrateEntityEditor() {
  const e = getActiveEntity();
  elEntityName.value = e?.name || "";
  elEntitySystem.value = e?.system || "";
}

function renderActivePill() {
  const e = getActiveEntity();
  elActiveEntityPill.textContent = "Entity: " + (e?.name || "(none)");
}

// ---------- chat rendering ----------
function addMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + (role === "user" ? "msgUser" : "msgAI");
  wrap.innerHTML = `
    <div class="msgRole">${role === "user" ? "You" : "AI Entity"}</div>
    <div class="msgText">${escapeHtml(text)}</div>
  `;
  elChat.appendChild(wrap);
  elChat.scrollTop = elChat.scrollHeight;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// autosize textarea
function autosize() {
  elPrompt.style.height = "auto";
  elPrompt.style.height = Math.min(elPrompt.scrollHeight, 160) + "px";
}
elPrompt.addEventListener("input", autosize);

// Enter to send
elPrompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

// ---------- trace drawer ----------
function openDrawer() { elDrawer.classList.add("drawerOpen"); }
function closeDrawer() { elDrawer.classList.remove("drawerOpen"); }

elToggleTrace.onclick = async () => {
  if (elDrawer.classList.contains("drawerOpen")) closeDrawer();
  else {
    openDrawer();
    await loadRuns(true);
  }
};
elCloseTrace.onclick = () => closeDrawer();
elRefreshRuns.onclick = async () => loadRuns(false);

async function loadRuns(autoPickLatest) {
  const runs = await fetch(API + "/traces").then(r => r.json());
  elRunList.innerHTML = "";

  if (!runs.length) {
    const div = document.createElement("div");
    div.className = "item";
    div.style.cursor = "default";
    div.innerHTML = `<div class="itemLeft"><div class="itemTitle">(no runs yet)</div><div class="itemSub">Send a message to generate a trace.</div></div>`;
    elRunList.appendChild(div);
    elTraceMeta.textContent = "None loaded";
    elTraceView.innerHTML = `<div class="empty muted">Pick a run to inspect steps.</div>`;
    return;
  }

  for (const id of runs) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="itemLeft">
        <div class="itemTitle">${id}</div>
        <div class="itemSub">Click to inspect</div>
      </div>
    `;
    div.onclick = () => loadTrace(id);
    elRunList.appendChild(div);
  }

  if (autoPickLatest) {
    await loadTrace(runs[0]);
  }
}

async function loadTrace(id) {
  const trace = await fetch(API + "/traces/" + id).then(r => r.json());
  elTraceMeta.textContent = `v0.7 · ${trace.started_at} · steps=${trace.steps?.length ?? 0}`;

  const blocks = [];
  for (const s of (trace.steps || [])) {
    const t = (s.type || "").toLowerCase();
    const typeClass =
      t === "decision" ? "typeDecision" :
      t === "reflection" ? "typeReflection" :
      t === "output" ? "typeOutput" : "";

    blocks.push(`
      <div class="traceBlock">
        <div class="traceType ${typeClass}">${escapeHtml((s.type || "step").toUpperCase())}</div>
        <pre class="tracePre">${escapeHtml(JSON.stringify(s, null, 2))}</pre>
      </div>
    `);
  }

  blocks.push(`
    <div class="traceBlock">
      <div class="traceType typeOutput">FINAL_OUTPUT</div>
      <pre class="tracePre">${escapeHtml(String(trace.final_output ?? ""))}</pre>
    </div>
  `);

  elTraceView.innerHTML = blocks.join("");
}

// ---------- actions ----------
elNewEntity.onclick = () => {
  const id = uuid();
  const e = { id, name: "New Entity", system: "You are a helpful digital entity. Stay trace-backed." };
  entities = [e, ...entities];
  activeEntityId = id;
  saveEntities(entities);
  renderEntities();
  hydrateEntityEditor();
  renderActivePill();
};

elSaveEntity.onclick = () => {
  const e = getActiveEntity();
  if (!e) return;

  e.name = elEntityName.value.trim() || "Untitled";
  e.system = elEntitySystem.value || "";
  saveEntities(entities);
  renderEntities();
  renderActivePill();
  setStatus("Entity saved");
  setTimeout(() => setStatus("Ready"), 700);
};

elDeleteEntity.onclick = () => {
  const e = getActiveEntity();
  if (!e) return;

  entities = entities.filter(x => x.id !== e.id);
  activeEntityId = entities[0]?.id ?? null;
  saveEntities(entities);
  renderEntities();
  hydrateEntityEditor();
  renderActivePill();
};

// ---------- send ----------
async function onSend() {
  const prompt = elPrompt.value.trim();
  if (!prompt) return;

  const ent = getActiveEntity();
  if (!ent) {
    addMessage("assistant", "Create/select an entity first (left panel).");
    return;
  }

  addMessage("user", prompt);
  elPrompt.value = "";
  autosize();

  setStatus("Running…");
  elSend.disabled = true;

  try {
    const body = {
      prompt,
      entity: {
        id: ent.id,
        name: ent.name,
        system: ent.system
      }
    };

    const res = await fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(r => r.json());

    const reply = res.output || "(no output)";
    addMessage("assistant", reply);

    // Update drawer list and auto-load trace
    openDrawer();
    await loadRuns(true);

    setStatus("Ready");
  } catch (err) {
    addMessage("assistant", "Error: " + (err?.message || String(err)));
    setStatus("Error");
  } finally {
    elSend.disabled = false;
  }
}

elSend.onclick = onSend;

// ---------- boot ----------
if (!entities.length) {
  entities = [{
    id: uuid(),
    name: "Builder",
    system: "You build digital entities and systems. Always be trace-backed and structured."
  }];
  activeEntityId = entities[0].id;
  saveEntities(entities);
}

renderEntities();
hydrateEntityEditor();
renderActivePill();

addMessage("assistant",
`Welcome to v0.7.

This UI is a ChatGPT-like surface + an Entity Studio.
Every response is trace-backed (LAW: no output without trace).

Create an entity on the left, then message it here.`);

