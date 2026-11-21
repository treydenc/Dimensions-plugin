'use client';
// The poster resize tool, as a plug-in panel. One sheet in, a first set of sizes out.
// Each button is a yes: "Propose layouts" reads the document and asks for layouts. Each size then
// has its own "Make in Photoshop", the only thing that changes anything, and its own "Try again".
// After a layout arrives, the model looks at a picture of it once and may send it back once.
import { useEffect, useRef, useState } from 'react';
import {
  Busy, CheckRow, Chip, Count, EmptyState, ErrorNote, FileDrop, NoteLine, PanelSection, Preview, RowList, Skeleton, SmallButton, StarterLinks, StatusMark, TickRow, Undecided,
} from '@/components/ui';
import { HostFrame, PanelRow, PluginShell } from '@/components/shells/PluginShell';
import type { LayoutStatus, RuleProposal, SizeResult } from '@/lib/checks';
import { ask, inPhotoshop, makeSizes, type PsDocument, type PsLayer } from '@/lib/host';
import type { Size } from '@/lib/layout';
import { plan } from '@/plan';

type Setup = {
  title: string;
  sizes: (Size & { ready: boolean })[];
  layers: { name: string; role: string; rule: string; legal: boolean; fromClient: boolean; says: string | null }[];
  /** The client document the rules in use came from, or null for the built-in practice rules. */
  rulesFrom: string | null;
  mode: 'claude' | 'sample';
};
type Proposal = RuleProposal & { summary: string };
/** Reading the client's document: the model proposes, the designer ticks, only ticked rules are used. */
type Reader = { state: 'idle' } | { state: 'reading'; name: string } | { state: 'failed'; message: string }
  | { state: 'proposed'; file: string; proposals: Proposal[]; ticked: string[]; saving: boolean };
const fileName = (file: string) => file.replace(/^uploads\//, '');
type Doc = { id: number; title: string; width: number; height: number; layers: { id: number; name: string; box: { x: number; y: number; w: number; h: number } }[] } | null;
type Answer = { poster: { title: string; canvas: { w: number; h: number }; from: 'photoshop' | 'sample'; id: number | null }; results: SizeResult[]; mode: 'claude' | 'sample' };
type Review = { rules: { rule: string; kept: boolean; note: string }[]; issues: { layer: string; problem: string; fix: string }[] };
type Load = { state: 'working' } | { state: 'failed'; message: string } | { state: 'done'; setup: Setup };
type Run = { state: 'idle' } | { state: 'working'; sizes: string[] } | { state: 'failed'; message: string } | { state: 'done'; answer: Answer };
/** What happened when one size was sent to Photoshop, or tried again. Kept per size. */
type Act = { state: 'making' } | { state: 'retrying' } | { state: 'made' } | { state: 'failed'; message: string };
/** The look at the picture of one size. "fixed" means the first look sent it back and this is the second. */
type Look = { state: 'looking' } | { state: 'fixing' } | { state: 'failed'; message: string } | ({ state: 'done'; fixed: boolean } & Review);

const START_TICKED = ['Story', 'Square', 'Video thumbnail'];
const STATUS: Record<LayoutStatus, { word: string; tone: 'success' | 'warning' | 'error' }> = {
  ready: { word: 'Ready', tone: 'success' },
  check: { word: 'Check this', tone: 'warning' },
  needs: { word: 'Needs you', tone: 'error' },
};
const sentence = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

async function getJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Something went wrong. Try again.');
  return json as T;
}

/** Photoshop's layer tree as a flat list with boxes, for matching to the rules by name. */
function flatten(layers: PsLayer[]): NonNullable<Doc>['layers'] {
  return layers.flatMap((l) => [
    ...(l.bounds && l.bounds.right > l.bounds.left && l.bounds.bottom > l.bounds.top
      ? [{ id: l.id, name: l.name, box: { x: l.bounds.left, y: l.bounds.top, w: l.bounds.right - l.bounds.left, h: l.bounds.bottom - l.bounds.top } }]
      : []),
    ...(l.layers ? flatten(l.layers) : []),
  ]);
}

const layerImage = (name: string) => `/poster/layers/${name}.png`;

/** A small picture of one layout, drawn here in the panel, as base64 JPEG. This is what the model looks at. */
async function picture(r: SizeResult): Promise<string> {
  const scale = Math.min(1, 1024 / Math.max(r.size.w, r.size.h));
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.round(r.size.w * scale);
  canvas.height = Math.round(r.size.h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This window cannot draw the picture.');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const p of r.placements) {
    if (!p.box) continue;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`The picture of the ${p.name} layer could not be loaded.`));
      el.src = layerImage(p.name);
    });
    ctx.drawImage(img, p.box.x * scale, p.box.y * scale, p.box.w * scale, p.box.h * scale);
  }
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? '';
}

/** The label a size carries, once the checks and the look are both counted. Code decides "Needs you". */
function verdict(r: SizeResult, look: Look | undefined): LayoutStatus {
  if (r.status === 'needs') return 'needs';
  if (look?.state !== 'done') return 'check';
  const rulesKept = look.rules.every((x) => x.kept);
  const open = r.notes.filter((n) => !(rulesKept && n.kind === 'not-checked'));
  return open.length || look.issues.length || !rulesKept ? 'check' : 'ready';
}

/** Who placed the layers, in a few words. */
function madeBy(r: SizeResult): string {
  if (r.madeBy === 'code') return 'Scaled to fit by code';
  return r.steps.filter((s) => s.by === 'model').length > 1 ? 'Composed by AI, second try' : 'Composed by AI';
}

export default function Home() {
  const [load, setLoad] = useState<Load>({ state: 'working' });
  const [ticked, setTicked] = useState<string[]>(START_TICKED);
  const [run, setRun] = useState<Run>({ state: 'idle' });
  const [acts, setActs] = useState<Record<string, Act>>({});
  const [looks, setLooks] = useState<Record<string, Look>>({});
  const [reader, setReader] = useState<Reader>({ state: 'idle' });
  // True inside the Photoshop plug-in's WebView: the panel then fills the window.
  const [hosted, setHosted] = useState(false);
  // The document as last read, so one size can be sent back without reading again.
  const lastDoc = useRef<Doc>(null);
  // Counts whole runs, so an answer from an earlier run is dropped.
  const runId = useRef(0);

  const loadSetup = () => getJson<Setup>('/api/layout')
    .then((setup) => setLoad({ state: 'done', setup }))
    .catch((err) => setLoad({ state: 'failed', message: sentence(err, 'Could not load the sizes. Check the tool is running, then reload.') }));

  useEffect(() => {
    setHosted(inPhotoshop());
    void loadSetup();
  }, []);

  // Layouts made under the old rules no longer stand once the rules change.
  async function rulesChanged() {
    runId.current++;
    setRun({ state: 'idle' });
    setActs({});
    setLooks({});
    await loadSetup();
  }

  // The designer adds the client's own document. The model reads it and proposes rules. Nothing is used yet.
  async function readRules(files: File[]) {
    const picked = files[0];
    if (!picked) return;
    setReader({ state: 'reading', name: picked.name });
    try {
      const body = new FormData();
      body.append('file', picked);
      const res = await fetch('/api/files', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'That file could not be added. Try a PDF, an image or a text file.');
      const file = (json.added as string[] | undefined)?.[0];
      if (!file) throw new Error('That file did not arrive. Try again.');
      const read = await getJson<{ file: string; proposals: Proposal[] }>('/api/rules', { file });
      setReader({ state: 'proposed', file: read.file, proposals: read.proposals, ticked: [], saving: false });
    } catch (err) {
      setReader({ state: 'failed', message: sentence(err, 'The document could not be read. Try again.') });
    }
  }

  // Only the rules the designer ticked are saved and used.
  async function saveTicked() {
    if (reader.state !== 'proposed') return;
    setReader({ ...reader, saving: true });
    try {
      const rules = reader.proposals.filter((p) => reader.ticked.includes(p.role)).map(({ flags: _f, grounded: _g, summary: _s, ...rule }) => rule);
      const res = await fetch('/api/rules', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file: reader.file, rules }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'The rules could not be saved. Try again.');
      setReader({ state: 'idle' });
      await rulesChanged();
    } catch (err) {
      setReader({ state: 'failed', message: sentence(err, 'The rules could not be saved. Try again.') });
    }
  }

  const setup = load.state === 'done' ? load.setup : null;
  const working = run.state === 'working';
  const results = run.state === 'done' ? run.answer.results : [];
  const verdicts = results.map((r) => verdict(r, looks[r.size.name]));
  const looking = results.some((r) => ['looking', 'fixing'].includes(looks[r.size.name]?.state ?? ''));
  const count = (s: LayoutStatus) => verdicts.filter((v) => v === s).length;

  const act = (name: string, next: Act | null) => setActs((now) => {
    const { [name]: _old, ...rest } = now;
    return next ? { ...rest, [name]: next } : rest;
  });
  const look = (name: string, next: Look) => setLooks((now) => ({ ...now, [name]: next }));
  const swap = (fresh: SizeResult) => setRun((now) => (now.state !== 'done' ? now : {
    state: 'done',
    answer: { ...now.answer, results: now.answer.results.map((r) => (r.size.name === fresh.size.name ? fresh : r)) },
  }));

  function tick(name: string, on: boolean) {
    setTicked((now) => (on ? [...now, name] : now.filter((n) => n !== name)));
  }

  async function readDocument(): Promise<Doc> {
    if (!inPhotoshop()) return null;
    const doc = await ask<PsDocument | null>('getDocument');
    if (!doc) throw new Error('No document is open. Open the poster in Photoshop, then try again.');
    return { id: doc.id, title: doc.title, width: doc.width, height: doc.height, layers: flatten(doc.layers) };
  }

  // The model looks at a picture of the layout. If it sees a problem the first time, the size goes
  // back once with what it saw, and it looks once more. Then it stops, whatever it sees.
  async function lookAt(r: SizeResult, round: 0 | 1, id: number) {
    const name = r.size.name;
    const current = () => runId.current === id;
    look(name, { state: 'looking' });
    try {
      const boxes = r.placements.map((p) => ({ name: p.name, box: p.box }));
      const review = await getJson<Review>('/api/review', { size: name, image: await picture(r), placements: boxes });
      if (!current()) return;
      if (review.issues.length > 0 && round === 0) {
        look(name, { state: 'fixing' });
        const notes = review.issues.map((i) => `${i.layer}: ${i.problem} ${i.fix}`);
        const fresh = await getJson<Answer>('/api/layout', { sizes: [name], document: lastDoc.current, notes: { [name]: notes }, previous: { [name]: boxes } });
        const next = fresh.results[0];
        if (!current()) return;
        if (!next) throw new Error('The second try did not come back. Press Try again.');
        swap(next);
        await lookAt(next, 1, id);
        return;
      }
      look(name, { state: 'done', fixed: round === 1, ...review });
    } catch (err) {
      if (current()) look(name, { state: 'failed', message: sentence(err, 'The picture could not be looked at.') });
    }
  }

  // The first yes: read the open document, then ask for layouts. Nothing is changed.
  async function propose() {
    const id = ++runId.current;
    const order = setup?.sizes.map((s) => s.name) ?? [];
    const sizes = [...ticked].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    setRun({ state: 'working', sizes });
    setActs({});
    setLooks({});
    try {
      lastDoc.current = await readDocument();
      const answer = await getJson<Answer>('/api/layout', { sizes, document: lastDoc.current });
      if (runId.current !== id) return;
      setRun({ state: 'done', answer });
      answer.results.forEach((r) => void lookAt(r, 0, id));
    } catch (err) {
      if (runId.current === id) setRun({ state: 'failed', message: sentence(err, 'Could not make the layouts. Try again.') });
    }
  }

  // One size again. The others stay as they are.
  async function tryAgain(name: string) {
    const id = runId.current;
    act(name, { state: 'retrying' });
    try {
      lastDoc.current = await readDocument();
      const fresh = (await getJson<Answer>('/api/layout', { sizes: [name], document: lastDoc.current })).results[0];
      if (runId.current !== id) return;
      if (!fresh) throw new Error('That layout did not come back. Try once more.');
      swap(fresh);
      act(name, null);
      void lookAt(fresh, 0, id);
    } catch (err) {
      if (runId.current === id) act(name, { state: 'failed', message: sentence(err, 'Could not make that layout again. Try once more.') });
    }
  }

  // The yes for one size: make it as a new document with editable layers.
  async function makeInPhotoshop(r: SizeResult) {
    if (run.state !== 'done' || run.answer.poster.id === null) return;
    act(r.size.name, { state: 'making' });
    try {
      const result = await makeSizes({
        sourceId: run.answer.poster.id,
        sizes: [{ name: r.size.name, w: r.size.w, h: r.size.h, layers: r.placements.flatMap((p) => (p.id === undefined ? [] : [{ id: p.id, name: p.name, box: p.box }])) }],
      });
      act(r.size.name, result.made.length ? { state: 'made' } : { state: 'failed', message: result.failed[0]?.error ?? 'Photoshop could not make this size. Try again.' });
    } catch (err) {
      act(r.size.name, { state: 'failed', message: sentence(err, 'Photoshop could not make this size. Try again.') });
    }
  }

  const status = load.state === 'failed' ? <StatusMark tone="error">Not loaded</StatusMark>
    : working ? <StatusMark busy>Working</StatusMark>
    : looking ? <StatusMark busy>Looking</StatusMark>
    : count('needs') ? <StatusMark tone="error">{count('needs')} need you</StatusMark>
    : count('check') ? <StatusMark tone="warning">{count('check')} to check</StatusMark>
    : results.length ? <StatusMark tone="success">All ready</StatusMark>
    : setup ? <StatusMark tone={setup.mode === 'claude' ? 'success' : 'warning'}>{setup.mode === 'claude' ? 'Connected' : 'Sample output'}</StatusMark>
    : undefined;

  const footer = (
    <>
      {results.length > 0 && !hosted && <p className="text-[11px] text-ink-3">Open this panel in Photoshop to make the sizes.</p>}
      <div className="flex">
        <SmallButton kind={results.length ? 'quiet' : 'primary'} wide onClick={propose} disabled={!setup || working || ticked.length === 0 || reader.state === 'reading' || reader.state === 'proposed'}>
          {working ? 'Working…' : results.length ? 'Propose all again' : `Propose ${ticked.length} ${ticked.length === 1 ? 'layout' : 'layouts'}`}
        </SmallButton>
      </div>
      <p className="text-[11px] text-ink-3">Sends layer names, positions, rules and a small picture of each layout to the AI service.</p>
      <StarterLinks />
    </>
  );

  return (
    <HostFrame hosted={hosted}>
      <PluginShell
        fill={hosted}
        title={plan.name ?? <Undecided what="tool name" />}
        status={status}
        bodyLabel="Sizes, rules and layouts"
        context={setup && (
          <>
            <span className="min-w-0 truncate text-ink-1">{run.state === 'done' ? run.answer.poster.title : setup.title}</span>
            <span className="min-w-0 flex-1 truncate text-right text-[11px] text-ink-3">
              {run.state === 'done' ? (run.answer.poster.from === 'photoshop' ? 'Open document' : 'Sample poster') : hosted ? 'Reads the open document' : 'Sample poster'}
            </span>
          </>
        )}
        footer={footer}
      >
        {load.state === 'working' && <PanelSection title="Sizes"><Skeleton lines={5} /></PanelSection>}
        {load.state === 'failed' && <PanelSection title="Sizes"><ErrorNote message={load.message} /></PanelSection>}

        {setup && (
          <PanelSection title="Sizes" aside={<Count>{ticked.length} of {setup.sizes.length}</Count>}>
            <RowList>
              {setup.sizes.map((s) => {
                const i = results.findIndex((r) => r.size.name === s.name);
                const v = i >= 0 ? verdicts[i] : undefined;
                return (
                  <TickRow
                    key={s.name}
                    label={s.name}
                    meta={`${s.w} × ${s.h}`}
                    end={v ? <StatusMark tone={STATUS[v].tone}>{STATUS[v].word}</StatusMark> : !s.ready ? <Undecided what="later" /> : undefined}
                    checked={ticked.includes(s.name)}
                    disabled={!s.ready || working}
                    onChange={(on) => tick(s.name, on)}
                  />
                );
              })}
            </RowList>
          </PanelSection>
        )}

        {setup && (
          <PanelSection title="Client rules" aside={<Count>{setup.rulesFrom ? fileName(setup.rulesFrom) : 'practice rules'}</Count>}>
            <div className="space-y-2">
              {reader.state === 'idle' && (
                <FileDrop onFiles={readRules} accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md">Add the client&rsquo;s rules · PDF, image or text</FileDrop>
              )}
              {reader.state === 'reading' && (
                <>
                  <p role="status" className="text-[11px] text-ink-2">Reading {reader.name}</p>
                  <Skeleton lines={4} />
                </>
              )}
              {reader.state === 'failed' && (
                <>
                  <ErrorNote message={reader.message} />
                  <FileDrop onFiles={readRules} accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md">Add the client&rsquo;s rules · PDF, image or text</FileDrop>
                </>
              )}
              {reader.state === 'proposed' && (
                <div className="enter space-y-2">
                  <p className="text-[11px] text-ink-2">Read from {fileName(reader.file)}. Tick each rule you agree with. Only ticked rules are used.</p>
                  <RowList>
                    {reader.proposals.map((p) => (
                      <TickRow
                        key={p.role}
                        label={p.role}
                        end={p.legal ? <Chip>Legal</Chip> : undefined}
                        checked={reader.ticked.includes(p.role)}
                        disabled={reader.saving}
                        onChange={(on) => setReader({ ...reader, ticked: on ? [...reader.ticked, p.role] : reader.ticked.filter((r) => r !== p.role) })}
                        note={
                          <>
                            <span className="block text-ink-1">{p.summary}</span>
                            {p.quote && <span className="block text-ink-3">&ldquo;{p.quote}&rdquo;</span>}
                            {p.grounded === null && <span className="block text-ink-3">Not checked against the document. Read the words above.</span>}
                            {p.flags.map((f) => <span key={f} className="block text-warning">{f}</span>)}
                          </>
                        }
                      />
                    ))}
                  </RowList>
                  <div className="flex gap-2">
                    <SmallButton kind="primary" wide onClick={saveTicked} disabled={reader.saving || reader.ticked.length === 0}>
                      {reader.saving ? 'Saving…' : `Use ${reader.ticked.length} of ${reader.proposals.length} rules`}
                    </SmallButton>
                    <SmallButton onClick={() => setReader({ state: 'idle' })} disabled={reader.saving}>Cancel</SmallButton>
                  </div>
                </div>
              )}
            </div>
          </PanelSection>
        )}

        {setup && (
          <PanelSection title="Rules in use" aside={<Count>{setup.layers.filter((l) => l.legal).length} legal</Count>} open={false}>
            <RowList>
              {setup.layers.map((l) => (
                <PanelRow
                  key={l.name}
                  label={l.role}
                  end={l.legal ? <Chip>Legal</Chip> : undefined}
                  note={
                    <>
                      <span className="block">{l.rule}</span>
                      {l.says && <span className="block text-ink-3">&ldquo;{l.says}&rdquo;</span>}
                      <span className="block text-ink-3">{l.fromClient ? 'From the client\u2019s document' : 'Practice rule'}</span>
                    </>
                  }
                />
              ))}
            </RowList>
          </PanelSection>
        )}

        {run.state === 'idle' && setup && <PanelSection title="Layouts"><EmptyState>Layouts appear here.</EmptyState></PanelSection>}
        {/* One frame for each size being made, in that size's own proportions. */}
        {run.state === 'working' && run.sizes.map((name) => {
          const s = setup?.sizes.find((x) => x.name === name);
          return s && (
            <PanelSection key={name} title={name} aside={<StatusMark busy>Working</StatusMark>}>
              <Preview w={s.w} h={s.h} label={`${name}, being laid out`} working />
            </PanelSection>
          );
        })}
        {run.state === 'failed' && <PanelSection title="Layouts"><ErrorNote message={run.message} /></PanelSection>}

        {results.map((r, i) => {
          const failed = r.checks.filter((c) => !c.pass);
          const doing = acts[r.size.name];
          const seen = looks[r.size.name];
          const inLook = seen?.state === 'looking' || seen?.state === 'fixing';
          const busy = working || inLook || doing?.state === 'making' || doing?.state === 'retrying';
          const v = verdicts[i] ?? r.status;
          const rulesKept = seen?.state === 'done' && seen.rules.every((x) => x.kept);
          const notes = r.notes.filter((n) => !(rulesKept && n.kind === 'not-checked'));
          return (
            <PanelSection
              key={r.size.name}
              title={r.size.name}
              aside={inLook ? <StatusMark busy>{seen?.state === 'fixing' ? 'Trying once more' : 'Looking'}</StatusMark> : <StatusMark tone={STATUS[v].tone}>{STATUS[v].word}</StatusMark>}
            >
              <div className="enter space-y-2">
                <Preview w={r.size.w} h={r.size.h} label={`${r.size.name} layout, ${r.size.w} by ${r.size.h}`} working={doing?.state === 'retrying' || seen?.state === 'fixing'}>
                  {r.placements.map((p) => p.box && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.name}
                      src={layerImage(p.name)}
                      alt=""
                      className="absolute max-w-none"
                      style={{ left: `${(p.box.x / r.size.w) * 100}%`, top: `${(p.box.y / r.size.h) * 100}%`, width: `${(p.box.w / r.size.w) * 100}%`, height: `${(p.box.h / r.size.h) * 100}%` }}
                    />
                  ))}
                  {r.covered.map((a, j) => (
                    <span
                      key={j}
                      aria-hidden
                      className="absolute border border-dashed border-line-hi"
                      style={{ left: `${(a.x / r.size.w) * 100}%`, top: `${(a.y / r.size.h) * 100}%`, width: `${(a.w / r.size.w) * 100}%`, height: `${(a.h / r.size.h) * 100}%` }}
                    />
                  ))}
                </Preview>
                {/* Who made it and how the checks went, on one quiet line. */}
                <p className="flex items-baseline justify-between gap-2 text-[11px] text-ink-2">
                  <span>{madeBy(r)}</span>
                  <Count>{r.checks.length - failed.length} of {r.checks.length} checks</Count>
                </p>

                {/* What a person should read, one finding to a line. While the look is under way it has the floor. */}
                <div className="space-y-1.5">
                  {inLook && <Busy>{seen?.state === 'fixing' ? 'AI saw a problem in the picture and is trying once more' : 'AI is looking at the picture'}</Busy>}
                  {seen?.state === 'done' && seen.issues.length === 0 && rulesKept && (
                    <NoteLine tone="success" label="AI looked">{seen.fixed ? 'It saw a problem, tried once more, and now sees nothing wrong.' : 'Nothing looks wrong in the picture.'}</NoteLine>
                  )}
                  {seen?.state === 'done' && seen.issues.map((x) => <NoteLine key={x.problem} tone="warning" label="AI saw">{x.problem}</NoteLine>)}
                  {seen?.state === 'done' && seen.rules.filter((x) => !x.kept).map((x) => <NoteLine key={x.rule} tone="warning" label="AI saw">This may break a rule: {x.rule}. {x.note}</NoteLine>)}
                  {seen?.state === 'failed' && <NoteLine tone="warning" label="Not looked at">{seen.message}</NoteLine>}
                  {!inLook && notes.map((n) => (
                    <NoteLine key={n.text} tone="warning" label={n.kind === 'not-checked' ? 'Not checked' : 'Check'}>{n.text.replace(/^Not checked: /, '').replace(/^./, (c) => c.toUpperCase())}</NoteLine>
                  ))}
                  {r.covered.length > 0 && <NoteLine label="Dashed">Areas the app covers.</NoteLine>}
                  {r.status === 'needs' && <NoteLine tone="error" label="Held back">Not made until its checks pass.</NoteLine>}
                </div>
                {failed.map((c) => <CheckRow key={c.id} rule={c.rule} pass={false} where={c.detail} />)}
                {doing?.state === 'failed' && <ErrorNote message={doing.message} />}
                {doing?.state === 'made' && <p role="status" className="text-[11px] text-success">Made as a new document. Every layer can still be moved.</p>}
                <div className="flex gap-2">
                  <SmallButton kind="primary" wide onClick={() => makeInPhotoshop(r)} disabled={!hosted || busy || r.status === 'needs' || doing?.state === 'made'}>
                    {doing?.state === 'making' ? 'Making…' : doing?.state === 'made' ? 'Made' : 'Make in Photoshop'}
                  </SmallButton>
                  {r.madeBy === 'model' && (
                    <SmallButton onClick={() => tryAgain(r.size.name)} disabled={busy}>
                      {doing?.state === 'retrying' ? 'Trying…' : 'Try again'}
                    </SmallButton>
                  )}
                </div>
              </div>
            </PanelSection>
          );
        })}
      </PluginShell>
    </HostFrame>
  );
}
