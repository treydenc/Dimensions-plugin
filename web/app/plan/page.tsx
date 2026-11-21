// The plan, drawn. Everything here comes from plan.ts. Edit that file and this page changes.
import type { ReactNode } from 'react';
import { Chip, Label, Mark, Nav, Panel, Undecided } from '@/components/ui';
import { agentVerdict, MOMENTS } from '@/lib/plan-types';
import { plan } from '@/plan';


const countOpen = (v: unknown): number =>
  v === null ? 1 : Array.isArray(v) ? (v.length === 0 ? 1 : v.reduce((n: number, x) => n + countOpen(x), 0))
  : typeof v === 'object' ? Object.values(v as object).reduce((n: number, x) => n + countOpen(x), 0) : 0;

function V({ v }: { v: string | boolean | null }) {
  if (v === null) return <Undecided />;
  if (typeof v === 'boolean') return <>{v ? 'Yes' : 'No'}</>;
  return <>{v}</>;
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-t border-line py-2.5 text-sm first:border-t-0">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-ink-1">{children}</dd>
    </div>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-btn border border-line bg-ground p-3">
      <Label className="mb-2">{title}</Label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Box({ t, d, tag }: { t: string; d?: string; tag?: ReactNode }) {
  return (
    <div className="rounded-row border border-line bg-lift px-2.5 py-2">
      <p className="flex items-center justify-between gap-2 text-sm font-medium">{t}{tag}</p>
      {d && <p className="mt-0.5 text-xs text-ink-3">{d}</p>}
    </div>
  );
}

const Arrow = () => <span aria-hidden className="hidden self-center text-ink-3 lg:block">→</span>;
const None = ({ what }: { what: string }) => <Undecided what={`no ${what} yet`} />;

export default function PlanPage() {
  const open = countOpen(plan);
  const { model, context, tools, prompt, design, architecture: arch } = plan;
  const test = model.agentTest;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <Nav name={plan.name ?? <Undecided what="tool name" />} current="plan" />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight"><V v={plan.name} /></h1>
          <p className="mt-2 max-w-2xl text-ink-2"><V v={plan.oneLine} /></p>
        </div>
        <Chip tone={open === 0 ? 'success' : 'warning'}>{open === 0 ? 'Plan complete' : `${open} undecided`}</Chip>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="1 · Problem">
          <dl>
            <Row k="Who"><V v={plan.problem.user} /></Row>
            <Row k="Today"><V v={plan.problem.today} /></Row>
            <Row k="What it costs"><V v={plan.problem.cost} /></Row>
            <Row k="Problem I chose"><V v={plan.problem.chosen} /></Row>
            <Row k="Why this one"><V v={plan.problem.why} /></Row>
          </dl>
        </Panel>
        <Panel title="2 · Form">
          <dl>
            <Row k="Demo">{plan.form.demo}</Row>
            <Row k="In production"><V v={plan.form.production} /></Row>
            <Row k="Why"><V v={plan.form.why} /></Row>
          </dl>
        </Panel>
      </div>

      <section>
        <Label className="mb-3">3 · System map</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel aside={<Mark color="violet">Model</Mark>}>
            <dl>
              <Row k="Pattern"><V v={model.pattern} /></Row>
              <Row k="Model"><V v={model.model} /></Row>
              <Row k="Why"><V v={model.why} /></Row>
              <Row k="Complex enough"><V v={test.complexEnough} /></Row>
              <Row k="Worth the tokens"><V v={test.worthTheTokens} /></Row>
              <Row k="Can do every part"><V v={test.canDoEveryPart} /></Row>
              <Row k="Mistakes are cheap"><V v={test.mistakeIsCheap} /></Row>
              <Row k="Verdict"><span className="font-medium"><V v={agentVerdict(test)} /></span></Row>
            </dl>
          </Panel>
          <Panel aside={<Mark color="cobalt">Context</Mark>}>
            <div className="space-y-2">
              {context.sources.length === 0 && <None what="sources" />}
              {context.sources.map((s) => (
                <Box key={s.name} t={s.name} d={s.note} tag={<Chip>{s.chosenBy === 'person' ? 'person picks' : 'system'}</Chip>} />
              ))}
            </div>
            <dl className="mt-3">
              <Row k="Person can add"><V v={context.personCanAdd} /></Row>
              <Row k="Carries over"><V v={context.carriesOver} /></Row>
            </dl>
          </Panel>
          <Panel aside={<Mark color="marigold">Tools</Mark>}>
            <div className="space-y-2">
              {tools.length === 0 && <None what="tools" />}
              {tools.map((t) => (
                <Box key={t.name} t={t.name} d={t.does} tag={<Chip tone={t.needsApproval ? 'warning' : 'neutral'}>{t.needsApproval ? 'needs a yes' : t.kind}</Chip>} />
              ))}
            </div>
          </Panel>
          <Panel aside={<Mark color="green">Prompt</Mark>}>
            <dl>
              <Row k="Key instruction"><V v={prompt.keyInstruction} /></Row>
              <Row k="Pinned by"><V v={prompt.pinnedBy} /></Row>
              <Row k="Checked by"><V v={prompt.checkedBy} /></Row>
            </dl>
          </Panel>
        </div>
      </section>

      <Panel title="4 · Human-centered design">
        <dl className="grid gap-x-10 lg:grid-cols-2">
          <div>
            <Row k="Data and sources"><V v={design.data} /></Row>
            <Row k="Privacy"><V v={design.privacy} /></Row>
            <Row k="Brand rules"><V v={design.brand} /></Row>
          </div>
          <div>
            <Row k="Agency"><V v={design.agency} /></Row>
            <Row k="Direct editing"><V v={design.directManipulation} /></Row>
            <Row k="Generative UI"><V v={design.generativeUi} /></Row>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Label>Principles</Label>
          {design.principles.length === 0 && <None what="principles" />}
          {design.principles.map((p) => <Chip key={p}>{p}</Chip>)}
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <Label className="mb-2">How human-centered design shaped the system</Label>
          {design.shaped.length === 0 ? <None what="links" /> : (
            <ul className="divide-y divide-line">
              {design.shaped.map((d) => (
                <li key={d.principle} className="grid gap-x-6 gap-y-1 py-3 text-sm md:grid-cols-[2fr_3fr_auto]">
                  <span><span className="block text-xs text-ink-3">{MOMENTS[d.moment].label} · {MOMENTS[d.moment].question}</span><span className="text-ink-1">{d.principle}</span>{d.source && <span className="block text-xs text-ink-3">{d.source}</span>}</span>
                  <span className="text-ink-2">{d.so}</span>
                  <span><Chip>{d.where}</Chip></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel title="5 · Architecture">
        <div className="flex flex-col gap-3 lg:flex-row">
          <Column title="Inputs">
            {arch.inputs.length === 0 && <None what="inputs" />}
            {arch.inputs.map((x) => <Box key={x.t} {...x} />)}
          </Column>
          <Arrow />
          <Column title="Stations">
            {arch.stations.length === 0 && <None what="stations" />}
            {arch.stations.map((x) => <Box key={x.t} t={x.t} d={x.d} tag={<Chip>{x.by}</Chip>} />)}
          </Column>
          <Arrow />
          <Column title="Gate · rules in code">
            {arch.gate.length === 0 && <None what="rules" />}
            {arch.gate.map((r) => <Box key={r} t={r} />)}
          </Column>
          <Arrow />
          <Column title={`Store${arch.store.name ? ` · ${arch.store.name}` : ''}`}>
            {arch.store.name === null && <Undecided what="store" />}
            {arch.store.items.map((x) => <Box key={x} t={x} />)}
          </Column>
          <Arrow />
          <Column title={`Person${arch.human.name ? ` · ${arch.human.name}` : ''}`}>
            {arch.human.name === null && <Undecided what="person" />}
            {arch.human.items.map((x) => <Box key={x} t={x} />)}
          </Column>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="6 · Iterations">
          <ul className="space-y-2">
            {plan.iterations.map((it) => (
              <li key={it.tag} className="flex items-center gap-3 text-sm">
                <Chip tone={it.done ? 'success' : 'neutral'}>{it.tag}</Chip>
                <span className={it.done ? 'text-ink-1' : 'text-ink-2'}><V v={it.goal} /></span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Cut list">
          {plan.cut.length === 0 ? <None what="cuts" /> : (
            <ul className="list-inside list-disc space-y-1 text-sm text-ink-2">{plan.cut.map((c) => <li key={c}>{c}</li>)}</ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="7 · Working with AI">
          {plan.log.length === 0 ? <None what="entries" /> : (
            <ul className="divide-y divide-line">
              {plan.log.map((l) => (
                <li key={l.what} className="py-2.5 text-sm first:pt-0"><p className="text-ink-2">{l.what}</p><p className="mt-1 text-ink-1">{l.decided}</p></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="8 · Demo and next">
          <dl>
            <Row k="I will show"><V v={plan.demo.happyPath} /></Row>
            <Row k="A check catches"><V v={plan.demo.caught} /></Row>
            <Row k="With more time">{plan.next.length === 0 ? <None what="next steps" /> : <ol className="list-inside list-decimal space-y-1">{plan.next.map((n) => <li key={n}>{n}</li>)}</ol>}</Row>
          </dl>
        </Panel>
      </div>
    </main>
  );
}
