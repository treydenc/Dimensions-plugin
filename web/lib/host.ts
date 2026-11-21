// The bridge to Photoshop. When the tool runs inside the plug-in's WebView, Photoshop's side
// (plugin/index.js) answers the messages sent from here. In a normal browser tab there is no
// host, inPhotoshop() is false, and ask() rejects, so the tool can fall back to file input.
//
// Every message is a JSON string: { source, type, id?, payload?, error? }.
//   ask('ping')         -> { app, version }
//   ask('getDocument')  -> PsDocument, or null when no document is open
// Add a command in two places: a case in plugin/index.js, and a call to ask() here.

export type PsLayer = {
  id: number; name: string; kind: string; visible: boolean;
  bounds: { left: number; top: number; right: number; bottom: number } | null;
  layers?: PsLayer[];
};
export type PsDocument = { id: number; title: string; width: number; height: number; resolution: number; layers: PsLayer[] };

type Message = { source: 'host' | 'tool'; type: string; id?: string; payload?: unknown; error?: string };

declare global {
  interface Window { uxpHost?: { postMessage: (message: unknown) => void } }
}

export const inPhotoshop = () => typeof window !== 'undefined' && !!window.uxpHost;

const waiting = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();

function parse(data: unknown): Message | null {
  try {
    const m = typeof data === 'string' ? JSON.parse(data) : data;
    return m && typeof m === 'object' && (m as Message).source === 'host' ? (m as Message) : null;
  } catch {
    return null;
  }
}

/** Start listening for Photoshop's replies. Call once; returns a function that stops it. */
export function listen(): () => void {
  const onMessage = (e: MessageEvent) => {
    const m = parse(e.data);
    if (!m) return;
    if (m.type === 'hello') { void ask('ping').catch(() => {}); return; } // the panel just loaded this page
    const pending = m.id ? waiting.get(m.id) : undefined;
    if (!pending || !m.id) return;
    waiting.delete(m.id);
    if (m.error) pending.reject(new Error(m.error)); else pending.resolve(m.payload);
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

/** Ask Photoshop for something and wait for its answer. */
export function ask<T = unknown>(type: string, payload?: unknown, timeoutMs = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!inPhotoshop()) { reject(new Error('Not running inside Photoshop.')); return; }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error(`Photoshop did not answer "${type}".`)); }, timeoutMs);
    waiting.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value as T); },
      reject: (reason) => { clearTimeout(timer); reject(reason); },
    });
    window.uxpHost!.postMessage(JSON.stringify({ source: 'tool', type, id, payload } satisfies Message));
  });
}
