import crypto from "crypto";

export function sha256(input) {
  return crypto
    .createHash("sha256")
    .update(String(input ?? ""), "utf8")
    .digest("hex");
}

export function makeTrace({
  model,
  session_id,
  systemPrompt,
  developerPrompt,
  sessionPrompt,
  userMessage,
  assistantMessage
}) {
  return {
    trace_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    model: String(model ?? ""),
    session_id: String(session_id ?? ""),
    inputs: {
      system_prompt_hash: sha256(systemPrompt),
      developer_prompt_hash: sha256(developerPrompt),
      session_prompt_hash: sha256(sessionPrompt),
      user_message: String(userMessage ?? "")
    },
    output: {
      assistant_message: String(assistantMessage ?? "")
    }
  };
}
