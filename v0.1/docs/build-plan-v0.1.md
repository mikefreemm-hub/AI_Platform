# v0.1 Build Plan
v0.1 BUILD PLAN
Model-Centric Intelligence Platform (Foundation)
________________________________________
v0.1 DEFINITION OF DONE (LOCK THIS IN)
v0.1 is complete when:
•You can open a local web page
•Type text into a chat box
•Click send / press enter
•The message is sent to the LLM
•The response appears in the chat window
•Refreshing the page clears the conversation
Nothing else is allowed in v0.1.
________________________________________
1️⃣ DIRECTORY & PROJECT LAYOUT (PERMANENT)
You will create two folders only — frontend and backend.
C:\AI_Platform\v0.1\
├── frontend\
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
└── backend\
    ├── server.js
    ├── package.json
    └── .env
This structure never changes in future versions.
________________________________________
2️⃣ ENVIRONMENT PREREQUISITES (ONE-TIME CHECK)
You must already have:
•Node.js installed
•PowerShell 7+
No installs will be scripted yet — we assume environment readiness.
________________________________________
3️⃣ PROJECT CREATION (POWERSHELL ONLY)
Create root folders:
New-Item -ItemType Directory -Path "C:\AI_Platform\v0.1\frontend" -Force
New-Item -ItemType Directory -Path "C:\AI_Platform\v0.1\backend" -Force
________________________________________
4️⃣ BACKEND BUILD PLAN (v0.1)
Backend responsibilities (DO NOT ADD MORE):
•Expose ONE endpoint: /chat
•Accept text input
•Call OpenAI API
•Return text output
•No memory
•No tools
•No logging beyond console
CORS REQUIREMENT (MANDATORY):
Because the frontend is opened directly via file://, the backend must fully support CORS for null origins, including OPTIONS preflight requests.
The backend must:
•Accept Origin: null
•Respond to OPTIONS requests
•Allow methods: POST, OPTIONS
•Allow headers: Content-Type
•Return appropriate CORS headers on both OPTIONS and POST responses
Failure to correctly handle OPTIONS preflight is a v0.1 failure condition.
Files to be created (full replacement only):
•C:\AI_Platform\v0.1\backend\package.json
•C:\AI_Platform\v0.1\backend\server.js
•C:\AI_Platform\v0.1\backend\.env
⚠️ .env must never be committed
⚠️ API key never appears in frontend
Backend lifecycle (later execution, not now):
cd "C:\AI_Platform\v0.1\backend"
npm install
node server.js
________________________________________
5️⃣ FRONTEND BUILD PLAN (v0.1)
Frontend responsibilities (DO NOT ADD MORE):
•Display chat messages
•Accept user input
•POST input to backend
•Display response
Files to be created (full replacement only):
•C:\AI_Platform\v0.1\frontend\index.html
•C:\AI_Platform\v0.1\frontend\styles.css
•C:\AI_Platform\v0.1\frontend\app.js
Frontend behavior constraints:
•No frameworks
•No React
•No build step
•Pure HTML / CSS / JS
•Runs by opening index.html
________________________________________
6️⃣ COMMUNICATION CONTRACT (LOCKED)
Request (frontend → backend):
{
  "message": "user input text"
}
Response (backend → frontend):
{
  "reply": "model output text"
}
This contract never breaks in future versions.
________________________________________
7️⃣ SYSTEM PROMPT (v0.1 — MINIMAL)
You will use one static system prompt:
“You are a helpful assistant.”
No persona.
No role switching.
No behavior tuning yet.
________________________________________
8️⃣ VERSION CONTROL RULES (CRITICAL)
For v0.1:
•Every change is a full file replacement
•No inline edits
•No “add this line”
•If a file changes → rewrite entire file
This makes debugging and rollback trivial.
________________________________________
9️⃣ WHAT IS EXPLICITLY OUT OF SCOPE (DO NOT ADD)
🚫 Memory
🚫 Search
🚫 Weather
🚫 Tools
🚫 Agents
🚫 Accounts
🚫 Authentication
🚫 Styling polish
🚫 Streaming
🚫 Multimodal
If it’s not listed in v0.1 goals — it does not exist.
________________________________________
🔟 EXECUTION ORDER (NO DEVIATION)
When you’re ready to actually build:
1.Generate backend files (full content)
2.Install backend dependencies
3.Run backend server
4.Generate frontend files (full content)
5.Open index.html
6.Test prompt → response loop
7.Freeze v0.1
________________________________________
1️⃣1️⃣ WHY THIS PLAN IS CORRECT
•Mirrors early ChatGPT
•Minimizes failure surface
•Creates a permanent foundation
•Enforces discipline
•Enables painless growth
v0.1 is not weak — it is clean.
