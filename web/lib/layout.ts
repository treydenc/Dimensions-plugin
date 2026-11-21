// Geometry for the poster resize tool. Plain code, no AI. Shared by the server and the panel.
// Rules that can be written down live here and in checks.ts, not in a prompt.

export type Box = { x: number; y: number; w: number; h: number };

export const ROLES = ['background', 'key art', 'tagline', 'title', 'release date', 'billing block', 'studio logo', 'rating'] as const;
export type Role = (typeof ROLES)[number];

/** One layer of the poster: where it sits on the one sheet, what it is, and the client's rule for it. */
export type PosterLayer = { name: string; role: Role; box: Box; locked: boolean; rule: string; id?: number };
/** The one sheet. Layers run back to front. */
export type Poster = { title: string; canvas: { w: number; h: number }; layers: PosterLayer[]; rules: RuleSet; from: 'photoshop' | 'sample'; id?: number };
export type Size = { name: string; channel: string; w: number; h: number; safe?: string; note?: string };
/** Where one layer goes on a new size. A null box means the layer is left out. */
export type Placement = { name: string; box: Box | null; reason?: string };

/* ---------- The client's rules, in a form code can check ----------
 * BUILT_IN_RULES were written by hand from the sentences in the practice layers.json.
 * The rules reader replaces them, one kind of layer at a time, with what it read in the client's
 * document and the designer confirmed (lib/rules.ts). */

export type RoleRule = {
  legal: boolean;          // a legal line: must never go missing
  text: boolean;           // counts as text for covered areas and overlaps
  neededAbove?: number;    // must appear when the short side is above this many pixels
  optionalUnder?: number;  // may be left out when the short side is under this many pixels
  clearSpace?: number;     // empty space on all sides, as a share of the layer's height
  billingShare?: number;   // letters at least this share of the title's letter height
  notChecked?: string;     // a rule code cannot check, so the look at the picture is asked about it
  says?: string;           // the client's own words, when the rule came from their document
};
export type RuleSet = Record<Role, RoleRule>;

export const BUILT_IN_RULES: RuleSet = {
  background: { legal: false, text: false, notChecked: 'keep the moon in frame' },
  'key art': { legal: false, text: false },
  tagline: { legal: false, text: true, optionalUnder: 600 },
  title: { legal: false, text: true },
  'release date': { legal: true, text: true },
  'billing block': { legal: true, text: true, neededAbove: 900, billingShare: 0.15 },
  'studio logo': { legal: false, text: true, clearSpace: 0.5 },
  rating: { legal: true, text: true },
};

/** Letter height as a share of the layer's width, measured from the practice poster's layer images:
 *  title letters are 182px tall in a 1299px layer, the smallest billing line is 23px in a 1553px layer. */
const CAP_PER_WIDTH = { title: 182 / 1299, billing: 23 / 1553 };

/** The code path is only kept when the scaled poster fills at least this share of the frame. */
export const MIN_FILL = 0.8;

export const shortSide = (size: { w: number; h: number }) => Math.min(size.w, size.h);

export function isNeeded(rules: RuleSet, role: Role, size: Size): boolean {
  const rule = rules[role];
  if (rule.neededAbove !== undefined) return shortSide(size) > rule.neededAbove;
  if (rule.optionalUnder !== undefined) return shortSide(size) >= rule.optionalUnder;
  return true;
}

/** The parts of a size the platform draws over, from the "safe" notes in sizes.json. */
export function coveredAreas(size: Size): Box[] {
  if (size.name === 'Story') return [{ x: 0, y: 0, w: size.w, h: 250 }, { x: 0, y: size.h - 340, w: size.w, h: 340 }];
  if (size.name === 'Video thumbnail') return [{ x: size.w - 200, y: size.h - 60, w: 200, h: 60 }];
  return [];
}

/** Billing letter height as a share of title letter height, for two placed widths. */
export function billingShare(billingW: number, titleW: number): number {
  return (billingW * CAP_PER_WIDTH.billing) / (titleW * CAP_PER_WIDTH.title);
}
/** The narrowest the billing block may be beside a title of this width, for a given share. */
export function minBillingWidth(titleW: number, share: number): number {
  return Math.ceil((share * titleW * CAP_PER_WIDTH.title) / CAP_PER_WIDTH.billing);
}

export const right = (b: Box) => b.x + b.w;
export const bottom = (b: Box) => b.y + b.h;
export const overlaps = (a: Box, b: Box) => a.x < right(b) && b.x < right(a) && a.y < bottom(b) && b.y < bottom(a);
export const contains = (outer: Box, inner: Box) => inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && bottom(inner) <= bottom(outer);
export const grow = (b: Box, by: number): Box => ({ x: b.x - by, y: b.y - by, w: b.w + 2 * by, h: b.h + 2 * by });
const round = (b: Box): Box => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) });

/** A box of this width at the layer's own proportions. Used for every model answer, so nothing can be stretched. */
export function boxAt(layer: PosterLayer, x: number, y: number, w: number): Box {
  return round({ x, y, w, h: (w * layer.box.h) / layer.box.w });
}

/** The code path: shrink the whole poster to fit inside the frame, centred, with the background
 *  covering the frame. The billing block is raised to its smallest legal size where it is needed. */
export function scaleToFit(poster: Poster, size: Size): { placements: Placement[]; fill: number } {
  const { w: cw, h: ch } = poster.canvas;
  const s = Math.min(size.w / cw, size.h / ch);
  const ox = (size.w - cw * s) / 2;
  const oy = (size.h - ch * s) / 2;
  const cover = Math.max(size.w / cw, size.h / ch);
  const title = poster.layers.find((l) => l.role === 'title');

  const placements = poster.layers.map((layer): Placement => {
    if (layer.role === 'background') {
      const w = layer.box.w * cover;
      const h = layer.box.h * cover;
      return { name: layer.name, box: round({ x: (size.w - w) / 2, y: (size.h - h) / 2, w, h }) };
    }
    const box = { x: ox + layer.box.x * s, y: oy + layer.box.y * s, w: layer.box.w * s, h: layer.box.h * s };
    const share = poster.rules['billing block'].billingShare;
    if (layer.role === 'billing block' && title && share && isNeeded(poster.rules, layer.role, size)) {
      const need = minBillingWidth(Math.round(title.box.w * s), share);
      if (box.w < need) {
        // Grow from the bottom centre, so it does not push into the logo below it.
        const h = (need * layer.box.h) / layer.box.w;
        return { name: layer.name, box: round({ x: box.x + box.w / 2 - need / 2, y: box.y + box.h - h, w: need, h }) };
      }
    }
    return { name: layer.name, box: round(box) };
  });
  return { placements, fill: (cw * s * ch * s) / (size.w * size.h) };
}
