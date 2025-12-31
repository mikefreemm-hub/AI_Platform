v0.5 BUILD PLAN

Execution Trace (Observability Foundation)

v0.5 DEFINITION OF DONE (LOCK THIS)

v0.5 is complete only when all of the following are true:

The chat system functions identically to v0.4
No behavior, prompt logic, or response content is altered
A trace can be generated only when explicitly requested
The trace fully explains how a single response was produced
No trace data is persisted, cached, or logged by default

If any item above is violated, v0.5 is not complete.

PURPOSE OF v0.5

v0.5 introduces execution observability.

The system must be able to explain:
What exactly happened during this response?

This version does not add features.
It adds visibility.

WHAT v0.5 DOES NOT DO

No persistence (databases, files, logs)
No authentication or users
No vector embeddings or retrieval
No tool calling or function execution
No policy enforcement or blocking
No UI changes required to function

API BEHAVIOR (FINAL)

Client → Server Request
{
  "message": "string (required)",
  "session_id": "string (required)",
  "trace": true
}

trace is optional
If omitted or false, no trace is generated
Partial traces are not allowed

Server → Client Response

Without trace
{
  "reply": "assistant message"
}

With trace
{
  "reply": "assistant message",
  "trace": { ... }
}

TRACE OBJECT (LOCKED STRUCTURE)

{
  "trace_id": "string",
  "timestamp": "ISO-8601 string",
  "model": "string",
  "session_id": "string",
  "inputs": {
    "system_prompt_hash": "string",
    "developer_prompt_hash": "string",
    "session_prompt_hash": "string",
    "user_message": "string"
  },
  "output": {
    "assistant_message": "string"
  }
}

PROMPT HASHING RULES

System, developer, and session prompts must not be stored in raw form.
Each prompt is hashed (e.g., SHA-256).

TRACE GENERATION RULES

Trace generation must not affect prompt composition, session memory, or model output.
Trace exists only in memory.
Trace is attached only to the response payload.
Trace must not be written to disk or console by default.

DIRECTORY STRUCTURE

v0.5/
backend/
frontend/
prompts/
docs/

SUCCESS CRITERIA

Every response can be explained.
Nothing new is remembered.
Nothing new is decided.
Nothing new is hidden.

FINAL NOTE

This version establishes the right to observe — nothing more.
