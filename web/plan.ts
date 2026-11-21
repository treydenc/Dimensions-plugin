// A blank plan. To start a new tool: copy this file over plan.ts, then fill it in.
import type { Plan } from '@/lib/plan-types';

export const plan: Plan = {
  name: null,
  oneLine: null,
  problem: { user: null, today: null, cost: null, chosen: null, why: null },
  form: { demo: 'web app', production: null, why: null },
  model: {
    pattern: null,
    model: 'claude-sonnet-5-5',
    why: null,
    agentTest: { complexEnough: null, worthTheTokens: null, canDoEveryPart: null, mistakeIsCheap: null },
  },
  context: { sources: [], personCanAdd: null, carriesOver: null },
  tools: [],
  prompt: { keyInstruction: null, pinnedBy: null, checkedBy: null },
  design: { data: null, privacy: null, brand: null, agency: null, directManipulation: null, generativeUi: null, principles: [], shaped: [] },
  architecture: { inputs: [], stations: [], gate: [], store: { name: null, items: [] }, human: { name: null, items: [] } },
  iterations: [
    { tag: 'v1', goal: 'Thinnest version working end to end', done: false },
    { tag: 'v2', goal: 'AI quality and the person\'s control', done: false },
    { tag: 'v3', goal: 'States, sample data, README', done: false },
  ],
  cut: [],
  log: [],
  demo: { happyPath: null, caught: null },
  next: [],
};
