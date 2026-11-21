// The poster resize chain. Fixed order, capped at two model tries per size:
//   match layers to rules (code) -> scale to fit (code) -> gate (code)
//   -> only if that fails: place the layers (model) -> gate (code) -> one retry with the failures -> stop.
// A look at the picture (app/api/review) can send one size back here once, with what it saw.
// The model never changes anything. It proposes boxes; code checks them; the designer decides.
import { askClaude, hasKey } from '@/lib/claude';
import { checkLayout, statusOf, type LayoutCheck, type LayoutNote, type SizeResult, type Step } from '@/lib/checks';
import { handle } from '@/lib/http';
import { MIN_FILL, boxAt, coveredAreas, isNeeded, minBillingWidth, scaleToFit, type Placement, type Poster, type Size } from '@/lib/layout';
import { loadRules, same } from '@/lib/poster';
import { describeRule } from '@/lib/rules';
import { LAYOUT_SYSTEM } from '@/lib/prompts';
import { SAMPLE_LAYOUTS } from '@/lib/samples';
import { LayoutAnswer, LayoutRequest } from '@/lib/schemas';
import type { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The sizes this pass can make. The wide ones wait for a one-line title. */
const READY_SIZES = ['Story', 'Feed portrait', 'Square', 'Video thumbnail', 'Bus shelter'];
const MAX_TRIES = 2;
// Thinking counts toward the limit. A small limit cuts the answer off part way through its JSON.
const LAYOUT_MAX_TOKENS = 16000;
/** True when the model's answer came back cut off or unreadable. That is a failed try, not a crash. */
const cutOff = (err: unknown) => err instanceof Error && /Failed to parse structured output|returned no structured answer/.test(err.message);

type Doc = NonNullable<z.infer<typeof LayoutRequest>['document']>;

/** Match the open document's layers to the rules by name. No model call. */
function posterFrom(rules: Awaited<ReturnType<typeof loadRules>>, doc: Doc | null): Poster {
  if (!doc) return { title: rules.title, canvas: rules.canvas, layers: rules.layers, rules: rules.rules, from: 'sample' };
  const missing: string[] = [];
  const layers = rules.layers.flatMap((rule) => {
    const found = doc.layers.find((l) => same(l.name, rule.name));
    if (!found) { missing.push(rule.name); return []; }
    return [{ ...rule, box: found.box, id: found.id }];
  });
  if (missing.length) throw new Error(`This document has no layer named ${missing.join(', ')}. Rename the layers to match the client's rules, then try again.`);
  return { title: doc.title, canvas: { w: doc.width, h: doc.height }, layers, rules: rules.rules, from: 'photoshop', id: doc.id };
}

function promptFor(poster: Poster, size: Size, earlier: Step[], previous?: Placement[]): string {
  const covered = coveredAreas(size);
  const title = poster.layers.find((l) => l.role === 'title');
  const lines = [
    `New size: ${size.name}, ${size.w} x ${size.h} pixels.`,
    covered.length ? `Areas the app covers (keep all text out): ${covered.map((a) => `x ${a.x} to ${a.x + a.w}, y ${a.y} to ${a.y + a.h}`).join('; ')}.` : 'No covered areas.',
    `Original: ${poster.canvas.w} x ${poster.canvas.h} pixels.`,
    '',
    'Layers, back to front:',
    ...poster.layers.map((l) => {
      const rule = poster.rules[l.role];
      const must = isNeeded(poster.rules, l.role, size) ? 'must appear' : 'may be left out on this size';
      return `- ${l.name} (${l.role}${rule.legal ? ', legal' : ''}): ${l.box.w} x ${l.box.h} at ${l.box.x}, ${l.box.y}; ${must}. Rule: ${rule.says ?? l.rule}`;
    }),
  ];
  const share = poster.rules['billing block'].billingShare;
  if (title && share && isNeeded(poster.rules, 'billing block', size)) {
    lines.push('', `Measured fact: the billing block must be at least ${(minBillingWidth(1000, share) / 1000).toFixed(2)} times as wide as the title.`);
  }
  if (previous) {
    lines.push('', 'The layout so far:', ...previous.map((p) => (p.box ? `- ${p.name}: left ${p.box.x}, top ${p.box.y}, width ${p.box.w}, height ${p.box.h}` : `- ${p.name}: left out`)));
  }
  const HEADINGS = {
    code: 'Shrinking the whole poster to fit was tried first and failed these checks:',
    model: 'Your last layout failed these checks. Fix them and keep the rest:',
    look: 'A look at the picture of the layout so far found these problems. Fix them and keep the rest:',
  };
  for (const step of earlier) {
    if (!step.failed.length) continue;
    lines.push('', HEADINGS[step.by], ...step.failed.map((f) => `- ${f}`));
  }
  return lines.join('\n');
}

/** Turn the model's answer into boxes. Height comes from the layer's own proportions. */
function toPlacements(poster: Poster, answer: LayoutAnswer): { placements: Placement[]; unanswered: string[] } {
  const unanswered: string[] = [];
  const placements = poster.layers.map((layer): Placement => {
    const a = answer.layers.find((x) => same(x.name, layer.name));
    if (!a) { unanswered.push(layer.name); return { name: layer.name, box: null }; }
    if (!a.placed || !(a.w > 0)) return { name: layer.name, box: null, reason: a.reason };
    return { name: layer.name, box: boxAt(layer, a.x, a.y, a.w), reason: a.reason };
  });
  return { placements, unanswered };
}

const failures = (checks: LayoutCheck[]) => checks.filter((c) => !c.pass).map((c) => `${c.rule}. ${c.detail ?? ''}`.trim());

async function layOut(poster: Poster, size: Size, look?: { notes: string[]; previous: Placement[] }): Promise<SizeResult> {
  const withIds = (placements: Placement[]) => placements.map((p) => ({ ...p, id: poster.layers.find((l) => l.name === p.name)?.id }));
  const done = (madeBy: 'code' | 'model', tries: number, steps: Step[], placements: Placement[], checks: LayoutCheck[], notes: LayoutNote[]): SizeResult =>
    ({ size, covered: coveredAreas(size), madeBy, tries, steps, placements: withIds(placements), checks, notes, status: statusOf(checks, notes) });

  const steps: Step[] = [];
  let last: { placements: Placement[]; checks: LayoutCheck[]; notes: LayoutNote[] };
  if (look) {
    // Sent back by a look at the picture: start from that layout and what was seen.
    steps.push({ by: 'look', failed: look.notes });
    last = { placements: look.previous, ...checkLayout(poster, size, look.previous) };
  } else {
    // Station 1, code: shrink the poster to fit. Free, and kept only if it fills the frame and passes every check.
    const fit = scaleToFit(poster, size);
    const fitChecked = checkLayout(poster, size, fit.placements);
    const fitFailed = failures(fitChecked.checks);
    if (fit.fill < MIN_FILL) fitFailed.unshift(`The poster would only fill ${Math.round(fit.fill * 100)}% of this shape, so it needs a new arrangement.`);
    steps.push({ by: 'code', failed: fitFailed });
    if (fitFailed.length === 0) return done('code', 0, steps, fit.placements, fitChecked.checks, fitChecked.notes);
    last = { placements: fit.placements, ...fitChecked };
  }

  // Station 2, model: a new arrangement. One retry with the failed checks, then stop.
  const samples = SAMPLE_LAYOUTS[size.name];
  if (!hasKey() && !samples) throw new Error(`There is no sample layout for ${size.name}. Add an API key to .env.local, or untick that size.`);
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    let data: LayoutAnswer;
    try {
      ({ data } = await askClaude({
        system: LAYOUT_SYSTEM,
        prompt: promptFor(poster, size, steps.filter((s) => !s.cutOff), look?.previous),
        schema: LayoutAnswer,
        sample: ((attempt > 1 || look) && samples?.retry) || samples?.first || { layers: [] },
        maxTokens: LAYOUT_MAX_TOKENS,
      }));
    } catch (err) {
      if (!cutOff(err)) throw err;
      console.error(`${size.name}: try ${attempt} came back cut off`, err);
      steps.push({ by: 'model', failed: ['The answer was cut off before it finished.'], cutOff: true });
      if (attempt < MAX_TRIES) continue;
      // No complete answer after every try. Show the shrunk poster so there is something to look at, and say why.
      const checks = [...last.checks, { id: 'answer', rule: 'A complete layout came back', pass: false, detail: 'The answer was cut off both times. Press Propose again.' }];
      return done('model', attempt, steps, last.placements, checks, last.notes);
    }
    const { placements, unanswered } = toPlacements(poster, data);
    const checked = checkLayout(poster, size, placements);
    const failed = failures(checked.checks);
    if (unanswered.length) failed.unshift(`The answer gave no place for: ${unanswered.join(', ')}.`);
    steps.push({ by: 'model', failed });
    last = { placements, ...checked };
    if (failed.length === 0 || attempt === MAX_TRIES) return done('model', attempt, steps, placements, checked.checks, checked.notes);
  }
  return done('model', MAX_TRIES, steps, last.placements, last.checks, last.notes);
}

/** What the panel shows before a run: the sizes, and each layer's rule. Reads nothing from Photoshop. */
export async function GET() {
  return handle(async () => {
    const rules = await loadRules();
    return {
      title: rules.title,
      sizes: rules.sizes.filter((s) => s.note === undefined).map((s) => ({ ...s, ready: READY_SIZES.includes(s.name) })),
      // Each layer's rule in plain words, and the client's own words when it came from their document.
      layers: rules.layers.map((l) => {
        const rule = rules.rules[l.role];
        const fromClient = rules.confirmed.includes(l.role);
        return { name: l.name, role: l.role, legal: rule.legal, fromClient, rule: fromClient ? describeRule(rule) : l.rule, says: fromClient ? rule.says ?? null : null };
      }),
      rulesFrom: rules.rulesFrom,
      mode: hasKey() ? 'claude' : 'sample',
    };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const input = LayoutRequest.parse(await req.json());
    const rules = await loadRules();
    const poster = posterFrom(rules, input.document);
    const sizes = input.sizes.map((name) => {
      const size = rules.sizes.find((s) => s.name === name);
      if (!size || !READY_SIZES.includes(name)) throw new Error(`${name} is not a size this tool can make yet.`);
      return size;
    });
    const results = await Promise.all(sizes.map((size) => {
      const notes = input.notes[size.name];
      const seen = input.previous[size.name];
      if (!notes?.length || !seen) return layOut(poster, size);
      // Only boxes for layers this poster has, in its order.
      const previous = poster.layers.map((l) => ({ name: l.name, box: seen.find((p) => same(p.name, l.name))?.box ?? null }));
      return layOut(poster, size, { notes, previous });
    }));
    return { poster: { title: poster.title, canvas: poster.canvas, from: poster.from, id: poster.id ?? null }, results, mode: hasKey() ? 'claude' : 'sample' };
  });
}
