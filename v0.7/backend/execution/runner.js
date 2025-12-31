import { createGraph, addStep, finalizeGraph } from './graph.js';
import { validateStep } from './step.js';
import { persistRun } from '../trace/store.js';

export async function runExecution({ version, input, execute }) {
  const graph = createGraph({ version, input });

  const output = await execute({
    graph,
    addStep: (step) => {
      validateStep(step);
      addStep(graph, step);
    },
    finalize: (finalOutput) => {
      finalizeGraph(graph, finalOutput);
    }
  });

  // LAW: output forbidden unless graph finalized
  if (!graph.finalized_at) {
    throw new Error('LAW VIOLATION: output without finalized trace');
  }

  // LAW: must contain at least one output step
  const hasOutputStep = graph.steps.some(s => s.type === 'output');
  if (!hasOutputStep) {
    throw new Error('LAW VIOLATION: no output step recorded');
  }

  // LAW: must persist successfully
  persistRun(graph);

  return {
    run_id: graph.run_id,
    output
  };
}
