'use client';
// The resize tool as a hosted web app: page scale, the outputs in the main column,
// the selected output's checks and the brand rules in the side column, one primary action.
// Sample data only; nothing here calls a server.
import { useEffect, useRef, useState } from 'react';
import { Button, Chip, Panel, Skeleton, Slider, Thumb } from '@/components/ui';
import { NumberField, Preview, Row, Section, SwitchRow, TickRow, WebShell } from '@/components/shells/WebShell';
import { CHECKS, JOB, PASSED, RULES, SIZES, type SizeStatus, TOOL_NAME } from '@/lib/demo-resize';

type Rules = { safeMargin: number; minType: string; lockLogo: boolean; allowFill: boolean };
const START: Rules = { ...RULES, minType: String(RULES.minType) };
const same = (a: Rules, b: Rules) => a.safeMargin === b.safeMargin && a.minType === b.minType && a.lockLogo === b.lockLogo && a.allowFill === b.allowFill;

const CHANNELS = Array.from(new Set(SIZES.map((s) => s.channel)));
const canApprove = (status: SizeStatus) => status === 'ready' || status === 'review';

/** Stand-in artwork: a picture, a headline, a logo. */
function Art() {
  return (
    <>
      <span className="absolute inset-x-[12%] top-[14%] h-[38%] bg-surface-3" />
      <span className="absolute bottom-[26%] left-[12%] h-[7%] w-[56%] bg-ink-3/60" />
      <span className="absolute bottom-[10%] right-[10%] h-[8%] w-[16%] bg-accent/70" />
    </>
  );
}

export default function WebForm() {
  const [picked, setPicked] = useState('landscape');
  // What passed every check arrives ticked. What needs a look waits for a person.
  const [approved, setApproved] = useState<Record<string, boolean>>(() => Object.fromEntries(SIZES.map((s) => [s.id, s.status === 'ready'])));
  const [rules, setRules] = useState<Rules>(START);
  const [checkedWith, setCheckedWith] = useState<Rules>(START);
  const [checking, setChecking] = useState(false);
  const [save, setSave] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const later = (ms: number, then: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(then, ms);
  };
  const setRule = <K extends keyof Rules>(key: K, value: Rules[K]) => setRules((r) => ({ ...r, [key]: value }));
  const statusOf = (status: SizeStatus): SizeStatus => (checking ? 'working' : status);

  const size = SIZES.find((s) => s.id === picked) ?? SIZES[0];
  const status = statusOf(size.status);
  const count = SIZES.filter((s) => canApprove(s.status) && approved[s.id]).length;
  const rulesChanged = !same(rules, checkedWith);

  const checkAgain = () => {
    setChecking(true);
    setSave('idle');
    const next = rules;
    later(1400, () => { setCheckedWith(next); setChecking(false); });
  };
  const saveApproved = () => {
    setSave('saving');
    later(900, () => setSave('saved'));
  };

  return (
    <WebShell
      tool={TOOL_NAME}
      title={JOB.name}
      meta={JOB.source}
      status={
        checking ? null
        : save === 'saved' ? <span className="enter"><Chip tone="success">Saved</Chip></span>
        : <><Chip>{PASSED} of {SIZES.length} passed</Chip><span className="hidden sm:inline">Updated {JOB.updated}</span></>
      }
      actions={
        <Button onClick={saveApproved} disabled={count === 0 || checking || save !== 'idle'}>
          {save === 'saving' ? 'Saving…' : `Save ${count} approved`}
        </Button>
      }
      aside={
        <>
          <Panel title="Checks">
            <Preview w={size.w} h={size.h} label={`${size.name}, ${size.w} by ${size.h}`} working={status === 'working'}><Art /></Preview>
            {status === 'working' ? (
              <div className="mt-4"><Skeleton lines={2} /></div>
            ) : (
              <>
                {size.note && <p className="mt-4 leading-relaxed text-ink-1">{size.note}</p>}
                <ul className="mt-3 divide-y divide-line">
                  {CHECKS.map((c) => {
                    const pass = c.pass || c.where !== size.name;
                    return (
                      <li key={c.rule} className="flex items-center justify-between gap-3 py-2.5 text-ink-2">
                        <span>{c.rule.replace(`${RULES.minType}px`, `${checkedWith.minType}px`)}</span>
                        <Chip tone={pass ? 'success' : 'error'}>{pass ? 'Passed' : 'Failed'}</Chip>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <div className="mt-2 border-t border-line pt-2">
              <TickRow
                checked={canApprove(status) && !!approved[size.id]}
                disabled={!canApprove(status)}
                onChange={(on) => { setApproved((a) => ({ ...a, [size.id]: on })); setSave('idle'); }}
              >
                Approved
              </TickRow>
            </div>
          </Panel>

          <Panel
            title="Brand rules"
            aside={(rulesChanged || checking) && <Button kind="quiet" onClick={checkAgain} disabled={checking}>{checking ? 'Checking…' : 'Check again'}</Button>}
          >
            <div className="space-y-1">
              <Row label="Safe margin"><Slider label="Safe margin" value={rules.safeMargin} onChange={(v) => setRule('safeMargin', v)} min={0} max={12} suffix="%" /></Row>
              <Row label="Smallest type"><NumberField label="Smallest type" value={rules.minType} onChange={(v) => setRule('minType', v)} min={6} max={72} suffix="px" /></Row>
              <SwitchRow label="Keep the logo locked" checked={rules.lockLogo} onChange={(v) => setRule('lockLogo', v)} />
              <SwitchRow label="Allow background fill" checked={rules.allowFill} onChange={(v) => setRule('allowFill', v)} />
            </div>
          </Panel>
        </>
      }
    >
      {CHANNELS.map((channel) => (
        <Section key={channel} title={channel}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {SIZES.filter((s) => s.channel === channel).map((s) => (
              <Thumb key={s.id} name={s.name} w={s.w} h={s.h} status={statusOf(s.status)} selected={s.id === picked} onClick={() => setPicked(s.id)}>
                <Art />
              </Thumb>
            ))}
          </div>
        </Section>
      ))}
    </WebShell>
  );
}
