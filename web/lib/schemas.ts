// Shapes Claude must return. One Zod schema does two jobs: it tells Claude the output
// shape, and it validates what comes back. Replace these with the shapes your tool needs.
import { z } from 'zod';

export const OWNERS = ['design', 'copy', 'production', 'account'] as const;

export const ActionItem = z.object({
  title: z.string().describe('Short imperative task, under 10 words'),
  owner: z.enum(OWNERS).describe('Team that should do it'),
  priority: z.enum(['high', 'medium', 'low']),
  quote: z.string().describe('The exact words from the feedback that this task comes from, copied verbatim'),
});
export type ActionItem = z.infer<typeof ActionItem>;

export const ActionItems = z.object({ items: z.array(ActionItem) });

export const ReplyDraft = z.object({
  subject: z.string(),
  body: z.string().describe('Plain text reply to the client, under 120 words'),
});
export type ReplyDraft = z.infer<typeof ReplyDraft>;

export const RunInput = z.object({
  text: z.string().trim().min(1, 'Add some text first.').max(20000),
  files: z.array(z.string()).max(10, 'Choose 10 files or fewer.').default([]),
});
