import { randomUUID } from 'crypto';

export function createGraph({ version, input }) {
  return {
    run_id: randomUUID(),
    version,
    input,
    started_at: new Date().toISOString(),
    steps: [],
    final_output: null,
    finalized_at: null
  };
}

export function addStep(graph, step) {
  if (graph.finalized_at) {
    throw new Error('Cannot add step to finalized graph');
  }
  graph.steps.push(step);
}

export function finalizeGraph(graph, finalOutput) {
  if (graph.finalized_at) {
    throw new Error('Graph already finalized');
  }

  graph.final_output = finalOutput;
  graph.finalized_at = new Date().toISOString();
}
