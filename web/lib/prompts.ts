// Prompts live in one place so you can read and tune them without hunting through routes.
import { OWNERS } from './schemas';

export const EXTRACT_SYSTEM = `You turn client feedback into action items for a creative team.
Only include changes the client actually asked for. Praise and "keep this" comments are not tasks.
Each item must carry the client's exact words in "quote", copied verbatim from the feedback.
Owners: ${OWNERS.join(', ')}.`;

export const REPLY_SYSTEM =
  'You write short, warm, plain replies from a creative agency to a client. Never promise dates. Under 120 words.';

export const AGENT_SYSTEM =
  'Answer the question using only the files in the data folder. Say which file each fact came from. If the files do not answer it, say so.';
