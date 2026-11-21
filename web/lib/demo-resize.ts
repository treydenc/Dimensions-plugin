// Shared sample content for the three form demos (web app, plug-in, desktop app).
// The same tool in three forms: a key visual resized to a pack of sizes, checked against brand rules.
export const TOOL_NAME = 'Resize';

export type SizeStatus = 'ready' | 'working' | 'review' | 'failed';

export const JOB = { name: 'Spring campaign', source: 'key-visual.psd', sourceSize: '1080 × 1350', updated: '2 min ago' };

export const SIZES: { id: string; name: string; channel: string; w: number; h: number; status: SizeStatus; note?: string }[] = [
  { id: 'story', name: 'Story', channel: 'Social', w: 1080, h: 1920, status: 'ready' },
  { id: 'square', name: 'Square', channel: 'Social', w: 1080, h: 1080, status: 'ready' },
  { id: 'landscape', name: 'Landscape', channel: 'Social', w: 1920, h: 1080, status: 'review', note: 'Headline sits close to the safe margin.' },
  { id: 'leaderboard', name: 'Leaderboard', channel: 'Display', w: 728, h: 90, status: 'failed', note: 'Headline falls below the minimum type size.' },
  { id: 'portrait', name: 'Portrait', channel: 'Social', w: 1080, h: 1350, status: 'working' },
  { id: 'banner', name: 'Banner', channel: 'Display', w: 1200, h: 628, status: 'ready' },
];

export const RULES = { safeMargin: 4, minType: 14, lockLogo: true, allowFill: false };

export const CHECKS: { rule: string; pass: boolean; where?: string }[] = [
  { rule: 'Logo keeps its clear space', pass: true },
  { rule: 'Nothing crosses the safe margin', pass: true },
  { rule: 'Type is at least 14px', pass: false, where: 'Leaderboard' },
  { rule: 'Legal line is present', pass: true },
];

export const LAYERS: { name: string; role: 'background' | 'hero' | 'headline' | 'logo' | 'legal'; locked: boolean }[] = [
  { name: 'Background', role: 'background', locked: false },
  { name: 'Product shot', role: 'hero', locked: true },
  { name: 'Headline', role: 'headline', locked: false },
  { name: 'Logo', role: 'logo', locked: true },
  { name: 'Legal line', role: 'legal', locked: true },
];

export const PASSED = SIZES.filter((s) => s.status === 'ready').length;
