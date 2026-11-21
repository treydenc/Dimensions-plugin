// A rule read from the client's document, in two forms: the sentence the designer reads,
// and the form the checks use. Plain code, shared by the server and the panel.
import { BUILT_IN_RULES, type RoleRule, type RuleSet } from './layout';
import type { RuleAnswer } from './schemas';

/** One rule in plain words, built from its checked fields, never from the model's prose. */
export function describe(rule: RuleAnswer): string {
  const parts = [
    rule.legal ? 'Legal.' : '',
    rule.appears === 'always' ? 'Must appear on every size.'
      : rule.appears === 'above' ? `Must appear when the short side is above ${rule.pixels}px.`
      : `May be left out when the short side is under ${rule.pixels}px.`,
    rule.billingShare > 0 ? `Letters at least ${Math.round(rule.billingShare * 100)}% of the title's letter height.` : '',
    rule.clearSpace > 0 ? `Clear space of ${Math.round(rule.clearSpace * 100)}% of its height on all sides.` : '',
    rule.cannotCheck ? `Code cannot check: ${rule.cannotCheck}. The look at the picture is asked about it.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** The same sentence for a rule already in use. */
export function describeRule(rule: RoleRule): string {
  return describe({
    role: 'title', quote: '', legal: rule.legal,
    appears: rule.neededAbove !== undefined ? 'above' : rule.optionalUnder !== undefined ? 'may be left out under' : 'always',
    pixels: rule.neededAbove ?? rule.optionalUnder ?? 0,
    clearSpace: rule.clearSpace ?? 0,
    billingShare: rule.billingShare ?? 0,
    cannotCheck: rule.notChecked ?? '',
  });
}

/** Confirmed rules laid over the built-in ones. A kind of layer with no confirmed rule keeps the built-in one. */
export function toRuleSet(confirmed: RuleAnswer[]): RuleSet {
  const rules: RuleSet = { ...BUILT_IN_RULES };
  for (const c of confirmed) {
    rules[c.role] = {
      legal: c.legal,
      text: BUILT_IN_RULES[c.role].text, // what counts as text is about the layer, not the client's rule
      neededAbove: c.appears === 'above' ? c.pixels : undefined,
      optionalUnder: c.appears === 'may be left out under' ? c.pixels : undefined,
      clearSpace: c.clearSpace > 0 ? c.clearSpace : undefined,
      billingShare: c.billingShare > 0 ? c.billingShare : undefined,
      notChecked: c.cannotCheck.trim() || undefined,
      says: c.quote.trim() || undefined,
    };
  }
  return rules;
}
