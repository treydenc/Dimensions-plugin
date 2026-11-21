// The gate: plain code that checks what the model proposed. No AI in this file.
// Rule of thumb: if you can write the rule down, it belongs here, not in a prompt.
import type { ActionItem, ReplyDraft } from './schemas';

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export type CheckedItem = ActionItem & { grounded: boolean };

/** An item only counts if its quote really appears in the source text. Catches invented tasks. */
export function checkItems(source: string, items: ActionItem[]): CheckedItem[] {
  const haystack = squash(source);
  return items.map((item) => {
    const needle = squash(item.quote);
    return { ...item, grounded: needle.length > 0 && haystack.includes(needle) };
  });
}

export type Check = { rule: string; pass: boolean };

export function checkReply(reply: ReplyDraft): Check[] {
  const words = reply.body.split(/\s+/).filter(Boolean).length;
  return [
    { rule: 'Under 120 words', pass: words <= 120 },
    { rule: 'Has a subject line', pass: reply.subject.trim().length > 0 },
    { rule: 'Makes no date promises', pass: !/\b(by|before|on)\s+(mon|tue|wed|thu|fri|sat|sun|tomorrow|eod|end of day)/i.test(reply.body) },
  ];
}
