// The gate: plain code that checks what the model proposed. No AI in this file.
// Rule of thumb: if you can write the rule down, it belongs here, not in a prompt.
import {
  ROLES, billingShare, bottom, contains, coveredAreas, grow, isNeeded, minBillingWidth, overlaps, right,
  type Box, type Placement, type Poster, type Role, type Size,
} from './layout';
import type { RuleAnswer } from './schemas';

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* ---------- The poster resize gate ----------
 * Every layout, whoever made it, goes through these. A legal line can only pass here. */

export type LayoutCheck = { id: string; rule: string; pass: boolean; detail?: string };
/** Something a person should look at. "not-checked" is a rule code cannot check yet. */
export type LayoutNote = { kind: 'look' | 'not-checked'; text: string };
export type LayoutStatus = 'ready' | 'check' | 'needs';

const list = (names: string[]) => names.join(', ');

export function checkLayout(poster: Poster, size: Size, placements: Placement[]): { checks: LayoutCheck[]; notes: LayoutNote[] } {
  const frame: Box = { x: 0, y: 0, w: size.w, h: size.h };
  const placed = poster.layers.flatMap((layer) => {
    const box = placements.find((p) => p.name === layer.name)?.box ?? null;
    return box ? [{ layer, box, rule: poster.rules[layer.role] }] : [];
  });
  const isPlaced = (name: string) => placed.some((p) => p.layer.name === name);
  const checks: LayoutCheck[] = [];
  const notes: LayoutNote[] = [];
  const add = (id: string, rule: string, problems: string[]) => checks.push({ id, rule, pass: problems.length === 0, detail: problems.length ? problems.join(' ') : undefined });

  const needed = poster.layers.filter((l) => isNeeded(poster.rules, l.role, size));
  const missingLegal = needed.filter((l) => poster.rules[l.role].legal && !isPlaced(l.name)).map((l) => l.role);
  add('legal', 'Every legal line is present', missingLegal.length ? [`Missing: ${list(missingLegal)}.`] : []);

  const missingOther = needed.filter((l) => !poster.rules[l.role].legal && !isPlaced(l.name)).map((l) => l.role);
  add('present', 'Nothing required is left out', missingOther.length ? [`Missing: ${list(missingOther)}.`] : []);

  const cropped = placed.filter((p) => p.layer.role !== 'background' && !contains(frame, p.box)).map((p) => p.layer.role);
  add('cropped', 'Nothing is cropped', cropped.length ? [`Runs off the edge: ${list(cropped)}. Move or shrink it to fit inside ${size.w} x ${size.h}.`] : []);

  const stretched = placed.filter((p) => Math.abs(p.box.h - (p.box.w * p.layer.box.h) / p.layer.box.w) > 1.5).map((p) => p.layer.role);
  add('stretched', 'Nothing is stretched', stretched.length ? [`Out of proportion: ${list(stretched)}.`] : []);

  const background = placed.find((p) => p.layer.role === 'background');
  if (background) {
    add('background', 'The background fills the frame', contains(background.box, frame) ? [] : ['The background leaves a gap at an edge.']);
    const enlarged = Math.round((background.box.w / background.layer.box.w) * 100);
    if (enlarged > 100) notes.push({ kind: 'look', text: `The background is enlarged to ${enlarged}% and may look soft.` });
    const hidden = background.box.w > size.w + 1 || background.box.h > size.h + 1;
    if (hidden && background.rule.notChecked) notes.push({ kind: 'not-checked', text: `Not checked: ${background.rule.notChecked}. Part of the background is cropped off here.` });
  }

  const billing = placed.find((p) => p.layer.role === 'billing block');
  const title = placed.find((p) => p.layer.role === 'title');
  const minShare = poster.rules['billing block'].billingShare;
  if (billing && title && minShare && isNeeded(poster.rules, 'billing block', size)) {
    const share = billingShare(billing.box.w, title.box.w);
    const need = minBillingWidth(title.box.w, minShare);
    add('billing', 'The billing block is large enough to read', share >= minShare ? [] : [
      `Its letters are ${Math.round(share * 100)}% of the title's letter height and need ${Math.round(minShare * 100)}%. Make the billing block at least ${need}px wide, or the title narrower.`,
    ]);
  }

  const covered = coveredAreas(size);
  if (covered.length) {
    const under = placed.filter((p) => p.rule.text && covered.some((area) => overlaps(area, p.box))).map((p) => p.layer.role);
    const areas = covered.map((a) => `x ${a.x} to ${right(a)}, y ${a.y} to ${bottom(a)}`).join('; ');
    add('covered', 'Text stays clear of the areas the app covers', under.length ? [`Under a covered area: ${list(under)}. Keep text out of ${areas}.`] : []);
  }

  const logo = placed.find((p) => p.rule.clearSpace !== undefined);
  if (logo) {
    const space = Math.round(logo.box.h * (logo.rule.clearSpace ?? 0));
    const close = placed.filter((p) => p !== logo && p.layer.role !== 'background' && overlaps(grow(logo.box, space), p.box)).map((p) => p.layer.role);
    add('logo', 'The logo has its clear space', close.length ? [`Too close to the logo: ${list(close)}. Leave ${space}px clear on every side.`] : []);
  }

  const texts = placed.filter((p) => p.rule.text);
  const clashes: string[] = [];
  texts.forEach((a, i) => texts.slice(i + 1).forEach((b) => { if (overlaps(a.box, b.box)) clashes.push(`${a.layer.role} and ${b.layer.role}`); }));
  add('overlap', 'No text sits on other text', clashes.length ? [`Overlapping: ${list(clashes)}.`] : []);

  return { checks, notes };
}

/** Ready: everything passed. Check this: passed, with something to look at. Needs you: a check failed. */
export function statusOf(checks: LayoutCheck[], notes: LayoutNote[]): LayoutStatus {
  if (checks.some((c) => !c.pass)) return 'needs';
  return notes.length ? 'check' : 'ready';
}

/** One station's turn at a size, and what the gate said about it. Shown to the designer as the story of the layout. */
export type Step = { by: 'code' | 'model' | 'look'; failed: string[]; cutOff?: boolean };
/** Everything the panel needs to show one size. */
export type SizeResult = {
  size: Size;
  covered: Box[];
  madeBy: 'code' | 'model';
  tries: number;
  steps: Step[];
  placements: (Placement & { id?: number })[];
  checks: LayoutCheck[];
  notes: LayoutNote[];
  status: LayoutStatus;
};

/* ---------- The rules reader's gate ----------
 * The model proposes rules from the client's document. Code checks each one before the designer
 * sees it, and again before it is saved. The designer confirms; nothing is used until they do. */

export type RuleProposal = RuleAnswer & {
  /** Reasons to look twice. Shown beside the rule. */
  flags: string[];
  /** true: the quoted words are in the document. false: they are not. null: the document could not be searched (a PDF or an image). */
  grounded: boolean | null;
};

export function checkRules(answers: RuleAnswer[], documentText: string | null): RuleProposal[] {
  const haystack = documentText === null ? null : squash(documentText);
  const seen = new Set<Role>();
  return answers.flatMap((answer): RuleProposal[] => {
    if (!(ROLES as readonly string[]).includes(answer.role) || seen.has(answer.role)) return []; // one rule per kind of layer
    seen.add(answer.role);
    const flags: string[] = [];
    const rule = { ...answer };
    // A share written as a percentage (15 for 15%) is read as one.
    if (rule.billingShare > 1) rule.billingShare = rule.billingShare / 100;
    if (rule.clearSpace > 2) rule.clearSpace = rule.clearSpace / 100;
    if (rule.appears !== 'always' && !(rule.pixels > 0 && rule.pixels <= 20000)) {
      flags.push('No pixel size was found for this rule, so it is set to appear on every size.');
      rule.appears = 'always';
      rule.pixels = 0;
    }
    if (rule.appears === 'always') rule.pixels = 0;
    if (rule.role !== 'billing block') rule.billingShare = 0;
    if (!(rule.billingShare >= 0 && rule.billingShare <= 1)) { flags.push('The letter size could not be read.'); rule.billingShare = 0; }
    if (!(rule.clearSpace >= 0 && rule.clearSpace <= 2)) { flags.push('The clear space could not be read.'); rule.clearSpace = 0; }
    if (rule.legal && rule.appears === 'may be left out under') flags.push('A legal line that may be left out. Check this against the document.');
    const needle = squash(rule.quote);
    const grounded = haystack === null ? null : needle.length > 0 && haystack.includes(needle);
    if (grounded === false) flags.push('These words were not found in the document.');
    if (needle.length === 0) flags.push('No words from the document were given for this rule.');
    return [{ ...rule, flags, grounded }];
  });
}
