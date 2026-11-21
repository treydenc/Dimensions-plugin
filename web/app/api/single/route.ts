// Pattern 1: one call, structured output, checked in code.
import { askClaude } from '@/lib/claude';
import { checkItems } from '@/lib/checks';
import { handle } from '@/lib/http';
import { SAMPLE_ITEMS } from '@/lib/samples';
import { EXTRACT_SYSTEM } from '@/lib/prompts';
import { ActionItems, RunInput } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handle(async () => {
    const { text, files } = RunInput.parse(await req.json());
    const { data, source } = await askClaude({
      system: EXTRACT_SYSTEM,
      prompt: `Client feedback:\n\n${text}`,
      files,
      schema: ActionItems,
      sample: SAMPLE_ITEMS,
    });
    return { items: checkItems(text, data.items), source };
  });
}
