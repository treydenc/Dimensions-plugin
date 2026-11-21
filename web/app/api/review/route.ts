// The image pass: the model looks at a picture of one layout and says what a designer would see as wrong.
// It sees what the numbers cannot show (something floating, text on a busy patch, the moon cropped away).
// Advice only. It can raise something to check. Legal lines pass or fail in code, never here.
import { askClaude, hasKey } from '@/lib/claude';
import { handle } from '@/lib/http';
import { coveredAreas } from '@/lib/layout';
import { loadRules, same } from '@/lib/poster';
import { REVIEW_SYSTEM } from '@/lib/prompts';
import { SAMPLE_REVIEW } from '@/lib/samples';
import { ReviewAnswer, ReviewRequest } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Thinking counts toward the limit, so leave room for it.
const REVIEW_MAX_TOKENS = 16000;

export async function POST(req: Request) {
  return handle(async () => {
    const input = ReviewRequest.parse(await req.json());
    const rules = await loadRules();
    const size = rules.sizes.find((s) => s.name === input.size);
    if (!size) throw new Error(`${input.size} is not one of this campaign's sizes.`);

    // The rules code cannot check, for the layers that are in this layout.
    const placed = rules.layers.filter((l) => input.placements.some((p) => p.box && same(p.name, l.name)));
    const toLookFor = placed.flatMap((l) => { const look = rules.rules[l.role].notChecked; return look ? [look] : []; });
    const covered = coveredAreas(size);

    const prompt = [
      `This is the ${size.name} size, ${size.w} x ${size.h} pixels. The picture may be shown smaller; give positions in pixels of the full size.`,
      covered.length ? `The app covers these areas: ${covered.map((a) => `x ${a.x} to ${a.x + a.w}, y ${a.y} to ${a.y + a.h}`).join('; ')}.` : '',
      '',
      'Where each layer sits, back to front:',
      ...placed.map((l) => {
        const box = input.placements.find((p) => same(p.name, l.name))?.box;
        return box ? `- ${l.name} (${l.role}): left ${box.x}, top ${box.y}, width ${box.w}, height ${box.h}` : '';
      }),
      '',
      toLookFor.length ? `Rules to look for:\n${toLookFor.map((r) => `- ${r}`).join('\n')}` : 'There are no rules to look for. Return an empty list of rules.',
    ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');

    const { data, source } = await askClaude({
      system: REVIEW_SYSTEM,
      prompt,
      images: [{ mediaType: 'image/jpeg', data: input.image }],
      schema: ReviewAnswer,
      // With no key, the sample says every rule was seen to be kept and nothing looks wrong.
      sample: { ...SAMPLE_REVIEW, rules: toLookFor.map((rule) => ({ rule, kept: true, note: 'Sample answer.' })) },
      maxTokens: REVIEW_MAX_TOKENS,
    });

    // Only the rules that were asked about count. A rule with no answer stays unchecked.
    const answered = toLookFor.map((rule) => data.rules.find((r) => same(r.rule, rule)) ?? { rule, kept: false, note: 'This was not looked at.' });
    return { rules: answered, issues: data.issues.slice(0, 3), mode: hasKey() && source === 'claude' ? 'claude' : 'sample' };
  });
}
