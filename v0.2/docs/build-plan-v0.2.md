🧱 v0.2 BUILD PLAN — IDENTITY LAYER (LOCKED)

────────────────────────────────────────
v0.2 DEFINITION OF DONE (NON-NEGOTIABLE)
────────────────────────────────────────
v0.2 is complete when ALL of the following are true:

• A stable, anonymous session_id is generated per client
• The session_id persists across page reloads
• The session_id is sent with every /chat request
• Model behavior is unchanged from v0.1
• UI behavior is unchanged from v0.1
• No server-side persistence exists
• v0.1 remains untouched and fully functional
• Removing identity does not break core functionality

Nothing else is allowed.

────────────────────────────────────────
1️⃣ VERSIONING RULE
────────────────────────────────────────
v0.1 is frozen permanently.

v0.2 MUST exist as a sibling directory.
No files from v0.1 may be modified, imported, or reused.

Root path:
C:\Users\mikef\AI_Platform

────────────────────────────────────────
2️⃣ PROJECT STRUCTURE (FIXED)
────────────────────────────────────────
v0.2/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
└── docs/
    └── build-plan-v0.2.md

No additional files or folders are permitted.

────────────────────────────────────────
3️⃣ IDENTITY SCOPE (STRICT)
────────────────────────────────────────
Identity in v0.2 means ONLY:

• A stable anonymous session identifier

Identity does NOT mean:
• Accounts
• Login
• Authentication
• Authorization
• Roles
• Permissions
• Memory
• Personalization
• Analytics

────────────────────────────────────────
4️⃣ FRONTEND REQUIREMENTS
────────────────────────────────────────
On page load:
• Check localStorage for "session_id"
• If missing, generate UUID v4
• Store session_id in localStorage

On message send:
• Include session_id in request body
• UI must not display or react to identity

UI rules:
• Chat clears on refresh
• No visual changes from v0.1
• No identity indicators

────────────────────────────────────────
5️⃣ BACKEND REQUIREMENTS
────────────────────────────────────────
• Accept session_id in request body
• Validate that session_id exists and is a string
• Do NOTHING else with session_id

Explicitly forbidden:
• Storing session_id
• Logging session_id
• Using session_id in prompts
• Branching logic based on identity

Backend behavior must be identical to v0.1.

────────────────────────────────────────
6️⃣ MODEL INTERACTION (UNCHANGED)
────────────────────────────────────────
• Same model
• Same system prompt
• Same request structure
• No identity injected into prompts
• No memory
• No history

────────────────────────────────────────
7️⃣ FAILURE CONDITIONS (AUTO-FAIL)
────────────────────────────────────────
v0.2 is invalid if ANY occur:

• Model behavior changes
• UI behavior changes
• Identity is persisted server-side
• Identity affects logic
• Additional endpoints exist
• v0.1 is modified

────────────────────────────────────────
8️⃣ OPERATOR VERIFICATION CHECKLIST
────────────────────────────────────────
Before freezing v0.2:

☐ Refresh page → chat clears
☐ Refresh page → session_id persists
☐ Requests include session_id
☐ Removing session_id does not break system
☐ v0.1 still runs unchanged

────────────────────────────────────────
FINAL RULE
────────────────────────────────────────
v0.2 must feel boring.

If it feels exciting, it is wrong.
