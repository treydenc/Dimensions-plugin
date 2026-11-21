'use client';
// One tool, three patterns, in the form the plan names (web app, plug-in or desktop app).
// On the day: keep the states, replace the content. Preview another form with /?form=plugin.
import { useEffect, useState } from 'react';
import {
  Button, Chip, Count, EmptyState, ErrorNote, FileDrop, Panel, PanelSection, RowList, Select, Skeleton, SmallButton, StarterLinks, StatusMark, StatusPill, Tabs,
  Textarea, TickRow, Undecided, fileSize,
} from '@/components/ui';
import { DesktopShell, SidebarRow, SidebarSection, StatusItem } from '@/components/shells/DesktopShell';
import { HostFrame, PluginShell } from '@/components/shells/PluginShell';
import { WebShell } from '@/components/shells/WebShell';
import type { CheckedItem, Check } from '@/lib/checks';
import type { AgentStep } from '@/lib/claude';
import { SAMPLE_FEEDBACK, SAMPLE_QUESTION } from '@/lib/samples';
import type { ReplyDraft } from '@/lib/schemas';
import { plan } from '@/plan';

type Pattern = 'single' | 'chain' | 'agent';
type DataFile = { name: string; size: number; kind: 'pdf' | 'image' | 'text' | 'other' };
type Form = 'hosted web app' | 'plugin' | 'desktop app';
const FORM_BY_PARAM: Record<string, Form> = { web: 'hosted web app', plugin: 'plugin', desktop: 'desktop app' };
type Result = {
  source: 'claude' | 'sample';
  items?: CheckedItem[];
  reply?: ReplyDraft;
  checks?: Check[];
  answer?: string;
  steps?: AgentStep[];
  hitLimit?: boolean;
};
type Run = { state: 'idle' } | { state: 'working' } | { state: 'failed'; message: string } | { state: 'done'; result: Result };

const PATTERNS: { id: Pattern; label: string; input: string; placeholder: string }[] = [
  { id: 'single', label: 'Extract', input: SAMPLE_FEEDBACK, placeholder: 'Client feedback' },
  { id: 'chain', label: 'Extract and reply', input: SAMPLE_FEEDBACK, placeholder: 'Client feedback' },
  { id: 'agent', label: 'Ask the files', input: SAMPLE_QUESTION, placeholder: 'Question' },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');
  return json as T;
}

export default function Home() {
  const [status, setStatus] = useState<{ mode: 'claude' | 'sample'; model: string } | null>(null);
  const [pattern, setPattern] = useState<Pattern>(plan.model.pattern ?? 'single');
  const [text, setText] = useState(PATTERNS.find((p) => p.id === (plan.model.pattern ?? 'single'))!.input);
  const [run, setRun] = useState<Run>({ state: 'idle' });
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<number | null>(null);
  const [files, setFiles] = useState<DataFile[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<Form>(plan.form.production ?? 'hosted web app');

  useEffect(() => {
    const asked = FORM_BY_PARAM[new URLSearchParams(window.location.search).get('form') ?? ''];
    if (asked) setForm(asked);
    fetch('/api/files').then((r) => r.json()).then((d) => setFiles(d.files ?? [])).catch(() => {});
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => setStatus({ mode: 'sample', model: '' }));
  }, []);

  function choose(next: Pattern) {
    setPattern(next);
    setText(PATTERNS.find((p) => p.id === next)!.input);
    setRun({ state: 'idle' });
    setSaved(null);
  }

  async function go() {
    setRun({ state: 'working' });
    setSaved(null);
    try {
      const result = await post<Result>(`/api/${pattern}`, { text, files: [...chosen] });
      // Pre-select only what passed the gate. The person makes the final call.
      setKept(new Set((result.items ?? []).flatMap((item, i) => (item.grounded ? [i] : []))));
      setRun({ state: 'done', result });
    } catch (err) {
      setRun({ state: 'failed', message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  }

  async function addFiles(picked: File[]) {
    if (picked.length === 0) return;
    const body = new FormData();
    picked.forEach((f) => body.append('file', f));
    try {
      const res = await fetch('/api/files', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not add that file.');
      setFiles(json.files);
      // A file someone just added is one they want used.
      setChosen((prev) => new Set([...prev, ...(json.added as string[])]));
    } catch (err) {
      setRun({ state: 'failed', message: err instanceof Error ? err.message : 'Could not add that file.' });
    }
  }

  async function save(items: CheckedItem[]) {
    try {
      const picked = items.filter((_, i) => kept.has(i)).map(({ grounded: _g, ...item }) => item);
      const { count } = await post<{ count: number }>('/api/saved', { items: picked });
      setSaved(count);
    } catch (err) {
      setRun({ state: 'failed', message: err instanceof Error ? err.message : 'Could not save.' });
    }
  }

  const current = PATTERNS.find((p) => p.id === pattern)!;
  const working = run.state === 'working';

  const name = plan.name ?? <Undecided what="tool name" />;
  const canRun = !working && text.trim().length > 0;
  const runLabel = working ? 'Working…' : 'Run';
  const input = <Textarea label={current.placeholder} value={text} onChange={setText} rows={pattern === 'agent' ? 2 : 6} />;

  // Context the person chooses: which files the model sees on this run.
  const personPicks = plan.context.sources.some((s) => s.chosenBy === 'person') && pattern !== 'agent';
  const context = (
    <div className="space-y-2 text-xs">
      <RowList>
        {files.filter((f) => f.kind !== 'other').map((f) => (
          <TickRow
            key={f.name}
            label={f.name.replace(/^uploads\//, '')}
            meta={fileSize(f.size)}
            checked={chosen.has(f.name)}
            onChange={(on) => setChosen((prev) => { const next = new Set(prev); on ? next.add(f.name) : next.delete(f.name); return next; })}
          />
        ))}
      </RowList>
      <FileDrop onFiles={addFiles} accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.csv,.json">Add files</FileDrop>
    </div>
  );
  const contextCount = <Count>{chosen.size} of {files.filter((f) => f.kind !== 'other').length}</Count>;

  const results = (
    <>
      {run.state === 'idle' && <EmptyState>Results appear here.</EmptyState>}

      {run.state === 'failed' && <ErrorNote message={run.message} />}

      {run.state === 'working' && <Skeleton />}

      {run.state === 'done' && run.result.items && (
        <Panel title="Action items">
          {run.result.items.length === 0 ? (
            <p className="text-sm text-ink-3">No changes requested.</p>
          ) : (
            <ul className="divide-y divide-line">
              {run.result.items.map((item, i) => (
                <li key={i} className="flex gap-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--color-ink-1)]"
                    checked={kept.has(i)}
                    aria-label={`Keep: ${item.title}`}
                    onChange={() =>
                      setKept((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${item.grounded ? '' : 'text-ink-3 line-through'}`}>{item.title}</p>
                    <p className="mt-1 text-xs text-ink-3">“{item.quote}”</p>
                    <p className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Chip>{item.owner}</Chip>
                      <Chip>{item.priority}</Chip>
                      {!item.grounded && (
                        <Chip tone="error">Quote not found in the text</Chip>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {run.result.items.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <Button kind="quiet" disabled={kept.size === 0} onClick={() => save(run.result.items!)}>
                Save {kept.size} approved
              </Button>
              {saved !== null && <span className="text-sm text-success" role="status">Saved {saved}</span>}
            </div>
          )}
        </Panel>
      )}

      {run.state === 'done' && run.result.reply && (
        <Panel title="Reply draft">
          <p className="text-sm font-medium">{run.result.reply.subject}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{run.result.reply.body}</p>
          <ul className="mt-4 space-y-1 text-xs">
            {run.result.checks?.map((c) => (
              <li key={c.rule} className={c.pass ? 'text-success' : 'text-error'}>
                {c.pass ? 'Pass' : 'Fail'} · {c.rule}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {run.state === 'done' && run.result.answer !== undefined && (
        <Panel title="Answer">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{run.result.answer || 'No answer.'}</p>
          {run.result.hitLimit && <p className="mt-2 text-xs text-warning">Stopped at the step limit.</p>}
          <ol className="mt-4 space-y-2 border-t border-line pt-3 text-xs text-ink-3">
            {run.result.steps?.map((s, i) => (
              <li key={i}>
                <span className="font-mono text-ink-1">{s.tool}</span> {JSON.stringify(s.input)}
                <span className="block truncate text-ink-3">{s.result}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  );

  // Plug-in: a 320px panel docked in a host application. Panel scale.
  if (form === 'plugin') {
    return (
      <HostFrame>
        <PluginShell
          title={name}
          status={status && <StatusMark tone={status.mode === 'claude' ? 'success' : 'warning'}>{status.mode === 'claude' ? 'Connected' : 'Sample output'}</StatusMark>}
          footer={<div className="space-y-2"><div className="flex"><SmallButton kind="primary" wide onClick={go} disabled={!canRun}>{runLabel}</SmallButton></div><StarterLinks /></div>}
        >
          <PanelSection title={current.placeholder}>
            <Select label="Pattern" value={pattern} onChange={choose} options={PATTERNS} />
            {input}
          </PanelSection>
          {personPicks && <PanelSection title="Context" aside={contextCount}>{context}</PanelSection>}
          <PanelSection title="Result"><div className="space-y-3">{results}</div></PanelSection>
        </PluginShell>
      </HostFrame>
    );
  }

  // Desktop app: one window. Patterns in the sidebar, the work in the middle.
  if (form === 'desktop app') {
    return (
      <DesktopShell
        name={name}
        title={current.label}
        actions={<SmallButton kind="primary" onClick={go} disabled={!canRun}>{runLabel}</SmallButton>}
        sidebarLabel="Patterns"
        sidebar={
          <SidebarSection title="Patterns">
            {PATTERNS.map((p) => <SidebarRow key={p.id} selected={p.id === pattern} onClick={() => choose(p.id)}>{p.label}</SidebarRow>)}
          </SidebarSection>
        }
        inspector={personPicks ? <PanelSection title="Context" aside={contextCount}>{context}</PanelSection> : undefined}
        inspectorLabel="Context"
        statusbar={<><StatusItem grow><StatusPill mode={status?.mode ?? null} model={status?.model} /></StatusItem><StatusItem><StarterLinks /></StatusItem></>}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
          <Panel title={current.placeholder}>{input}</Panel>
          {results}
        </div>
      </DesktopShell>
    );
  }

  // Web app: a full page at page scale.
  return (
    <WebShell
      tool={name}
      title={current.placeholder}
      meta={<StarterLinks />}
      status={<StatusPill mode={status?.mode ?? null} model={status?.model} />}
      actions={<Button onClick={go} disabled={!canRun}>{runLabel}</Button>}
      aside={personPicks ? <Panel title="Context" aside={contextCount}>{context}</Panel> : undefined}
      asideLabel="Context"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div><Tabs options={PATTERNS} value={pattern} onPick={choose} /></div>
        <Panel>{input}</Panel>
        {results}
      </div>
    </WebShell>
  );
}
