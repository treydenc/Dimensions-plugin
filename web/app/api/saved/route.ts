// What a person approved. The store is the record of human decisions, not of model output.
import { z } from 'zod';
import { handle } from '@/lib/http';
import { ActionItem } from '@/lib/schemas';
import { add, list } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => ({ saved: await list('approved') }));
}

export async function POST(req: Request) {
  return handle(async () => {
    const { items } = z.object({ items: z.array(ActionItem).min(1, 'Pick at least one item.') }).parse(await req.json());
    for (const item of items) await add('approved', item);
    return { count: items.length };
  });
}
