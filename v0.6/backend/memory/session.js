/*
  Session Memory (v0.6)
  - In-memory only
  - Explicit writes
  - Reset on restart
*/

const sessionStore = new Map();

export function getSessionMemory(sessionId) {
  return sessionStore.get(sessionId) || [];
}

export function writeSessionMemory(sessionId, entry) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, []);
  }

  sessionStore.get(sessionId).push({
    timestamp: new Date().toISOString(),
    entry
  });
}

export function clearSessionMemory(sessionId) {
  sessionStore.delete(sessionId);
}
