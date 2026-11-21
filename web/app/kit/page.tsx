'use client';
// The design system, documented. Five parts: foundation, components, motion, interaction, patterns.
// Every entry has one sentence on what it is for, a live specimen, and its values.
// If something is not here, add it here first, then use it.
import { useState, type ReactNode } from 'react';
import {
  Button, Checkbox, CheckField, CheckRow, Chip, Count, EmptyState, ErrorNote, FileDrop, Input, Label, ListRow, Mark, Nav, NumberField, Panel, PanelRow, PanelSection,
  Progress, PropRow, RowList, Select, SettingRow, Skeleton, Slider, SmallButton, StatusChip, StatusMark, StatusPill, SwitchRow, Tabs, Textarea, Thumb, TickRow,
  Toggle, Undecided, Workspace,
} from '@/components/ui';
import { plan } from '@/plan';

const PARTS = [
  { id: 'foundation', title: 'Foundation', intro: 'What every screen stands on: one ground, one ink at set strengths, one typeface, three radii.',
    entries: ['Ground and surfaces', 'Ink', 'Accent and state', 'Spectrum', 'Type scale', 'Label', 'Spacing', 'Shape', 'Two scales'] },
  { id: 'components', title: 'Components', intro: 'The pieces screens are built from. Each one is live.',
    entries: ['Button', 'Tabs', 'Field', 'File drop', 'Select', 'Slider', 'Toggle and checkbox', 'Chip', 'Mark', 'Status pill', 'Status mark', 'Panel', 'Panel section', 'List rows', 'Check row', 'Page form rows', 'Progress', 'Thumb', 'Undecided'] },
  { id: 'motion', title: 'Motion', intro: 'Motion says what changed. Arriving is slower than leaving, and nothing moves for decoration.',
    entries: ['Principles', 'Easing and timing', 'Reduced motion'] },
  { id: 'interaction', title: 'Interaction', intro: 'How the tool answers a pointer, a keyboard and a wait.',
    entries: ['Hover', 'Focus and keyboard', 'Targets', 'The four states'] },
  { id: 'patterns', title: 'Patterns', intro: 'Whole arrangements, ready to copy.',
    entries: ['Run and result', 'Canvas and docked panel', 'Propose, check, approve', 'Three forms'] },
] as const;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const MONO = 'font-mono text-[11px] tabular-nums text-ink-3';

function Entry({ part, title, intent, children }: { part: (typeof PARTS)[number]; title: string; intent: string; children: ReactNode }) {
  const n = (part.entries as readonly string[]).indexOf(title) + 1;
  return (
    <article id={slug(title)} className="scroll-mt-6 border-t border-line py-8">
      <p className={MONO}>{String(n).padStart(2, '0')} / {String(part.entries.length).padStart(2, '0')}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-xl text-sm text-ink-2">{intent}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </article>
  );
}

/** Where the live thing sits. */
function Stage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-btn border border-line bg-ground p-5 ${className}`}>{children}</div>;
}

const NUMERIC = new Set(['Value', 'On ground', 'Height', 'Hue', 'Page scale', 'Panel scale', 'Smallest target']);

/** Values, as a table: what it is called, what it is, where it goes. */
function Spec({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-left text-xs">
      <thead>
        <tr>{head.map((h) => <th key={h} className="border-b border-line py-2 pr-4 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-b-0">
            {r.map((c, j) => <td key={j} className={`py-2 pr-4 align-top ${j === 0 ? 'whitespace-nowrap text-ink-1' : NUMERIC.has(head[j]) ? 'whitespace-nowrap font-mono text-[11px] text-ink-2' : 'text-ink-2'}`}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Swatch({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div>
      <div className="h-14 rounded-row border border-line" style={{ background: `var(--color-${name})` }} />
      <p className="mt-2 text-xs text-ink-1">{name}</p>
      <p className={MONO}>{value}</p>
      {note && <p className="text-[11px] text-ink-3">{note}</p>}
    </div>
  );
}

const SIZES = [
  { name: 'Story', w: 1080, h: 1920, status: 'ready' },
  { name: 'Square', w: 1080, h: 1080, status: 'ready' },
  { name: 'Landscape', w: 1920, h: 1080, status: 'review' },
  { name: 'Leaderboard', w: 728, h: 90, status: 'failed' },
  { name: 'Portrait', w: 1080, h: 1350, status: 'working' },
  { name: 'Banner', w: 1200, h: 628, status: 'ready' },
] as const;

export default function Kit() {
  const [tab, setTab] = useState<'one' | 'two' | 'three'>('one');
  const [text, setText] = useState('Client feedback goes here.');
  const [pack, setPack] = useState<'social' | 'display' | 'ooh'>('social');
  const [margin, setMargin] = useState(4);
  const [minType, setMinType] = useState('14');
  const [lockLogo, setLockLogo] = useState(true);
  const [fill, setFill] = useState(false);
  const [picked, setPicked] = useState('Story');
  const [replay, setReplay] = useState(0);
  const [kept, setKept] = useState(true);
  const [tick, setTick] = useState(true);
  const [approved, setApproved] = useState(false);
  const [F, C, M, I, P] = PARTS;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Nav name={plan.name ?? <Undecided what="tool name" />} current="kit" />

      <div className="mt-8 flex gap-12">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-48 shrink-0 overflow-y-auto pb-8 lg:block">
          <p className="text-base font-semibold tracking-tight">Kit</p>
          <Label className="mt-1">Design system</Label>
          <nav className="mt-6 space-y-5">
            {PARTS.map((p, i) => (
              <div key={p.id}>
                <a href={`#${p.id}`} className="flex gap-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-2 hover:text-ink-1">
                  <span className="font-mono text-ink-3">{String(i + 1).padStart(2, '0')}</span>{p.title}
                </a>
                <ul className="mt-2 space-y-1 border-l border-line pl-3">
                  {p.entries.map((e) => <li key={e}><a href={`#${slug(e)}`} className="block text-xs text-ink-3 transition-colors hover:text-ink-1">{e}</a></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="pb-10">
            <Label>Kit 1.0</Label>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">Design system</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">
              A system for tools that sit beside the work. The work is loud; the tool recedes. One ink, one typeface, and colour only where it means something.
            </p>
          </header>

          {/* ---------- 01 Foundation ---------- */}
          <section id={F.id} className="scroll-mt-6">
            <h2 className="text-3xl font-semibold tracking-tight">{F.title}</h2>
            <p className="mb-8 mt-2 max-w-xl text-sm text-ink-2">{F.intro}</p>

            <Entry part={F} title="Ground and surfaces" intent="Near-black ground. Surfaces step up from it; controls lift off it with a thin veil of white.">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                <Swatch name="ground" value="#0A0A0A" /><Swatch name="surface-1" value="#141413" /><Swatch name="surface-2" value="#1C1917" />
                <Swatch name="surface-3" value="#292524" /><Swatch name="lift" value="white 7%" /><Swatch name="lift-hi" value="white 13%" />
              </div>
              <Spec head={['Token', 'Value', 'Used for']} rows={[
                ['ground', '#0A0A0A', 'The page, the canvas, the inside of fields'],
                ['surface-1', '#141413', 'Panels and the docked side panel'],
                ['surface-2', '#1C1917', 'Frames on the canvas'],
                ['surface-3', '#292524', 'Disabled fills, placeholders inside frames'],
                ['lift / lift-hi', 'white 7% / 13%', 'Controls at rest / hovered or selected'],
                ['line / line-hi', 'white 10% / 22%', 'Hairlines at rest / hovered or focused'],
              ]} />
            </Entry>

            <Entry part={F} title="Ink" intent="Text never takes a new colour. It takes the ink at one of three strengths: quieter means less important, not a different hue.">
              <Stage className="space-y-2">
                <p className="text-sm text-ink-1">Ink 1 · The client asked for a larger logo.</p>
                <p className="text-sm text-ink-2">Ink 2 · The client asked for a larger logo.</p>
                <p className="text-sm text-ink-3">Ink 3 · The client asked for a larger logo.</p>
              </Stage>
              <Spec head={['Step', 'Value', 'On ground', 'Used for']} rows={[
                ['ink-1', '#F5F5F4', '18.1 : 1', 'Titles, values, input text, the selected item'],
                ['ink-2', '#D6D3D1', '13.3 : 1', 'Reading text, descriptions, labels in a panel'],
                ['ink-3', '#A8A29E', '7.9 : 1', 'Captions, units, indices, things at rest'],
              ]} />
            </Entry>

            <Entry part={F} title="Accent and state" intent="Silver is the only accent, for marks and progress. Three state colours say passed, needs a look, or failed, and always carry a word.">
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
                <Swatch name="accent" value="#C2C7CC" /><Swatch name="success" value="#5FBF8A" note="8.8 : 1" /><Swatch name="warning" value="#E6B450" note="10.4 : 1" /><Swatch name="error" value="#FF7A85" note="7.9 : 1" />
              </div>
              <Spec head={['Token', 'Means', 'Used for']} rows={[
                ['accent', 'Nothing. It is material.', 'Progress fill, the logo mark inside a frame'],
                ['success', 'Passed a check', 'Chips, the connected pill, "Saved"'],
                ['warning', 'A person should look', 'Chips, the sample-mode pill, undecided fields'],
                ['error', 'Failed', 'Chips, the error note'],
              ]} />
            </Entry>

            <Entry part={F} title="Spectrum" intent="Eight hues for telling categories apart. Never for state, never on a control, and always beside the category's name.">
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
                {[['vermilion', '#FF4A0A'], ['marigold', '#FFB000'], ['cream', '#FFECBE'], ['green', '#34A848'], ['cobalt', '#3A86F0'], ['violet', '#AA5AFF'], ['lavender', '#E5C9FF'], ['blush', '#FFD6EC']].map(([n, v]) => <Swatch key={n} name={n} value={v} />)}
              </div>
              <Spec head={['Fixed pairings', 'Hue']} rows={[['Model', 'violet'], ['Context', 'cobalt'], ['Tools', 'marigold'], ['Prompt', 'green']]} />
            </Entry>

            <Entry part={F} title="Type scale" intent="One family, Instrument Sans, at six sizes. Weight and ink do the work that a second typeface would.">
              <Stage className="space-y-5">
                {[
                  ['Display · 48 / 1.0 · semibold · −0.025em', 'text-5xl font-semibold tracking-tight', 'Design system'],
                  ['Page title · 30 / 1.2 · semibold · −0.025em', 'text-3xl font-semibold tracking-tight', 'Feedback Sorter'],
                  ['Entry title · 20 / 1.4 · semibold · −0.025em', 'text-xl font-semibold tracking-tight', 'Ground and surfaces'],
                  ['Body · 14 / 1.6 · regular · ink-1 or ink-2', 'text-sm leading-relaxed text-ink-2', 'Turns a client feedback email into checked action items and a reply draft.'],
                  ['Panel text · 12 / 1.3 · regular', 'text-xs text-ink-2', 'Safe margin, Min type, Lock logo'],
                  ['Label · 11 / 1.5 · medium · uppercase · +0.08em', 'text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3', 'Brand rules'],
                ].map(([spec, cls, sample]) => (
                  <div key={spec}>
                    <p className={MONO}>{spec}</p>
                    <p className={`mt-1 ${cls}`}>{sample}</p>
                  </div>
                ))}
              </Stage>
              <Spec head={['Voice', 'Family', 'Used for']} rows={[
                ['Sans', 'Instrument Sans Variable', 'Everything a person reads'],
                ['Mono', 'System mono, tabular figures', 'Numbers that line up: pixel sizes, percentages, indices, tool names'],
              ]} />
            </Entry>

            <Entry part={F} title="Label" intent="A small uppercase label names a group. It is one step quieter than what it names.">
              <Stage className="flex flex-wrap gap-10">
                <div><Label>Action items</Label><p className={`mt-1 ${MONO}`}>group label</p></div>
                <div><p className={MONO}>03 / 09</p><p className={`mt-1 ${MONO}`}>index</p></div>
                <div><p className={MONO}>1080 × 1920</p><p className={`mt-1 ${MONO}`}>measure</p></div>
              </Stage>
            </Entry>

            <Entry part={F} title="Spacing" intent="A 4px grid. Seven steps cover everything; reach for the nearest one, never a value in between.">
              <Stage className="space-y-2">
                {[[4, 'Inside a chip'], [8, 'Between a control and its neighbour'], [12, 'Panel padding at panel scale'], [16, 'Between specimens, canvas padding'], [20, 'Panel padding at page scale'], [24, 'Between panels, page gutter'], [32, 'Between entries']].map(([n, use]) => (
                  <div key={n} className="flex items-center gap-4">
                    <span className={`w-6 text-right ${MONO}`}>{n}</span>
                    <span className="h-3 rounded-[1px] bg-accent" style={{ width: Number(n) * 2 }} />
                    <span className="text-xs text-ink-2">{use}</span>
                  </div>
                ))}
              </Stage>
            </Entry>

            <Entry part={F} title="Shape" intent="Three radii. The bigger the thing, the rounder its corner; nothing is a pill.">
              <Stage className="flex flex-wrap items-end gap-8">
                <div><div className="h-10 w-24 rounded-row border border-line-hi bg-lift" /><p className={`mt-2 ${MONO}`}>row · 4</p></div>
                <div><div className="h-14 w-32 rounded-btn border border-line-hi bg-lift" /><p className={`mt-2 ${MONO}`}>btn · 8</p></div>
                <div><div className="h-24 w-48 rounded-panel border border-line-hi bg-lift" /><p className={`mt-2 ${MONO}`}>panel · 16</p></div>
              </Stage>
              <Spec head={['Token', 'Value', 'Used for']} rows={[
                ['rounded-row', '4px', 'Chips, tab segments, list rows, boxes inside a panel'],
                ['rounded-btn', '8px', 'Every button and field, the tab track, frames on the canvas'],
                ['rounded-panel', '16px', 'Panels and the workspace'],
              ]} />
            </Entry>

            <Entry part={F} title="Two scales" intent="Page scale for a tool that owns the screen. Panel scale for a tool that sits beside a canvas, the way a plug-in does.">
              <Spec head={['', 'Page scale', 'Panel scale']} rows={[
                ['Control height', '36px', '28px'],
                ['Text', '14px', '12px'],
                ['Padding', '20px', '12px'],
                ['Width', 'Up to 768px', '320px, docked right'],
                ['Components', 'Button, Tabs, Textarea, Panel', 'SmallButton, Select, Slider, Input, Toggle, PanelSection, PropRow'],
              ]} />
            </Entry>
          </section>

          {/* ---------- 02 Components ---------- */}
          <section id={C.id} className="scroll-mt-6 pt-16">
            <h2 className="text-3xl font-semibold tracking-tight">{C.title}</h2>
            <p className="mb-8 mt-2 max-w-xl text-sm text-ink-2">{C.intro}</p>

            <Entry part={C} title="Button" intent="One primary action per screen, in full ink. Everything else is quiet glass.">
              <Stage className="flex flex-wrap items-center gap-3">
                <Button>Run</Button><Button disabled>Run</Button><Button kind="quiet">Save 4 approved</Button><Button kind="quiet" disabled>Save 0 approved</Button>
                <span className="mx-2 h-6 w-px bg-line" />
                <SmallButton kind="primary">Generate</SmallButton><SmallButton>Stop</SmallButton><SmallButton disabled>Stop</SmallButton>
              </Stage>
              <Spec head={['Variant', 'Height', 'Used for']} rows={[
                ['Button primary', '36', 'The one thing the screen is for'],
                ['Button quiet', '36', 'Secondary actions: save, export, reset'],
                ['SmallButton', '28', 'Inside the docked panel'],
              ]} />
              <Spec head={['State', 'Change']} rows={[['Hover', 'Primary goes to pure white; quiet goes from lift to lift-hi'], ['Disabled', 'Fill drops to surface-3, text to ink-3, cursor shows not-allowed'], ['Working', 'Label changes to a verb ending in an ellipsis; the button disables']]} />
            </Entry>

            <Entry part={C} title="Tabs" intent="Switches between views of the same thing. The selected segment takes full ink.">
              <Stage><Tabs options={[{ id: 'one', label: 'Extract' }, { id: 'two', label: 'Extract and reply' }, { id: 'three', label: 'Ask the files' }]} value={tab} onPick={setTab} /></Stage>
            </Entry>

            <Entry part={C} title="Field" intent="Where a person gives the tool its material. Sunk into the ground so it reads as a place to put something.">
              <Stage className="space-y-3">
                <Textarea label="Sample field" value={text} onChange={setText} rows={3} />
                <div className="max-w-52"><Input label="Min type" type="number" value={minType} onChange={setMinType} suffix="px" /></div>
              </Stage>
              <Spec head={['State', 'Change']} rows={[['Rest', 'Hairline at line'], ['Hover and focus', 'Hairline brightens to line-hi; no glow, no colour'], ['Units', 'Sit inside the field at the right, in ink-3']]} />
            </Entry>

            <Entry part={C} title="File drop" intent="Where a person hands the tool a file. Drop one on it or press it to choose. A file just added arrives ticked, because adding it means use it.">
              <Stage><div className="max-w-80 space-y-2 text-xs">
                <RowList><TickRow checked={tick} onChange={setTick} label="Q3 review deck.pdf" meta="2.4 MB" /></RowList>
                <FileDrop onFiles={() => {}} accept=".pdf">Add files</FileDrop>
              </div></Stage>
              <Spec head={['Reads', 'How']} rows={[['PDF', 'Sent to the model whole, pages and layout included'], ['Images', 'Sent as pictures: PNG, JPEG, WebP, GIF'], ['Text', 'TXT, MD, CSV, JSON, HTML, sent inline'], ['Limit', '20 MB a file, 10 files a run']]} />
            </Entry>

            <Entry part={C} title="Select" intent="One choice from a short, known list.">
              <Stage><div className="max-w-52"><Select label="Preset pack" value={pack} onChange={setPack} options={[{ id: 'social', label: 'Social' }, { id: 'display', label: 'Display ads' }, { id: 'ooh', label: 'Out of home' }]} /></div></Stage>
            </Entry>

            <Entry part={C} title="Slider" intent="A value on a range, where the feel matters more than the exact number. The number still shows, in mono.">
              <Stage><div className="flex max-w-72 items-center gap-2"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></div></Stage>
            </Entry>

            <Entry part={C} title="Toggle and checkbox" intent="A toggle changes a rule and takes effect at once. A checkbox marks an item for an action that comes later.">
              <Stage className="flex flex-wrap items-center gap-8">
                <span className="flex items-center gap-2 text-xs text-ink-2"><Toggle label="Lock logo" checked={lockLogo} onChange={setLockLogo} />Lock logo</span>
                <Checkbox checked={fill} onChange={setFill}>Allow background fill</Checkbox>
              </Stage>
            </Entry>

            <Entry part={C} title="Chip" intent="A short fact about the thing beside it. Coloured only when the fact is a state.">
              <Stage className="flex flex-wrap gap-3"><Chip>design</Chip><Chip>high</Chip><Chip tone="success">Passed</Chip><Chip tone="warning">Review</Chip><Chip tone="error">Quote not found in the text</Chip></Stage>
            </Entry>

            <Entry part={C} title="Mark" intent="A spectrum dot and a name. The only place spectrum colour appears.">
              <Stage className="flex flex-wrap gap-6"><Mark color="violet">Model</Mark><Mark color="cobalt">Context</Mark><Mark color="marigold">Tools</Mark><Mark color="green">Prompt</Mark></Stage>
            </Entry>

            <Entry part={C} title="Status pill" intent="Tells a person, at all times, whether answers are live or samples.">
              <Stage className="flex flex-wrap gap-3"><StatusPill mode="claude" model="claude-sonnet-5-5" /><StatusPill mode="sample" /><StatusPill mode={null} /></Stage>
            </Entry>

            <Entry part={C} title="Status mark" intent="A dot and a word for a tight header, where a pill would be too heavy. The word carries the meaning.">
              <Stage className="flex flex-wrap items-center gap-6">
                <StatusMark tone="success">Connected</StatusMark><StatusMark tone="warning">Sample output</StatusMark><StatusMark tone="error">1 failed</StatusMark><StatusMark busy>Working</StatusMark>
                <span className="mx-2 h-4 w-px bg-line" />
                <StatusChip status="ready" /><StatusChip status="review" /><StatusChip status="failed" /><StatusChip status="working" />
              </Stage>
            </Entry>

            <Entry part={C} title="Panel" intent="A group of related things, one step up from the ground, named by a label.">
              <Stage><Panel title="Reply draft" aside={<Chip tone="success">3 checks passed</Chip>}><p className="text-sm text-ink-2">Thanks for the clear notes. We are enlarging the logo on the mobile banner.</p></Panel></Stage>
            </Entry>

            <Entry part={C} title="Panel section" intent="A collapsible group in the docked panel. Rows put the name on the left and the control on the right.">
              <Stage className="p-0"><div className="max-w-80 border-r border-line bg-surface-1">
                <PanelSection title="Brand rules" aside={<span className={MONO}>3</span>}>
                  <PropRow label="Safe margin"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></PropRow>
                  <PropRow label="Min type"><Input label="Min type" type="number" value={minType} onChange={setMinType} suffix="px" /></PropRow>
                  <PropRow label="Lock logo"><Toggle label="Lock logo" checked={lockLogo} onChange={setLockLogo} /></PropRow>
                </PanelSection>
                <PanelSection title="Checks" open={false}><p className="text-xs text-ink-3">Nothing to show.</p></PanelSection>
              </div></Stage>
            </Entry>

            <Entry part={C} title="List rows" intent="One 28px line per thing. A plain row to read, a tick row to mark for the action that follows, and a list row with one control at its end.">
              <Stage className="p-0"><div className="max-w-80 border-r border-line bg-surface-1 p-3 text-xs">
                <RowList>
                  <TickRow checked={tick} onChange={setTick} label="Story" meta="1080 × 1920" end={<StatusChip status="ready" />} />
                  <TickRow checked={false} onChange={() => {}} disabled label="Leaderboard" meta="728 × 90" end={<StatusChip status="failed" />} note="Headline falls below the minimum type size." />
                  <PanelRow label="Legal line is present" end={<Chip tone="success">Passed</Chip>} />
                </RowList>
                <ul className="mt-2 border-t border-line pt-2"><ListRow name="Logo" meta="Brand mark"><Toggle label="Lock logo layer" checked={lockLogo} onChange={setLockLogo} /></ListRow></ul>
                <p className="mt-2 px-1"><Count>3 of 6</Count></p>
              </div></Stage>
              <Spec head={['Row', 'Used for']} rows={[['TickRow', 'Items a person chooses between; the whole line is the target'], ['PanelRow', 'A fact with something at its end'], ['ListRow', 'A named thing with one control'], ['Count', 'A number in a section header or at a row end']]} />
            </Entry>

            <Entry part={C} title="Check row" intent="One rule and whether it held. If it failed, the row says where.">
              <Stage><div className="max-w-80 space-y-2">
                <CheckRow rule="Logo keeps its clear space" pass />
                <CheckRow rule="Type is at least 14px" pass={false} where="Leaderboard" />
              </div></Stage>
            </Entry>

            <Entry part={C} title="Page form rows" intent="The same controls at page scale: 36px tall, 14px text, the name on the left. For a tool that owns the screen.">
              <Stage><div className="max-w-sm">
                <SettingRow label="Safe margin"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></SettingRow>
                <SettingRow label="Smallest type"><NumberField label="Smallest type" value={minType} onChange={setMinType} suffix="px" /></SettingRow>
                <SwitchRow label="Keep the logo locked" checked={lockLogo} onChange={setLockLogo} />
                <CheckField checked={approved} onChange={setApproved}>Approved</CheckField>
              </div></Stage>
            </Entry>

            <Entry part={C} title="Progress" intent="For a wait with a known length. Says what is happening, in words, and how far along it is.">
              <Stage className="space-y-5"><div className="max-w-72"><Progress label="Planning layouts" value={66} /></div><Progress inline label="Making sizes" value={83} /></Stage>
              <Spec head={['Variant', 'Used for']} rows={[['Stacked', 'A panel footer, above the action it belongs to'], ['Inline', 'A status bar, on one line']]} />
            </Entry>

            <Entry part={C} title="Thumb" intent="One output on the canvas, drawn at its true proportions, with its name, its size and whether it passed.">
              <Stage><div className="grid max-w-xl grid-cols-3 gap-3">
                {SIZES.slice(0, 3).map((s) => <Thumb key={s.name} {...s} selected={picked === s.name} onClick={() => setPicked(s.name)} />)}
              </div></Stage>
              <Spec head={['Status', 'Chip', 'Means']} rows={[['ready', 'Passed', 'Every check in code passed'], ['review', 'Review', 'Passed, but a person should look'], ['failed', 'Failed', 'A check failed; the reason shows in the panel'], ['working', 'Working', 'Still being made; the frame pulses']]} />
            </Entry>

            <Entry part={C} title="Undecided" intent="Something not decided or not built. Loud on purpose, so it cannot ship by accident.">
              <Stage className="flex gap-3"><Undecided /><Undecided what="tool name" /></Stage>
            </Entry>
          </section>

          {/* ---------- 03 Motion ---------- */}
          <section id={M.id} className="scroll-mt-6 pt-16">
            <h2 className="text-3xl font-semibold tracking-tight">{M.title}</h2>
            <p className="mb-8 mt-2 max-w-xl text-sm text-ink-2">{M.intro}</p>

            <Entry part={M} title="Principles" intent="Three rules cover every case.">
              <Spec head={['Rule', 'Why']} rows={[
                ['Motion marks a change', 'If nothing changed for the person, nothing moves'],
                ['Arrive slower than you leave', 'A result deserves a beat; a dismissal should not make anyone wait'],
                ['Small distances', 'A result rises 6px. Travel reads as delay when someone is working'],
              ]} />
            </Entry>

            <Entry part={M} title="Easing and timing" intent="One curve and four durations. Pick by what the motion does, not by the nearest number.">
              <Stage>
                <div className="flex items-center gap-4">
                  <SmallButton onClick={() => setReplay((n) => n + 1)}>Replay</SmallButton>
                  <div key={replay} className="enter rounded-row border border-line bg-lift px-3 py-2 text-sm">A result arriving</div>
                </div>
              </Stage>
              <Spec head={['Token', 'Value', 'Used for']} rows={[
                ['--ease-out-n1', 'cubic-bezier(.22, 1, .36, 1)', 'Everything. Fast start, long settle'],
                ['--t-hover', '120ms', 'Colour and border on hover'],
                ['--t-ui', '160ms', 'A control changing state: toggle, tab, checkbox'],
                ['--t-state', '200ms', 'A surface appearing: a result, a note'],
                ['--t-reveal', '400ms', 'A whole panel arriving'],
              ]} />
            </Entry>

            <Entry part={M} title="Templates" intent="Three ways a figure arrives. Each plays once, in reading order, and all three switch off under reduced motion.">
              <Stage>
                <div className="flex flex-wrap items-start gap-10">
                  <SmallButton onClick={() => setReplay((n) => n + 1)}>Replay</SmallButton>
                  <ul key={`s${replay}`} className="stagger w-40 space-y-2">
                    {['First', 'Second', 'Third'].map((t) => <li key={t} className="rounded-row border border-line bg-lift px-3 py-2 text-sm">{t}</li>)}
                  </ul>
                  <div key={`d${replay}`} className="w-40 pt-4"><span className="draw-x block h-px bg-line-hi" /></div>
                  <ol key={`q${replay}`} className="seq flex w-64">
                    {['v1', 'v2', 'v3'].map((t, n) => (
                      <li key={t} className="flex-1">
                        <div className="flex items-center"><span className="h-3 w-3 shrink-0 rounded-full bg-ink-1" />{n < 2 && <span className="draw-x h-px flex-1 bg-line-hi" />}</div>
                        <p className="mt-2 font-mono text-xs text-ink-3">{t}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </Stage>
              <Spec head={['Class', 'What it does', 'Use it for']} rows={[
                ['.stagger', 'Children rise 10px and fade in, 80ms apart. Set --step to change the gap', 'A figure built from parts: cards, columns, rows'],
                ['.draw-x, .draw-y', 'A line grows from its start over 700ms. Set --d to delay it', 'Connectors, rules, the wires between boxes'],
                ['.seq', 'Items arrive 220ms apart, and each .draw-x line waits for the item before it', 'Anything with an order: gates, passes, a roadmap'],
              ]} />
            </Entry>

            <Entry part={M} title="Reduced motion" intent="When the system asks for less motion, every transition and animation drops to nothing. Nothing is lost, because motion never carries information by itself.">
              <Spec head={['With reduced motion', 'Becomes']} rows={[['A result rising in', 'Appears in place'], ['The skeleton pulsing', 'A still block'], ['The working frame pulsing', 'A still frame with its "Working" chip']]} />
            </Entry>
          </section>

          {/* ---------- 04 Interaction ---------- */}
          <section id={I.id} className="scroll-mt-6 pt-16">
            <h2 className="text-3xl font-semibold tracking-tight">{I.title}</h2>
            <p className="mb-8 mt-2 max-w-xl text-sm text-ink-2">{I.intro}</p>

            <Entry part={I} title="Hover" intent="Hover brings a thing one step toward full ink. It never moves, grows or changes hue.">
              <Spec head={['Element', 'At rest', 'Hovered']} rows={[['Quiet button', 'lift', 'lift-hi'], ['Field', 'line', 'line-hi'], ['Nav link', 'ink-3', 'ink-1'], ['Frame on the canvas', 'line', 'line-hi']]} />
            </Entry>

            <Entry part={I} title="Focus and keyboard" intent="Everything a pointer can do, Tab and Enter can do. Focus shows as one ring, the same everywhere.">
              <Stage className="flex items-center gap-4">
                <span className="inline-flex h-9 items-center rounded-btn bg-ink-1 px-4 text-sm font-medium text-ground outline-2 outline-offset-2 outline-[#E7E5E4]">Run</span>
                <span className={MONO}>2px · #E7E5E4 · 2px offset</span>
              </Stage>
              <Spec head={['Key', 'Does']} rows={[['Tab', 'Moves through controls in reading order'], ['Enter or Space', 'Presses the focused button, opens a section'], ['Arrow keys', 'Move a slider, change a select']]} />
            </Entry>

            <Entry part={I} title="Targets" intent="Small controls still need room to be hit.">
              <Spec head={['Scale', 'Smallest target']} rows={[['Page', '36 × 36'], ['Panel', '28 tall, full row width where it can be']]} />
            </Entry>

            <Entry part={I} title="The four states" intent="Every screen that asks the tool for something shows all four. A failure is one plain sentence that says what to do.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label className="mb-2">Empty</Label><EmptyState>Results appear here.</EmptyState></div>
                <div><Label className="mb-2">Working</Label><Skeleton lines={1} /></div>
                <div><Label className="mb-2">Done</Label><Panel><p className="text-sm">Enlarge logo on mobile banner</p></Panel></div>
                <div><Label className="mb-2">Failed</Label><ErrorNote message="The API key was rejected. Check ANTHROPIC_API_KEY in .env.local." /></div>
              </div>
            </Entry>
          </section>

          {/* ---------- 05 Patterns ---------- */}
          <section id={P.id} className="scroll-mt-6 pt-16">
            <h2 className="text-3xl font-semibold tracking-tight">{P.title}</h2>
            <p className="mb-8 mt-2 max-w-xl text-sm text-ink-2">{P.intro}</p>

            <Entry part={P} title="Run and result" intent="Page scale. Material in, one action, the result below it. For tools that own the screen.">
              <Stage className="space-y-4">
                <Panel title="Client feedback"><Textarea label="Client feedback" value={text} onChange={setText} rows={2} /><div className="mt-3"><Button>Run</Button></div></Panel>
                <Panel title="Action items"><p className="text-sm">Enlarge logo on mobile banner</p><p className="mt-1 text-xs text-ink-3">“The logo feels too small on the mobile banner”</p></Panel>
              </Stage>
            </Entry>

            <Entry part={P} title="Canvas and docked panel" intent="Panel scale. The work on the left at its true proportions, the rules and the run on the right. For tools that live beside a canvas.">
              <Workspace
                toolbar={<><span className="font-medium text-ink-1">Spring campaign · key visual</span><span>3 of 6 passed</span></>}
                canvas={
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {SIZES.map((s) => (
                      <Thumb key={s.name} {...s} selected={picked === s.name} onClick={() => setPicked(s.name)}>
                        <span className="absolute inset-x-[12%] top-[14%] h-[38%] rounded-[1px] bg-surface-3" />
                        <span className="absolute bottom-[26%] left-[12%] h-[7%] w-[56%] rounded-[1px] bg-ink-3/60" />
                        <span className="absolute bottom-[10%] right-[10%] h-[8%] w-[16%] rounded-[1px] bg-accent/70" />
                      </Thumb>
                    ))}
                  </div>
                }
                panel={
                  <>
                    <PanelSection title="Sizes" aside={<span className={MONO}>6</span>}>
                      <PropRow label="Preset pack"><Select label="Preset pack" value={pack} onChange={setPack} options={[{ id: 'social', label: 'Social' }, { id: 'display', label: 'Display ads' }, { id: 'ooh', label: 'Out of home' }]} /></PropRow>
                    </PanelSection>
                    <PanelSection title="Brand rules">
                      <PropRow label="Safe margin"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></PropRow>
                      <PropRow label="Min type"><Input label="Min type" type="number" value={minType} onChange={setMinType} suffix="px" /></PropRow>
                      <PropRow label="Lock logo"><Toggle label="Lock logo" checked={lockLogo} onChange={setLockLogo} /></PropRow>
                      <Checkbox checked={fill} onChange={setFill}>Allow background fill</Checkbox>
                    </PanelSection>
                    <PanelSection title="Run">
                      <Progress label="Planning layouts" value={66} />
                      <div className="flex gap-2 pt-1"><SmallButton kind="primary" wide>Generate</SmallButton><SmallButton>Stop</SmallButton></div>
                    </PanelSection>
                  </>
                }
              />
            </Entry>

            <Entry part={P} title="Propose, check, approve" intent="The model proposes, code checks, the person decides. What failed a check arrives unticked and says why.">
              <Stage>
                <ul className="divide-y divide-line">
                  <li className="flex gap-3 py-3">
                    <input type="checkbox" checked={kept} onChange={(e) => setKept(e.target.checked)} aria-label="Keep: Enlarge logo" className="mt-1 h-4 w-4 accent-[var(--color-ink-1)]" />
                    <div><p className="text-sm font-medium">Enlarge logo on mobile banner</p><p className="mt-1 text-xs text-ink-3">“The logo feels too small on the mobile banner”</p><p className="mt-2 flex gap-2"><Chip>design</Chip><Chip>medium</Chip></p></div>
                  </li>
                  <li className="flex gap-3 py-3">
                    <input type="checkbox" readOnly checked={false} aria-label="Keep: Send revised files" className="mt-1 h-4 w-4 accent-[var(--color-ink-1)]" />
                    <div><p className="text-sm font-medium text-ink-3 line-through">Send revised files by Friday</p><p className="mt-1 text-xs text-ink-3">“we need the revised files by Friday”</p><p className="mt-2 flex gap-2"><Chip>account</Chip><Chip tone="error">Quote not found in the text</Chip></p></div>
                  </li>
                </ul>
                <div className="mt-4"><Button kind="quiet" disabled={!kept}>Save {kept ? 1 : 0} approved</Button></div>
              </Stage>
            </Entry>

            <Entry part={P} title="Three forms" intent="The same tool as a web app, a plug-in panel and a desktop app. Each is a shell with slots; the plan says which one a tool uses.">
              <Spec head={['Form', 'Shell', 'Scale', 'When']} rows={[
                [<a key="w" href="/forms/web" className="underline decoration-line-hi underline-offset-4">Web app</a>, 'WebShell', 'Page', 'People open it in a browser and will not install anything'],
                [<a key="p" href="/forms/plugin" className="underline decoration-line-hi underline-offset-4">Plug-in</a>, 'PluginShell', 'Panel, 320 wide', 'The work already lives in another application'],
                [<a key="d" href="/forms/desktop" className="underline decoration-line-hi underline-offset-4">Desktop app</a>, 'DesktopShell', 'Panel chrome, full window', 'Long sessions with many files, or files that must stay on the machine'],
              ]} />
            </Entry>
          </section>
        </main>
      </div>
    </div>
  );
}
