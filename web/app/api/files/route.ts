// Files a person can show the model. GET lists what is in data/; POST adds to data/uploads/.
import { handle } from '@/lib/http';
import { listDataFiles, saveUpload } from '@/lib/loaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => ({ files: await listDataFiles() }));
}

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const added: string[] = [];
    for (const entry of form.getAll('file')) {
      if (typeof entry === 'string') continue;
      added.push(await saveUpload(entry.name, new Uint8Array(await entry.arrayBuffer())));
    }
    if (added.length === 0) throw new Error('No file arrived. Try again.');
    return { added, files: await listDataFiles() };
  });
}
