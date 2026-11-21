// Sample input and sample output. The output is what the app shows when no API key is set.
import type { AgentStep } from './claude';

export const SAMPLE_FEEDBACK = `Hi team, thanks for round one. The logo feels too small on the mobile banner, can we bump it up? Legal says the disclaimer has to be on every size, including the 300x250. The headline on the story version is getting cut off by the app's buttons. Love the color, don't change that. Also, can we see a version with the holiday tagline?`;

export const SAMPLE_QUESTION = 'Which sizes still need the legal disclaimer?';

export const SAMPLE_ITEMS = {
  items: [
    { title: 'Enlarge logo on mobile banner', owner: 'design' as const, priority: 'medium' as const, quote: 'The logo feels too small on the mobile banner' },
    { title: 'Add disclaimer to every size', owner: 'production' as const, priority: 'high' as const, quote: 'the disclaimer has to be on every size, including the 300x250' },
    { title: 'Fix cropped headline on story version', owner: 'design' as const, priority: 'high' as const, quote: "The headline on the story version is getting cut off by the app's buttons" },
    { title: 'Make a holiday tagline version', owner: 'copy' as const, priority: 'low' as const, quote: 'can we see a version with the holiday tagline' },
    // Not in the sample text on purpose: shows the gate catching an invented task.
    { title: 'Send revised files by Friday', owner: 'account' as const, priority: 'medium' as const, quote: 'we need the revised files by Friday' },
  ],
};

export const SAMPLE_REPLY = {
  subject: 'Round one feedback: next steps',
  body: 'Thanks for the clear notes. We are enlarging the logo on the mobile banner, adding the disclaimer to every size including the 300x250, and fixing the story headline so the app buttons no longer cover it. The color stays as it is. We will also prepare a version with the holiday tagline for you to compare.',
};

export const SAMPLE_AGENT: { answer: string; steps: AgentStep[] } = {
  answer: 'The 300x250 is the only size called out by name. The feedback says the disclaimer must be on every size, so check all of them, starting with the 300x250.',
  steps: [
    { tool: 'list_files', input: {}, result: 'sample-feedback.txt' },
    { tool: 'read_file', input: { name: 'sample-feedback.txt' }, result: 'Hi team, thanks for round one. The logo feels too small…' },
  ],
};
