# 🧱 v0.3 BUILD PLAN
Persistent Session Memory (Bidirectional, Append-Only)

---

## v0.3 DEFINITION OF DONE (LOCK THIS IN)

v0.3 is complete when ALL of the following are true:

- A user can refresh the page and continue the same conversation
- The assistant correctly references prior turns in that session
- Memory is scoped strictly to a single session_id
- Starting a new session produces a clean conversation with no prior context
- Memory grows only by appending messages, never rewriting them
- Prompt context is explicitly bounded (last N turns)
- No data persists beyond server runtime
- No memory leaks across sessions

Nothing else is allowed in v0.3.

---

## 1. VERSIONING RULE (MANDATORY)

- v0.2 is frozen
- All work occurs in a new folder:

C:\Users\mikef\AI_Platform\v0.3\

- No files are shared or modified in v0.2
- v0.3 must be runnable as a standalone artifact

---

## 2. DIRECTORY & PROJECT LAYOUT (UNCHANGED)

The directory structure must not change:

v0.3/
  frontend/
    index.html
    styles.css
    app.js

  backend/
    server.js
    package.json
    package-lock.json
    .env (local only; never shipped)

  docs/
    build-plan-v0.3.md

No additional folders are permitted.

---

## 3. IDENTITY MODEL (CLIENT-HELD)

Session identity rules:

- A session_id must exist at all times
- Stored in localStorage
- Generated only if missing
- Reused automatically on page reload
- Replaced only when the user explicitly starts a new session

Identity guarantees:

- Refresh does NOT create a new identity
- New Session button DOES create a new identity
- Session IDs are UUIDs
- Frontend sends session_id with every request

---

## 4. MEMORY MODEL (SERVER-HELD)

Memory scope:

- Memory is scoped only by session_id
- No global memory
- No cross-session access

Canonical memory structure:

sessions = {
  session_id: [
    { role: "user", content: "...", ts },
    { role: "assistant", content: "...", ts }
  ]
}

Memory rules:

- Append-only
- Ordered
- Timestamped
- No summarization
- No pruning except by hard cap
- No mutation of past entries

---

## 5. PROMPT CONSTRUCTION RULES

Prompt composition order:

1. One fixed system message
2. The last N messages from the current session (user + assistant)

Constraints:

- MAX_TURNS must be a constant
- Recommended default: MAX_TURNS = 20
- No dynamic heuristics
- No hidden prompt manipulation

Prompt behavior must be explainable by inspection.

---

## 6. BACKEND REQUEST FLOW (STRICT)

For each /chat request:

1. Receive { message, session_id }
2. Validate both fields are strings
3. If session_id does not exist, initialize empty memory
4. Append user message to session memory
5. Construct prompt using last N messages
6. Call OpenAI
7. Append assistant response to session memory
8. Return assistant response to client

No side effects outside this flow are allowed.

---

## 7. FRONTEND BEHAVIOR (MINIMAL ADDITIONS)

On page load:

- Read session_id from localStorage
- If missing, generate UUID and store it

UI requirements:

- Existing chat UI remains unchanged
- Add one control: New Session button
  - Generates a new UUID
  - Overwrites localStorage.session_id
  - Clears the chat UI

Optional (debug-only):

- Display current session_id in small text

---

## 8. CORS & EXECUTION MODEL (UNCHANGED)

- Frontend is loaded via file://
- Backend runs on http://localhost:<port>
- Backend must allow Origin: null
- OPTIONS requests must be handled correctly
- No frontend dev server is introduced

---

## 9. DATA PERSISTENCE RULES

- Memory lives only in RAM
- Restarting the backend clears all memory
- Refreshing the browser does NOT clear memory
- New Session explicitly clears memory for that user

Behavior must be deterministic.

---

## 10. EXPLICIT NON-GOALS (DO NOT ADD)

v0.3 must NOT include:

- Databases
- Disk persistence
- Embeddings
- Long-term memory
- Summarization
- Tools or function calling
- User accounts
- Authentication
- Prompt self-modification

If any of these appear, v0.3 is invalid.

---

## FINAL NOTE

v0.3 is the last version where memory is simple enough to fully reason about.

Do not optimize.
Do not anticipate v0.4 in code.
Do not abstract prematurely.

Build exactly this.
Freeze it.
Then move on.
