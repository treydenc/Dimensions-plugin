'use client';
// The desktop app form of the resize tool. Same sample data as the web app and plug-in forms.
import { useState } from 'react';
import { CheckRow, DesktopShell, InspectorHeader, ListRow, SidebarRow, SidebarSection, StatusItem } from '@/components/shells/DesktopShell';
import { Chip, EmptyState, Input, PanelSection, Progress, PropRow, Select, Slider, SmallButton, Thumb, Toggle } from '@/components/ui';
import { CHECKS, JOB, LAYERS, RULES, SIZES, TOOL_NAME } from '@/lib/demo-resize';

// Only the first job has sample output. The others show the empty state.
const JOBS = [JOB.name, 'Summer sale', 'Store opening', 'Autumn lookbook'];

const ROLE_WORD = { background: 'Backdrop', hero: 'Main image', headline: 'Title', logo: 'Brand mark', legal: 'Small print' } as const;

type Channel = 'all' | 'Social' | 'Display';
const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'all', label: 'All channels' },
  { id: 'Social', label: 'Social' },
  { id: 'Display', label: 'Display' },
];

export default function DesktopForm() {
  const [job, setJob] = useState(JOB.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>('all');
  const [picked, setPicked] = useState('landscape');
  const [approved, setApproved] = useState<string[]>([]);
  const [margin, setMargin] = useState(RULES.safeMargin);
  const [minType, setMinType] = useState(String(RULES.minType));
  const [allowFill, setAllowFill] = useState(RULES.allowFill);
  const [locks, setLocks] = useState<Record<string, boolean>>(() => Object.fromEntries(LAYERS.map((l) => [l.name, l.name === 'Logo' ? RULES.lockLogo : l.locked])));

  const hasWork = job === JOB.name;
  const sizes = hasWork ? SIZES : [];
  const shown = sizes.filter((s) => channel === 'all' || s.channel === channel);
  const current = shown.find((s) => s.id === picked);
  const passedIds = sizes.filter((s) => s.status === 'ready').map((s) => s.id);
  const allPassedApproved = passedIds.every((id) => approved.includes(id));
  const made = sizes.filter((s) => s.status !== 'working').length;
  const checksPassed = CHECKS.filter((c) => c.pass).length;
  const isApproved = current ? approved.includes(current.id) : false;
  const canApprove = current ? current.status === 'ready' || current.status === 'review' : false;

  const toggleApproved = (id: string) => setApproved((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const setLock = (name: string, locked: boolean) => setLocks((l) => ({ ...l, [name]: locked }));

  return (
    <DesktopShell
      name={TOOL_NAME}
      title={job}
      sidebarLabel="Jobs"
      sidebarOpen={menuOpen}
      onSidebarOpenChange={setMenuOpen}
      inspectorLabel="Selected size"
      actions={
        <>
          <SmallButton disabled={approved.length === 0}>Export</SmallButton>
          <SmallButton kind="primary" disabled={!hasWork || allPassedApproved} onClick={() => setApproved((a) => Array.from(new Set([...a, ...passedIds])))}>
            Approve all passed
          </SmallButton>
        </>
      }
      sidebar={
        <>
          <SidebarSection title="Jobs">
            {JOBS.map((j) => (
              <SidebarRow key={j} selected={j === job} onClick={() => { setJob(j); setMenuOpen(false); }}>{j}</SidebarRow>
            ))}
          </SidebarSection>
          {hasWork && (
            <SidebarSection title="Layers" aside="Locked">
              {LAYERS.map((l) => (
                <ListRow key={l.name} name={l.name} meta={ROLE_WORD[l.role]}>
                  <Toggle label={`Lock ${l.name}`} checked={locks[l.name]} onChange={(v) => setLock(l.name, v)} />
                </ListRow>
              ))}
            </SidebarSection>
          )}
        </>
      }
      toolbar={
        <>
          <span className="text-ink-1">
            {shown.length === sizes.length ? `${sizes.length} sizes` : `${shown.length} of ${sizes.length} sizes`}
            {approved.length > 0 && <span className="text-ink-3"> · {approved.length} approved</span>}
          </span>
          <span className="w-36"><Select label="Channel" value={channel} onChange={setChannel} options={CHANNELS} /></span>
        </>
      }
      inspector={
        current ? (
          <>
            <InspectorHeader name={current.name} meta={`${current.w} × ${current.h}`} note={current.note}>
              <SmallButton disabled={!canApprove} onClick={() => toggleApproved(current.id)}>{isApproved ? 'Undo approval' : 'Approve'}</SmallButton>
              {isApproved && <Chip tone="success">Approved</Chip>}
            </InspectorHeader>
            <PanelSection title="Brand rules">
              <PropRow label="Safe margin"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></PropRow>
              <PropRow label="Smallest type"><Input label="Smallest type" type="number" value={minType} onChange={setMinType} suffix="px" /></PropRow>
              <PropRow label="Lock logo"><Toggle label="Lock logo" checked={locks.Logo} onChange={(v) => setLock('Logo', v)} /></PropRow>
              <PropRow label="Allow fill"><Toggle label="Allow fill" checked={allowFill} onChange={setAllowFill} /></PropRow>
            </PanelSection>
            <PanelSection title="Checks" aside={<span className="font-mono text-[11px] normal-case tracking-normal text-ink-3">{checksPassed} of {CHECKS.length}</span>}>
              {CHECKS.map((c) => (
                <CheckRow key={c.rule} rule={c.rule.replace(`${RULES.minType}px`, `${minType || 0}px`)} pass={c.pass} where={c.where} />
              ))}
            </PanelSection>
          </>
        ) : (
          <div className="p-3"><EmptyState>No size selected.</EmptyState></div>
        )
      }
      statusbar={
        hasWork ? (
          <>
            <div className="w-48 shrink-0"><Progress label="Making sizes" value={(made / sizes.length) * 100} /></div>
            <StatusItem grow>{JOB.source}</StatusItem>
            <StatusItem>Updated {JOB.updated}</StatusItem>
          </>
        ) : (
          <StatusItem>No source file yet.</StatusItem>
        )
      }
    >
      {shown.length === 0 ? (
        <EmptyState>{hasWork ? 'No sizes in this channel.' : 'Nothing has been made for this job yet.'}</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((s) => (
            <Thumb key={s.id} name={s.name} w={s.w} h={s.h} status={s.status} selected={s.id === picked} onClick={() => setPicked(s.id)}>
              <span className="absolute inset-x-[12%] top-[14%] h-[38%] bg-surface-3" />
              <span className="absolute bottom-[26%] left-[12%] h-[7%] w-[56%] bg-ink-3/60" />
              <span className="absolute bottom-[10%] right-[10%] h-[8%] w-[16%] bg-accent/70" />
            </Thumb>
          ))}
        </div>
      )}
    </DesktopShell>
  );
}
