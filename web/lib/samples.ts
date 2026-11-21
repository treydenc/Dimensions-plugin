// Sample output: what the app shows when no API key is set.

/* ---------- Poster resize ----------
 * Sample layouts, shown when no API key is set. Story's first answer leaves text under the areas
 * the app covers on purpose: it shows the gate catching a bad layout and the one retry fixing it. */
type SampleLayer = { name: string; placed: boolean; x: number; y: number; w: number; reason: string };
const at = (name: string, x: number, y: number, w: number, reason: string): SampleLayer => ({ name, placed: true, x, y, w, reason });
const out = (name: string, reason: string): SampleLayer => ({ name, placed: false, x: 0, y: 0, w: 0, reason });

export const SAMPLE_LAYOUTS: Record<string, { first: { layers: SampleLayer[] }; retry?: { layers: SampleLayer[] } }> = {
  Story: {
    first: { layers: [
      at('background', -100, 0, 1280, 'Covers the frame with the moon kept in view.'),
      at('key-art', 80, 340, 450, 'The lighthouse stays whole on the left.'),
      at('tagline', 90, 150, 900, 'Runs across the top.'),
      at('title', 210, 800, 660, 'Sits over the base of the lighthouse, as on the one sheet.'),
      at('date', 290, 1150, 500, 'Directly under the title.'),
      at('billing', 65, 1640, 950, 'Full width near the bottom.'),
      at('studio-logo', 65, 1800, 180, 'Bottom left corner.'),
      at('rating', 910, 1801, 105, 'Bottom right corner.'),
    ] },
    retry: { layers: [
      at('background', -100, 0, 1280, 'Covers the frame with the moon kept in view.'),
      at('key-art', 80, 340, 450, 'The lighthouse stays whole on the left.'),
      at('tagline', 90, 262, 900, 'Just below the area the app covers at the top.'),
      at('title', 210, 800, 660, 'Sits over the base of the lighthouse, as on the one sheet.'),
      at('date', 290, 1150, 500, 'Directly under the title.'),
      at('billing', 65, 1235, 950, 'Moved up, clear of the area the app covers at the bottom.'),
      at('studio-logo', 65, 1460, 180, 'Left, above the covered area, with its clear space.'),
      at('rating', 910, 1461, 105, 'Right, level with the logo.'),
    ] },
  },
  Square: {
    first: { layers: [
      at('background', 0, -200, 1080, 'Cropped to the sky and the horizon.'),
      at('key-art', 40, 130, 420, 'The lighthouse fills the left side.'),
      at('tagline', 90, 50, 900, 'Runs across the top.'),
      at('title', 500, 470, 500, 'Stacked on the right, beside the lighthouse.'),
      at('date', 550, 740, 400, 'Under the title.'),
      at('billing', 180, 880, 720, 'Centred below everything, at its smallest legal size.'),
      at('studio-logo', 40, 1010, 150, 'Bottom left, with its clear space.'),
      at('rating', 950, 1010, 90, 'Bottom right.'),
    ] },
  },
  'Video thumbnail': {
    first: { layers: [
      at('background', 0, -480, 1280, 'Cropped to a band of sky with the moon in it.'),
      at('key-art', 60, 60, 372, 'The lighthouse stands full height on the left.'),
      at('tagline', 460, 40, 760, 'Across the top right.'),
      at('title', 520, 260, 640, 'Large on the right, so it reads at thumbnail size.'),
      at('date', 660, 600, 400, 'Under the title.'),
      out('billing', 'Not required under 900px on the short side.'),
      at('studio-logo', 470, 640, 150, 'Bottom, left of the date, with its clear space.'),
      at('rating', 1150, 580, 90, 'Right edge, above the duration badge.'),
    ] },
  },
};

/** Shown when no API key is set: the look finds nothing. */
export const SAMPLE_REVIEW = { rules: [] as { rule: string; kept: boolean; note: string }[], issues: [] as { layer: string; problem: string; fix: string }[] };

/** Shown when no API key is set: the rules of the practice poster, as the reader would return them. */
export const SAMPLE_RULES = { rules: [
  { role: 'background' as const, quote: 'The background may be cropped or extended. Keep the moon in frame.', legal: false, appears: 'always' as const, pixels: 0, clearSpace: 0, billingShare: 0, cannotCheck: 'keep the moon in frame' },
  { role: 'key art' as const, quote: 'The lighthouse may be scaled and moved but never cropped', legal: false, appears: 'always' as const, pixels: 0, clearSpace: 0, billingShare: 0, cannotCheck: 'the whole lighthouse and its lamp stay visible' },
  { role: 'tagline' as const, quote: 'The tagline may be dropped on sizes under 600 pixels on the short side.', legal: false, appears: 'may be left out under' as const, pixels: 600, clearSpace: 0, billingShare: 0, cannotCheck: '' },
  { role: 'title' as const, quote: 'The title is never distorted and never cropped.', legal: false, appears: 'always' as const, pixels: 0, clearSpace: 0, billingShare: 0, cannotCheck: '' },
  { role: 'release date' as const, quote: 'The release date must appear on every size.', legal: true, appears: 'always' as const, pixels: 0, clearSpace: 0, billingShare: 0, cannotCheck: '' },
  { role: 'billing block' as const, quote: 'The billing block must appear on every size above 900 pixels on the short side, at a cap height of at least 15% of the title cap height.', legal: true, appears: 'above' as const, pixels: 900, clearSpace: 0, billingShare: 0.15, cannotCheck: '' },
  { role: 'studio logo' as const, quote: 'Keep clear space of half its height on all sides.', legal: false, appears: 'always' as const, pixels: 0, clearSpace: 0.5, billingShare: 0, cannotCheck: '' },
  { role: 'rating' as const, quote: 'The rating must appear on every size.', legal: true, appears: 'always' as const, pixels: 0, clearSpace: 0, billingShare: 0, cannotCheck: '' },
] };
