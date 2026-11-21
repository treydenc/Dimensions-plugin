// Pattern 3: Claude chooses which tool to use next, inside a hard step limit.
// Use this only when the steps cannot be known in advance.
import { z } from 'zod';
import { runAgent, type AgentTool } from '@/lib/claude';
import { handle } from '@/lib/http';
import { listFiles, readText } from '@/lib/loaders';
import { AGENT_SYSTEM } from '@/lib/prompts';
import { SAMPLE_AGENT } from '@/lib/samples';
import { RunInput } from '@/lib/schemas';

export const runtime = 'nodejs';

// Read-only tools. Anything that changes data should wait for a person's yes.
const tools: AgentTool[] = [
  {
    name: 'list_files',
    description: 'List the files in the project data folder.',
    schema: z.object({}),
    run: async () => (await listFiles()).join('\n') || 'No files.',
  },
  {
    name: 'read_file',
    description: 'Read one text file from the data folder by name.',
    schema: z.object({ name: z.string().describe('File name as returned by list_files') }),
    run: async ({ name }: { name: string }) => (await readText(name)).slice(0, 12000),
  },
];

export async function POST(req: Request) {
  return handle(async () => {
    const { text } = RunInput.parse(await req.json());
    return runAgent({
      system: AGENT_SYSTEM,
      prompt: text,
      tools,
      maxSteps: 5,
      sample: SAMPLE_AGENT,
    });
  });
}
