// Pattern 2: a fixed chain. Extract -> gate in code -> draft -> gate in code.
// The order never changes, so the demo behaves the same every run.
import { askClaude } from '@/lib/claude';
import { checkItems, checkReply } from '@/lib/checks';
import { handle } from '@/lib/http';
import { EXTRACT_SYSTEM, REPLY_SYSTEM } from '@/lib/prompts';
import { SAMPLE_ITEMS, SAMPLE_REPLY } from '@/lib/samples';
import { ActionItems, ReplyDraft, RunInput } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handle(async () => {
    const { text, files } = RunInput.parse(await req.json());

    const extracted = await askClaude({
      system: EXTRACT_SYSTEM,
      prompt: `Client feedback:\n\n${text}`,
      files,
      schema: ActionItems,
      sample: SAMPLE_ITEMS,
    });
    const items = checkItems(text, extracted.data.items);
    const grounded = items.filter((i) => i.grounded);

    // Only items that passed the gate reach the next step.
    const drafted = await askClaude({
      system: REPLY_SYSTEM,
      prompt: `Write a reply confirming these changes:\n${grounded.map((i) => `- ${i.title}`).join('\n')}\n\nOriginal feedback, for tone:\n${text}`,
      schema: ReplyDraft,
      sample: SAMPLE_REPLY,
    });

    return { items, reply: drafted.data, checks: checkReply(drafted.data), source: extracted.source };
  });
}
