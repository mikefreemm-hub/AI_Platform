import { randomUUID } from "crypto";

export function createExecutionGraph({ traceEnabled = true } = {}) {
  if (!traceEnabled) {
    return null;
  }

  return {
    run_id: randomUUID(),
    timestamp: new Date().toISOString(),
    steps: [],
    final_output: null
  };
}

export function addStep(graph, { id, type, input, output, metadata = {} }) {
  if (!graph) return;

  graph.steps.push({
    id,
    type,
    input,
    output,
    metadata
  });
}

export function finalizeGraph(graph, finalOutput, confidence = null) {
  if (!graph) return null;

  graph.final_output = finalOutput;

  if (confidence !== null) {
    graph.confidence = confidence;
  }

  return graph;
}
