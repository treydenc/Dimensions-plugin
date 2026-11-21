// Read whatever lands in data/: text, markdown, JSON, CSV, images.
// Every path is resolved inside data/ so a tool call can never read outside it.
import type Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'data');
const IMAGE_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
};

function inData(name: string) {
  const full = path.resolve(DATA, name);
  if (full !== DATA && !full.startsWith(DATA + path.sep)) throw new Error('That file is outside the data folder.');
  return full;
}

export async function listFiles(): Promise<string[]> {
  const entries = await fs.readdir(DATA, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name !== 'store.json' && !e.name.startsWith('.'))
    .map((e) => path.relative(DATA, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
    .sort();
}

export const readText = (name: string) => fs.readFile(inData(name), 'utf8');

export async function readJson<T = unknown>(name: string): Promise<T> {
  return JSON.parse(await readText(name)) as T;
}

/** CSV with a header row. Handles quoted fields, commas and line breaks inside quotes. */
export async function readCsv(name: string): Promise<Record<string, string>[]> {
  const text = (await readText(name)).replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v !== '')) rows.push(row);
  const [header = [], ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

/** An image as a content block you can put straight into a Claude message. */
export async function readImageBlock(name: string) {
  const media_type = IMAGE_TYPES[path.extname(name).toLowerCase()];
  if (!media_type) throw new Error(`Not a supported image: ${name}`);
  const data = (await fs.readFile(inData(name))).toString('base64');
  return { type: 'image' as const, source: { type: 'base64' as const, media_type, data } };
}

/* ---------- Files a person adds ---------- */

const TEXT_TYPES = new Set(['.txt', '.md', '.csv', '.json', '.html']);
export const ACCEPTED = ['.pdf', ...Object.keys(IMAGE_TYPES), ...TEXT_TYPES];
export const MAX_UPLOAD = 20 * 1024 * 1024;

export type DataFile = { name: string; size: number; kind: 'pdf' | 'image' | 'text' | 'other' };

const kindOf = (name: string): DataFile['kind'] => {
  const ext = path.extname(name).toLowerCase();
  return ext === '.pdf' ? 'pdf' : IMAGE_TYPES[ext] ? 'image' : TEXT_TYPES.has(ext) ? 'text' : 'other';
};

export async function listDataFiles(): Promise<DataFile[]> {
  const names = await listFiles();
  return Promise.all(names.map(async (name) => ({ name, size: (await fs.stat(inData(name))).size, kind: kindOf(name) })));
}

/** Save an uploaded file into data/uploads/. Returns its name relative to data/. */
export async function saveUpload(original: string, bytes: Uint8Array): Promise<string> {
  const base = path.basename(original).replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  if (!ACCEPTED.includes(path.extname(base).toLowerCase())) throw new Error(`That file type is not supported: ${base}`);
  if (bytes.byteLength > MAX_UPLOAD) throw new Error(`${base} is larger than 20 MB.`);
  await fs.mkdir(inData('uploads'), { recursive: true });
  await fs.writeFile(inData(`uploads/${base}`), bytes);
  return `uploads/${base}`;
}

/** Turn chosen files into content blocks Claude can read: PDFs and images as they are, text inline. */
export async function toContentBlocks(names: string[]): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const name of names) {
    const kind = kindOf(name);
    if (kind === 'pdf') {
      const data = (await fs.readFile(inData(name))).toString('base64');
      blocks.push({ type: 'document', title: name, source: { type: 'base64', media_type: 'application/pdf', data } });
    } else if (kind === 'image') {
      blocks.push(await readImageBlock(name));
    } else if (kind === 'text') {
      blocks.push({ type: 'text', text: `File: ${name}\n\n${(await readText(name)).slice(0, 60000)}` });
    } else {
      throw new Error(`That file type cannot be read: ${name}`);
    }
  }
  return blocks;
}
