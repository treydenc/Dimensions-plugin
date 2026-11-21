// The client's rules and the campaign's sizes, read from data/poster. Server only.
// First pass: the practice files. Second pass: what the rules reader proposed and the designer confirmed.
import { BUILT_IN_RULES, ROLES, type PosterLayer, type Role, type RuleSet, type Size } from './layout';
import { readJson } from './loaders';
import { toRuleSet } from './rules';
import type { RuleAnswer } from './schemas';
import { add, list } from './store';

type RulesFile = { title: string; canvas: { w: number; h: number }; layers: { name: string; role: string; box: [number, number, number, number]; locked: boolean; rule: string }[] };
type SizesFile = { sizes: Size[] };

const isRole = (role: string): role is Role => (ROLES as readonly string[]).includes(role);
export const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export async function loadRules() {
  const [rules, sizes] = await Promise.all([readJson<RulesFile>('poster/layers.json'), readJson<SizesFile>('poster/sizes.json')]);
  const layers: PosterLayer[] = rules.layers.map((l) => {
    if (!isRole(l.role)) throw new Error(`The rules name a kind of layer this tool does not know: ${l.role}.`);
    return { name: l.name, role: l.role, box: { x: l.box[0], y: l.box[1], w: l.box[2], h: l.box[3] }, locked: l.locked, rule: l.rule };
  });
  const active = await activeRules();
  return { title: rules.title, canvas: rules.canvas, layers, sizes: sizes.sizes, rules: active.rules, rulesFrom: active.from, confirmed: active.confirmed };
}

/* ---------- The rules in use ----------
 * The latest record in the store decides: a confirmed set from a client document, or back to the built-in ones.
 * One set at a time for now, not one per document. */
type Saved = { file: string | null; rules: RuleAnswer[] };

export async function activeRules(): Promise<{ rules: RuleSet; from: string | null; confirmed: Role[] }> {
  const latest = (await list<Saved>('rules')).at(-1);
  if (!latest || !latest.file || latest.rules.length === 0) return { rules: BUILT_IN_RULES, from: null, confirmed: [] };
  return { rules: toRuleSet(latest.rules), from: latest.file, confirmed: latest.rules.map((r) => r.role) };
}
export const saveRules = (file: string, rules: RuleAnswer[]) => add<Saved>('rules', { file, rules });
export const clearRules = () => add<Saved>('rules', { file: null, rules: [] });
