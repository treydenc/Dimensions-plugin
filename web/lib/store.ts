// Tiny JSON-file store. Good for a local demo with small data; swap for a database later.
// File lives at data/store.json (gitignored).
import { promises as fs } from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'data', 'store.json');
type Db = Record<string, unknown[]>;

async function read(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Db;
  } catch {
    return {};
  }
}
async function write(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

export async function list<T>(collection: string): Promise<T[]> {
  return ((await read())[collection] ?? []) as T[];
}

export async function add<T extends object>(collection: string, record: T) {
  const db = await read();
  const saved = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...record };
  db[collection] = [...(db[collection] ?? []), saved];
  await write(db);
  return saved;
}

export async function update<T extends object>(collection: string, id: string, patch: Partial<T>) {
  const db = await read();
  const rows = (db[collection] ?? []) as Array<{ id: string }>;
  db[collection] = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
  await write(db);
}
