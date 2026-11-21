// The only file that talks to the Anthropic API.
// Routes call askClaude() for one structured answer.
// With no ANTHROPIC_API_KEY set, it returns the sample you pass in, so the UI always works.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { toContentBlocks } from './loaders';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
export const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export type Source = 'claude' | 'sample';

/** One call in, one validated object out. The schema is both the instruction and the check. */
export async function askClaude<S extends z.ZodType>(opts: {
  system?: string;
  prompt: string;
  /** Names of files in data/ to show Claude with the prompt: PDFs, images, text. */
  files?: string[];
  /** Pictures made in the app, as base64, shown to Claude with the prompt. */
  images?: { mediaType: 'image/png' | 'image/jpeg'; data: string }[];
  schema: S;
  sample: z.input<S>;
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; source: Source }> {
  if (!hasKey()) return { data: opts.schema.parse(opts.sample), source: 'sample' };

  const blocks: Anthropic.ContentBlockParam[] = [
    ...(opts.files?.length ? await toContentBlocks(opts.files) : []),
    ...(opts.images ?? []).map((i) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: i.mediaType, data: i.data } })),
  ];
  const content: Anthropic.MessageParam['content'] = blocks.length ? [...blocks, { type: 'text', text: opts.prompt }] : opts.prompt;

  const message = await getClient().messages.parse({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(opts.schema) },
  });
  if (message.parsed_output == null) {
    throw new Error(`Claude returned no structured answer (stop reason: ${message.stop_reason}).`);
  }
  return { data: opts.schema.parse(message.parsed_output), source: 'claude' };
}
