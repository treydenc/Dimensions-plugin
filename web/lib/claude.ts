// The only file that talks to the Anthropic API.
// Routes call askClaude() for one structured answer, or runAgent() for a capped tool loop.
// With no ANTHROPIC_API_KEY set, both return the sample you pass in, so the UI always works.
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
  schema: S;
  sample: z.input<S>;
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; source: Source }> {
  if (!hasKey()) return { data: opts.schema.parse(opts.sample), source: 'sample' };

  const content: Anthropic.MessageParam['content'] = opts.files?.length
    ? [...(await toContentBlocks(opts.files)), { type: 'text', text: opts.prompt }]
    : opts.prompt;

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

export type AgentTool = {
  name: string;
  description: string;
  schema: z.ZodType;
  run: (input: any) => Promise<string> | string;
};
export type AgentStep = { tool: string; input: unknown; result: string };

/** Claude decides which tool to call next. Hard-capped so it cannot run away in a demo. */
export async function runAgent(opts: {
  system?: string;
  prompt: string;
  tools: AgentTool[];
  maxSteps?: number;
  sample: { answer: string; steps: AgentStep[] };
}): Promise<{ answer: string; steps: AgentStep[]; source: Source; hitLimit: boolean }> {
  if (!hasKey()) return { ...opts.sample, source: 'sample', hitLimit: false };

  const maxSteps = opts.maxSteps ?? 5;
  const steps: AgentStep[] = [];
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.prompt }];
  const tools: Anthropic.Tool[] = opts.tools.map((t) => {
    const { $schema: _drop, ...schema } = z.toJSONSchema(t.schema) as Record<string, unknown>;
    return { name: t.name, description: t.description, input_schema: schema as Anthropic.Tool.InputSchema };
  });
  const textOf = (m: Anthropic.Message) =>
    m.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();

  for (let turn = 0; turn <= maxSteps; turn++) {
    const outOfSteps = turn === maxSteps;
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: opts.system,
      messages,
      tools,
      // On the last turn Claude must answer with what it has.
      tool_choice: outOfSteps ? { type: 'none' } : { type: 'auto' },
    });
    const calls = res.content.flatMap((b) => (b.type === 'tool_use' ? [b] : []));
    if (calls.length === 0) return { answer: textOf(res), steps, source: 'claude', hitLimit: outOfSteps };

    messages.push({ role: 'assistant', content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const call of calls) {
      const tool = opts.tools.find((t) => t.name === call.name);
      let result: string;
      let failed = false;
      try {
        if (!tool) throw new Error(`Unknown tool: ${call.name}`);
        result = await tool.run(tool.schema.parse(call.input));
      } catch (err) {
        failed = true;
        result = err instanceof Error ? err.message : String(err);
      }
      steps.push({ tool: call.name, input: call.input, result: result.slice(0, 600) });
      results.push({ type: 'tool_result', tool_use_id: call.id, content: result, is_error: failed });
    }
    messages.push({ role: 'user', content: results });
  }
  return { answer: '', steps, source: 'claude', hitLimit: true };
}
