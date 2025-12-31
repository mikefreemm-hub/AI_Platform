# 🧱 v0.4 BUILD PLAN
Prompt Governance & Session Control

---

## PURPOSE (LOCK THIS IN)

v0.4 exists to establish explicit, inspectable control over prompt composition before introducing memory, tools, or autonomy.

v0.4 does not attempt to make the model smarter.
It ensures the system knows exactly what it is telling the model and why.

---

## v0.4 DEFINITION OF DONE (NON-NEGOTIABLE)

v0.4 is complete when all of the following are true:

1. All prompts sent to the model are assembled from named, ordered layers
2. Each prompt layer is defined in a human-readable file
3. Prompt assembly occurs only in the backend
4. A developer-only debug mode can return the exact assembled prompt
5. Prompt layers are static or session-ephemeral only
6. No data persists beyond a browser refresh
7. The v0.1 interaction loop remains unchanged
8. No UI behavior changes are required for normal operation

---

## EXPLICIT NON-GOALS

v0.4 explicitly does not include:

- Long-term memory
- Conversation summarization
- Embeddings or vector storage
- Tool usage
- Agent loops
- Background processes
- UI redesign
- Authentication
- Analytics or logging

---

## DIRECTORY STRUCTURE (ADDITIVE ONLY)

v0.4 introduces one new directory:

v0.4/
├── frontend/
├── backend/
├── docs/
│   └── build-plan-v0.4.md
└── prompts/
    ├── system.md
    ├── developer.md
    └── session.md

---

## PROMPT LAYER MODEL

Prompt assembly order (fixed):

1. System Prompt
2. Developer Prompt
3. Session Prompt
4. User Input

---

## PROMPT LAYER DEFINITIONS

### System Prompt
- Loaded from prompts/system.md
- Immutable per version
- Never modified at runtime

### Developer Prompt
- Loaded from prompts/developer.md
- Immutable per version
- Never modified at runtime

### Session Prompt
- Loaded from prompts/session.md
- Ephemeral
- Reset on browser refresh
- Never persisted

### User Input
- Raw user text
- No preprocessing

---

## PROMPT ASSEMBLY RULES

- Assembly occurs only in backend
- Frontend never sees prompt layers
- Boundaries must be explicit and detectable
- Assembly must be deterministic

---

## DEBUG MODE (OPTION A — BACKEND ONLY)

.env
DEBUG=true

When DEBUG=false:
- Backend returns model reply only

When DEBUG=true:
- Backend additionally returns:
  - Full assembled prompt
  - Layer boundaries
  - Approximate token count

---

## DEBUG CONSTRAINTS

- Observational only
- No mutation
- No persistence
- No logging
- No chain-of-thought exposure

---

## SESSION LIFETIME GUARANTEE

- In-memory only
- Browser refresh guarantees reset
- No cookies
- No localStorage
- No database

---

## UI RULES

- UI behavior unchanged from v0.3
- No debug controls
- No prompt visibility

---

## VERSION FREEZE RULE

After v0.4:
- Prompt layering is frozen
- Assembly order is frozen
- Debug schema is frozen

Future versions may extend, not alter.

---

## EXIT CRITERIA

v0.4 may be frozen when:
- Prompt governance is explicit
- Explainability exists
- No persistence exists
- End-user behavior matches v0.1

---

END OF PLAN
