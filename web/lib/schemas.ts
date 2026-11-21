// Shapes Claude must return. One Zod schema does two jobs: it tells Claude the output
// shape, and it validates what comes back.
import { z } from 'zod';
import { ROLES } from './layout';

/* ---------- Poster resize ---------- */

/** What the model returns for one size: a place for every layer. Height is never asked for;
 *  code works it out from the layer's own proportions, so nothing can be stretched. */
export const LayoutAnswer = z.object({
  layers: z.array(z.object({
    name: z.string().describe('The layer name, exactly as given'),
    placed: z.boolean().describe('false only when the layer is left out of this size'),
    x: z.number().describe('Left edge in pixels of the new size'),
    y: z.number().describe('Top edge in pixels of the new size'),
    w: z.number().describe('Width in pixels of the new size'),
    reason: z.string().describe('One short sentence on why it sits here'),
  })),
});
export type LayoutAnswer = z.infer<typeof LayoutAnswer>;

const BoxInput = z.object({ x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive() });

/** What the panel sends: the ticked sizes, and the open document when it is running inside Photoshop. */
export const LayoutRequest = z.object({
  sizes: z.array(z.string()).min(1, 'Tick at least one size.').max(10),
  document: z.object({
    id: z.number(),
    title: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    layers: z.array(z.object({ id: z.number(), name: z.string(), box: BoxInput })),
  }).nullable().default(null),
  /** What a look at the picture found, by size name. Sends that size back to the model once. */
  notes: z.record(z.string(), z.array(z.string().max(600)).max(12)).default({}),
  /** The layout those notes are about, by size name. */
  previous: z.record(z.string(), z.array(z.object({ name: z.string(), box: BoxInput.nullable() }))).default({}),
});

/** What the model returns after looking at a picture of one layout. Advice only: it can raise
 *  something to check, it can never pass a legal line. */
export const ReviewAnswer = z.object({
  rules: z.array(z.object({
    rule: z.string().describe('The rule, exactly as given'),
    kept: z.boolean().describe('true when the picture shows the rule is kept'),
    note: z.string().describe('One short sentence on what you see'),
  })),
  issues: z.array(z.object({
    layer: z.string().describe('The layer name the problem is about'),
    problem: z.string().describe('One short sentence a designer would agree with at a glance'),
    fix: z.string().describe('One short sentence on where to move or how to resize it, with pixel positions'),
  })),
});
export type ReviewAnswer = z.infer<typeof ReviewAnswer>;

export const ReviewRequest = z.object({
  size: z.string(),
  image: z.string().min(100, 'The picture of the layout is missing.').max(4_000_000, 'The picture of the layout is too large.'),
  placements: z.array(z.object({ name: z.string(), box: BoxInput.nullable() })),
});

/* ---------- The rules reader ---------- */

/** One rule as the model reads it from the client's document, in fields code can check. */
export const RuleAnswer = z.object({
  role: z.enum(ROLES).describe('Which kind of layer the rule is about'),
  quote: z.string().describe('The words from the document this rule comes from, copied exactly, one or two sentences'),
  legal: z.boolean().describe('true when the document calls it legal, contractual or mandatory by law or contract'),
  appears: z.enum(['always', 'above', 'may be left out under']).describe('always: on every size. above: required only when the short side is above "pixels". may be left out under: optional when the short side is under "pixels"'),
  pixels: z.number().describe('The short-side size in pixels for "above" or "may be left out under". 0 for always'),
  clearSpace: z.number().describe('Clear space on all sides as a share of the layer\'s own height, 0.5 for half. 0 when none is asked for'),
  billingShare: z.number().describe('Billing block only: smallest letter height as a share of the title\'s letter height, 0.15 for 15%. 0 otherwise'),
  cannotCheck: z.string().describe('Any part of the rule that needs eyes on the picture, in a few plain words, such as "keep the moon in frame". Empty when there is none'),
});
export type RuleAnswer = z.infer<typeof RuleAnswer>;
export const RulesAnswer = z.object({ rules: z.array(RuleAnswer) });

/** Ask for a document in data/ to be read. */
export const RulesRequest = z.object({ file: z.string().min(1, 'Choose a document first.') });
/** The rules the designer confirmed. Checked again in code before they are saved. */
export const RulesConfirm = z.object({ file: z.string().min(1), rules: z.array(RuleAnswer).min(1, 'Tick at least one rule to use.').max(ROLES.length) });
