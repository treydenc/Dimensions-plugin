'use client';
// The plug-in form of the resize tool, shown docked in a stand-in host application.
// Same sample data as the web and desktop forms (lib/demo-resize.ts).
import { useState } from 'react';
import { Input, PanelSection, Progress, PropRow, Select, Slider, SmallButton, Toggle } from '@/components/ui';
import { Count, HostFrame, PanelRow, PluginShell, RowList, StatusChip, StatusMark, TickRow } from '@/components/shells/PluginShell';
import { CHECKS, JOB, LAYERS, PASSED, RULES, SIZES, TOOL_NAME } from '@/lib/demo-resize';

type Role = (typeof LAYERS)[number]['role'];

// Plain words for what each layer is in the picture.
const ROLES: { id: Role; label: string }[] = [
  { id: 'background', label: 'Backdrop' },
  { id: 'hero', label: 'Main picture' },
  { id: 'headline', label: 'Main text' },
  { id: 'logo', label: 'Brand mark' },
  { id: 'legal', label: 'Small print' },
];

export default function PluginForm() {
  // Sizes that passed arrive ticked. Ones that need a look arrive unticked; failed and unfinished ones cannot be ticked.
  const [ticked, setTicked] = useState<string[]>(() => SIZES.filter((s) => s.status === 'ready').map((s) => s.id));
  const [approved, setApproved] = useState(false);
  const [margin, setMargin] = useState(RULES.safeMargin);
  const [minType, setMinType] = useState(String(RULES.minType));
  const [lockLogo, setLockLogo] = useState(RULES.lockLogo);
  const [allowFill, setAllowFill] = useState(RULES.allowFill);
  const [layers, setLayers] = useState(LAYERS);

  const failed = SIZES.filter((s) => s.status === 'failed').length;
  const review = SIZES.filter((s) => s.status === 'review').length;
  const working = SIZES.find((s) => s.status === 'working');
  const made = SIZES.filter((s) => s.status !== 'working').length;
  const checksPassed = CHECKS.filter((c) => c.pass).length;
  const locked = layers.filter((l) => l.locked).length;

  const tick = (id: string, on: boolean) => {
    setApproved(false);
    setTicked((now) => (on ? [...now, id] : now.filter((x) => x !== id)));
  };
  const setLayer = (i: number, change: Partial<(typeof LAYERS)[number]>) =>
    setLayers((now) => now.map((l, j) => (j === i ? { ...l, ...change } : l)));

  const status = failed > 0 ? <StatusMark tone="error">{failed} failed</StatusMark>
    : review > 0 ? <StatusMark tone="warning">{review} to review</StatusMark>
    : working ? <StatusMark busy>Running</StatusMark>
    : <StatusMark tone="success">All passed</StatusMark>;

  return (
    <HostFrame>
      <PluginShell
        title={TOOL_NAME}
        status={status}
        bodyLabel="Sizes, rules, layers and checks"
        context={
          <>
            <span className="min-w-0 truncate text-ink-1">{JOB.name}</span>
            <span className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-ink-3">{JOB.source}</span>
          </>
        }
        footer={
          <>
            <Progress label={working ? `Resizing ${working.name}` : 'Every size is made'} value={(made / SIZES.length) * 100} />
            <div className="flex">
              <SmallButton kind="primary" wide disabled={approved || ticked.length === 0} onClick={() => setApproved(true)}>
                {approved ? `${ticked.length} approved` : `Approve ${ticked.length}`}
              </SmallButton>
            </div>
          </>
        }
      >
        <PanelSection title="Sizes" aside={<Count>{PASSED} of {SIZES.length}</Count>}>
          <RowList>
            {SIZES.map((s) => (
              <TickRow
                key={s.id}
                label={s.name}
                meta={`${s.w} × ${s.h}`}
                end={<StatusChip status={s.status} />}
                note={s.note}
                checked={ticked.includes(s.id)}
                disabled={s.status === 'failed' || s.status === 'working'}
                onChange={(on) => tick(s.id, on)}
              />
            ))}
          </RowList>
        </PanelSection>

        <PanelSection title="Brand rules">
          <PropRow label="Safe margin"><Slider label="Safe margin" value={margin} onChange={setMargin} min={0} max={12} suffix="%" /></PropRow>
          <PropRow label="Smallest type"><Input label="Smallest type" type="number" value={minType} onChange={setMinType} suffix="px" /></PropRow>
          <PropRow label="Lock logo"><Toggle label="Lock logo" checked={lockLogo} onChange={setLockLogo} /></PropRow>
          <PropRow label="Allow fill"><Toggle label="Allow fill" checked={allowFill} onChange={setAllowFill} /></PropRow>
        </PanelSection>

        <PanelSection title="Layers" aside={<Count>{locked} locked</Count>} open={false}>
          {layers.map((l, i) => (
            <PropRow key={l.name} label={l.name}>
              <Select label={`${l.name} is the`} value={l.role} onChange={(role) => setLayer(i, { role })} options={ROLES} />
              <Toggle label={`Lock ${l.name}`} checked={l.locked} onChange={(on) => setLayer(i, { locked: on })} />
            </PropRow>
          ))}
        </PanelSection>

        <PanelSection title="Checks" aside={<Count>{checksPassed} of {CHECKS.length}</Count>}>
          <RowList>
            {CHECKS.map((c) => (
              <PanelRow key={c.rule} label={<span className="text-ink-2">{c.rule}</span>} end={<StatusChip status={c.pass ? 'ready' : 'failed'} />} />
            ))}
          </RowList>
        </PanelSection>
      </PluginShell>
    </HostFrame>
  );
}
