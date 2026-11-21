// The rules reader. The designer uploads the client's own document; the model proposes a rule for
// each kind of layer; code checks every proposal; the designer confirms; only then is a rule used.
//   POST   read a document in data/ and return proposals. Nothing is saved.
//   PUT    save the rules the designer ticked. They are checked again here first.
//   DELETE go back to the built-in practice rules.
import path from 'node:path';
import { askClaude, hasKey } from '@/lib/claude';
import { checkRules } from '@/lib/checks';
import { handle } from '@/lib/http';
import { readText } from '@/lib/loaders';
import { clearRules, saveRules } from '@/lib/poster';
import { RULES_SYSTEM } from '@/lib/prompts';
import { describe } from '@/lib/rules';
import { SAMPLE_RULES } from '@/lib/samples';
import { RulesAnswer, RulesConfirm, RulesRequest } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Thinking counts toward the limit, so leave room for it.
const RULES_MAX_TOKENS = 16000;
const TEXT = new Set(['.txt', '.md', '.csv', '.json', '.html']);
const READABLE = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', ...TEXT]);

/** The document's words, when it is a text file. A PDF or an image cannot be searched here. */
async function textOf(file: string): Promise<string | null> {
  return TEXT.has(path.extname(file).toLowerCase()) ? readText(file) : null;
}

export async function POST(req: Request) {
  return handle(async () => {
    const { file } = RulesRequest.parse(await req.json());
    if (!READABLE.has(path.extname(file).toLowerCase())) throw new Error('That kind of file cannot be read. Add a PDF, an image or a text file.');
    const { data, source } = await askClaude({
      system: RULES_SYSTEM,
      prompt: 'List the rule this document gives for each part of the poster.',
      files: [file],
      schema: RulesAnswer,
      sample: SAMPLE_RULES,
      maxTokens: RULES_MAX_TOKENS,
    });
    const proposals = checkRules(data.rules, source === 'claude' ? await textOf(file) : null).map((p) => ({ ...p, summary: describe(p) }));
    if (proposals.length === 0) throw new Error('No rules were found in that document. Check it is the client\'s rules, then try again.');
    return { file, proposals, mode: hasKey() && source === 'claude' ? 'claude' : 'sample' };
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const { file, rules } = RulesConfirm.parse(await req.json());
    // Never trust what comes back from the panel: the same gate runs again before anything is saved.
    const checked = checkRules(rules, null).map(({ flags: _flags, grounded: _grounded, ...rule }) => rule);
    await saveRules(file, checked);
    return { saved: checked.length };
  });
}

export async function DELETE() {
  return handle(async () => {
    await clearRules();
    return { saved: 0 };
  });
}
