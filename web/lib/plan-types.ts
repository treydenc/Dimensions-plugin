// The shape of a plan. `null` means "not decided yet" and shows as [ undecided ] on /plan.
export type Open<T = string> = T | null;

export type Plan = {
  name: Open;
  oneLine: Open;

  problem: {
    user: Open;       // who has the problem
    today: Open;      // how they handle it now
    cost: Open;       // what that costs them
    chosen: Open;     // the problem I chose, in one sentence
    why: Open;        // why this one and not the others
  };

  form: {
    demo: 'web app';
    production: Open<'hosted web app' | 'desktop app' | 'plugin'>;
    why: Open;
  };

  model: {
    pattern: Open<'single' | 'chain' | 'agent'>;
    model: Open;
    why: Open;
    // The "should I build an agent?" rule. Any "no" means workflow, not agent.
    agentTest: { complexEnough: Open<boolean>; worthTheTokens: Open<boolean>; canDoEveryPart: Open<boolean>; mistakeIsCheap: Open<boolean> };
  };

  context: {
    sources: { name: string; chosenBy: 'person' | 'system'; note?: string }[];
    personCanAdd: Open<boolean>;
    carriesOver: Open<boolean>;
  };

  tools: { name: string; does: string; kind: 'read' | 'write' | 'external'; needsApproval: boolean }[];

  prompt: {
    keyInstruction: Open;
    pinnedBy: Open;   // schema, examples, or both
    checkedBy: Open;  // what verifies the answer afterwards
  };

  design: {
    data: Open;               // how data is tagged and sourced
    privacy: Open;            // what is sensitive and where it goes
    brand: Open;              // which brand or design-book rules are enforced
    agency: Open;             // what the person decides; undo
    directManipulation: Open; // can they fix a result by editing it
    generativeUi: Open;       // does the interface change with the output
    principles: string[];     // the two or three I am holding to
    // How human-centered design shaped the system. One entry per decision:
    // the moment in the person's work, the principle, and what it changed in the architecture.
    shaped: { moment: Moment; principle: string; source?: string; so: string; where: string }[];
  };

  architecture: {
    inputs: { t: string; d: string }[];
    stations: { t: string; d: string; by: 'model' | 'code' }[];
    gate: string[];
    store: { name: Open; items: string[] };
    human: { name: Open; items: string[] };
  };

  iterations: { tag: 'v1' | 'v2' | 'v3'; goal: Open; done: boolean }[];
  cut: string[];

  // For the video. Fill these in as you build.
  log: { what: string; decided: string }[];   // where I narrowed scope, overruled the model, or caught a mistake
  demo: { happyPath: Open; caught: Open };     // the task I will show, and the bad answer a check will catch
  next: string[];                              // what I would do with more time, in order
};

/** The "should I build an agent?" rule. The first answer that is not a yes decides. */
export function agentVerdict(t: Plan['model']['agentTest']): string | null {
  if (t.complexEnough === false || t.worthTheTokens === false) return 'Workflow, not an agent';
  if (t.canDoEveryPart === false) return 'Cut the scope';
  if (t.mistakeIsCheap === false) return 'Read-only, with a person in the loop';
  if ([t.complexEnough, t.worthTheTokens, t.canDoEveryPart, t.mistakeIsCheap].some((v) => v === null)) return null;
  return 'Agent';
}

// The four moments where a person meets an AI system, each as the question they are asking.
// Every design principle in plan.design.shaped is filed under one of them.
export type Moment = 'start' | 'ask' | 'judge' | 'correct';
export const MOMENTS: Record<Moment, { label: string; question: string }> = {
  start: { label: 'Before any AI', question: 'What am I actually trying to get done?' },
  ask: { label: 'Asking', question: 'How do I tell it what I want?' },
  judge: { label: 'Judging', question: 'Can I trust what came back?' },
  correct: { label: 'Correcting', question: 'What if it is wrong?' },
};
export const MOMENT_ORDER: Moment[] = ['start', 'ask', 'judge', 'correct'];
