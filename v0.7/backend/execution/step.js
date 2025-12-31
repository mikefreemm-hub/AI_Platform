export function validateStep(step) {
  const required = ["id", "type", "input", "output", "timestamp"];

  for (const key of required) {
    if (!(key in step)) {
      throw new Error(`Invalid step: missing ${key}`);
    }
  }

  const allowedTypes = ["decision", "reflection", "memory", "output"];
  if (!allowedTypes.includes(step.type)) {
    throw new Error(`Invalid step type: ${step.type}`);
  }
}
