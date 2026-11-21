// The design system. Every screen is built from these. See /kit for all of them.
// No hooks in this file, so server and client pages can both use it.
import Link from 'next/link';
import type { ReactNode } from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** Small uppercase label above a group. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3', className)}>{children}</p>;
}

export function Button({
  children, onClick, disabled, kind = 'primary', type = 'button',
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'quiet'; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex h-9 items-center justify-center rounded-btn px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        kind === 'primary' && 'bg-ink-1 text-ground hover:bg-white disabled:bg-surface-3 disabled:text-ink-3',
        kind === 'quiet' && 'border border-line bg-lift text-ink-1 hover:bg-lift-hi disabled:text-ink-3 disabled:hover:bg-lift',
      )}
    >
      {children}
    </button>
  );
}

export function Panel({ title, children, aside, className }: { title?: string; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-panel border border-line bg-surface-1 p-5', className)}>
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <Label>{title}</Label>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Textarea({
  value, onChange, rows = 4, label,
}: { value: string; onChange: (value: string) => void; rows?: number; label: string }) {
  return (
    <textarea
      value={value}
      rows={rows}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-btn border border-line bg-ground p-3 text-sm leading-relaxed text-ink-1 placeholder:text-ink-3 focus:border-line-hi focus:outline-none"
    />
  );
}

export function Tabs<T extends string>({
  options, value, onPick,
}: { options: { id: T; label: string }[]; value: T; onPick: (id: T) => void }) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-btn border border-line bg-lift p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          onClick={() => onPick(o.id)}
          className={cx(
            'rounded-row px-3 py-1.5 text-sm transition-colors',
            o.id === value ? 'bg-ink-1 font-medium text-ground' : 'text-ink-2 hover:bg-lift-hi',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const TONES = {
  neutral: 'border-line text-ink-2',
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  error: 'border-error/40 text-error',
} as const;

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cx('inline-flex items-center rounded-row border px-2 py-0.5 text-xs', TONES[tone])}>{children}</span>;
}

/** A category mark: a spectrum dot plus its name. Colour is never the only label. */
export function Mark({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-1">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: `var(--color-${color})` }} />
      {children}
    </span>
  );
}

export function StatusPill({ mode, model }: { mode: 'claude' | 'sample' | null; model?: string }) {
  if (!mode) return <span className="h-7 w-32 animate-pulse rounded-btn bg-lift" />;
  const live = mode === 'claude';
  return (
    <span className={cx('inline-flex h-7 items-center gap-2 rounded-btn border px-3 text-xs', live ? 'border-success/40 text-success' : 'border-warning/40 text-warning')}>
      <span aria-hidden className={cx('h-1.5 w-1.5 rounded-full', live ? 'bg-success' : 'bg-warning')} />
      {live ? `Claude connected · ${model}` : 'Sample output · no API key'}
    </span>
  );
}

export function Skeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-panel bg-lift" />
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-panel border border-dashed border-line px-5 py-8 text-center text-sm text-ink-3">{children}</p>;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-btn border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
      {message}
    </p>
  );
}

/** A decision that has not been made. Deliberately loud so it cannot ship by accident. */
export function Undecided({ what }: { what?: string }) {
  return <span className="inline-block whitespace-nowrap rounded-row border border-dashed border-warning/60 px-1.5 py-0.5 font-mono text-xs text-warning">[ {what ?? 'undecided'} ]</span>;
}

export function Nav({ name, current }: { name: ReactNode; current: 'tool' | 'plan' | 'kit' }) {
  const links = [
    { id: 'tool', href: '/', label: 'Tool' },
    { id: 'plan', href: '/plan', label: 'Plan' },
    { id: 'kit', href: '/kit', label: 'Kit' },
  ] as const;
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
      <span className="text-base font-semibold tracking-tight">{name}</span>
      <span className="flex gap-1">
        {links.map((l) => (
          <Link
            key={l.id}
            href={l.href}
            aria-current={l.id === current ? 'page' : undefined}
            className={cx('rounded-row px-3 py-1.5 text-sm transition-colors', l.id === current ? 'bg-lift-hi text-ink-1' : 'text-ink-3 hover:text-ink-1')}
          >
            {l.label}
          </Link>
        ))}
      </span>
    </nav>
  );
}

/* ---------- Panel scale ----------
 * Dense controls for a docked side panel, the way a plug-in sits beside a canvas.
 * 28px controls, 12px type, hairline sections. Use these inside <Workspace panel={...}>. */

const field =
  'h-7 w-full rounded-btn border border-line bg-ground px-2 text-xs text-ink-1 transition-colors hover:border-line-hi focus:border-line-hi focus:outline-none disabled:text-ink-3';

/** Canvas on the left, docked panel on the right. Stacks on narrow screens. */
export function Workspace({ canvas, panel, toolbar }: { canvas: ReactNode; panel: ReactNode; toolbar?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface-1">
      {toolbar && <div className="flex h-10 items-center justify-between gap-3 border-b border-line px-3 text-xs text-ink-2">{toolbar}</div>}
      <div className="flex flex-col lg:flex-row">
        <div className="min-h-64 min-w-0 flex-1 bg-ground p-4">{canvas}</div>
        <aside className="w-full shrink-0 border-t border-line bg-surface-1 lg:w-80 lg:border-l lg:border-t-0">{panel}</aside>
      </div>
    </div>
  );
}

/** A collapsible group inside the side panel. Open by default. */
export function PanelSection({ title, children, aside, open = true }: { title: string; children: ReactNode; aside?: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line last:border-b-0">
      <summary className="flex h-9 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-2 hover:bg-lift [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block text-ink-3 transition-transform group-open:rotate-90">›</span>
          {title}
        </span>
        {aside && <span className="normal-case tracking-normal">{aside}</span>}
      </summary>
      <div className="space-y-2.5 px-3 pb-3 pt-1">{children}</div>
    </details>
  );
}

/** Label on the left, control on the right. */
export function PropRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2 text-xs text-ink-2">
      <span className="truncate">{label}</span>
      <span className="flex min-w-0 items-center gap-2">{children}</span>
    </div>
  );
}

export function Input({
  value, onChange, type = 'text', placeholder, suffix, label,
}: { value: string | number; onChange: (value: string) => void; type?: 'text' | 'number'; placeholder?: string; suffix?: string; label?: string }) {
  return (
    <span className="relative block w-full">
      <input type={type} value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} className={cx(field, suffix && 'pr-7', '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none')} />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">{suffix}</span>}
    </span>
  );
}

const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23a8a29e' stroke-width='1.5'/%3E%3C/svg%3E\")";

export function Select<T extends string>({
  value, onChange, options, label,
}: { value: T; onChange: (value: T) => void; options: { id: T; label: string }[]; label?: string }) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value as T)}
      className={cx(field, 'appearance-none bg-no-repeat pr-6')}
      style={{ backgroundImage: CHEVRON, backgroundSize: '10px', backgroundPosition: 'right 0.5rem center' }}
    >
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

export function Slider({
  value, onChange, min = 0, max = 100, step = 1, label, suffix = '',
}: { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; label?: string; suffix?: string }) {
  return (
    <>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--color-ink-1)]" />
      <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-2">{value}{suffix}</span>
    </>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative h-4 w-7 shrink-0 rounded-full border transition-colors', checked ? 'border-ink-1 bg-ink-1' : 'border-line-hi bg-lift')}>
      <span className={cx('absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all', checked ? 'left-[14px] bg-ground' : 'left-0.5 bg-ink-3')} />
    </button>
  );
}

export function Checkbox({ checked, onChange, disabled, children }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={cx('flex items-center gap-2 text-xs', disabled ? 'cursor-not-allowed text-ink-3' : 'cursor-pointer text-ink-1')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-ink-1)]" />
      {children}
    </label>
  );
}

/** Small button for panels: 28px tall. */
export function SmallButton({ children, onClick, disabled, kind = 'quiet', wide }: { children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'quiet'; wide?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={cx('inline-flex h-7 items-center justify-center rounded-btn px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed', wide && 'flex-1',
        kind === 'primary' ? 'bg-ink-1 text-ground hover:bg-white disabled:bg-surface-3 disabled:text-ink-3' : 'border border-line bg-lift text-ink-1 hover:bg-lift-hi disabled:text-ink-3')}>
      {children}
    </button>
  );
}

export function Progress({ value, label, inline }: { value: number; label: string; inline?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className={cx('h-1 overflow-hidden rounded-full bg-lift', inline && 'w-24 shrink-0')}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
  const number = <span className="font-mono tabular-nums">{Math.round(pct)}%</span>;
  // inline: one line, for a status bar. Otherwise the label sits above the bar.
  if (inline) return <span className="inline-flex items-center gap-2 text-[11px] text-ink-3"><span>{label}</span>{bar}{number}</span>;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px] text-ink-3"><span>{label}</span>{number}</div>
      {bar}
    </div>
  );
}

/** One output on the canvas: a frame in the right proportions, with its name, size and status. */
export function Thumb({
  name, w, h, status = 'ready', selected, onClick, children,
}: { name: string; w: number; h: number; status?: 'ready' | 'working' | 'review' | 'failed'; selected?: boolean; onClick?: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cx('flex flex-col gap-2 rounded-btn border p-2 text-left transition-colors', selected ? 'border-ink-2 bg-lift' : 'border-line hover:border-line-hi')}>
      <span className="flex h-28 w-full items-center justify-center">
        <span className={cx('relative block overflow-hidden rounded-[2px] border border-line-hi bg-surface-2', status === 'working' && 'animate-pulse')}
          style={{ aspectRatio: `${w} / ${h}`, ...(w / h >= 1.4 ? { width: '100%' } : { height: '100%' }) }}>
          {children}
        </span>
      </span>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-ink-1">{name}</span>
          <span className="block font-mono text-[11px] tabular-nums text-ink-3">{w} × {h}</span>
        </span>
        <StatusChip status={status} />
      </span>
    </button>
  );
}

/* ---------- Rows and marks ----------
 * Shared by the three shells. Panel scale unless the name says otherwise. */

export const STATUS_TONE = { ready: 'success', working: 'neutral', review: 'warning', failed: 'error' } as const;
export const STATUS_WORD = { ready: 'Passed', working: 'Working', review: 'Review', failed: 'Failed' } as const;

const DOT: Record<keyof typeof TONES, string> = { neutral: 'bg-ink-3', success: 'bg-success', warning: 'bg-warning', error: 'bg-error' };
const WORD: Record<keyof typeof TONES, string> = { neutral: 'text-ink-2', success: 'text-success', warning: 'text-warning', error: 'text-error' };

/** A dot and a word for the header. The word carries the meaning; the dot only repeats it. */
export function StatusMark({ tone = 'neutral', busy, children }: { tone?: keyof typeof TONES; busy?: boolean; children: ReactNode }) {
  return (
    <span role="status" className={cx('inline-flex items-center gap-1.5 text-[11px]', WORD[tone])}>
      <span aria-hidden className={cx('h-1.5 w-1.5 rounded-full', DOT[tone], busy && 'animate-pulse')} />
      {children}
    </span>
  );
}

/** A line that says work is still going on: a slow turning ring and what is being done. For a wait of more than a moment. */
export function Busy({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="enter flex items-center gap-2 text-[11px] leading-snug text-ink-2">
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-line border-t-ink-2 [animation-duration:1.1s]" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** One finding under a result: a short label in the state colour, then the sentence in quiet ink.
 *  The label carries the meaning; long sentences wrap under their own first word, not under the label. */
export function NoteLine({ tone = 'neutral', label, children }: { tone?: keyof typeof TONES; label: string; children: ReactNode }) {
  return (
    <p className="enter flex items-baseline gap-2 text-[11px] leading-snug">
      <span className={cx('w-18 shrink-0', WORD[tone])}>{label}</span>
      <span className="min-w-0 flex-1 text-ink-2">{children}</span>
    </p>
  );
}

/** A count or measure in mono, for section headers and row ends. */
export function Count({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] normal-case tracking-normal tabular-nums text-ink-3">{children}</span>;
}

/** A list inside a section, tighter than the section's own spacing. */
export function RowList({ children }: { children: ReactNode }) {
  return <ul className="-mx-1">{children}</ul>;
}

/** One 28px line: a name, an optional measure, and something at the end (a chip, a toggle). */
export function PanelRow({
  label, meta, end, note,
}: { label: ReactNode; meta?: ReactNode; end?: ReactNode; note?: ReactNode }) {
  return (
    <li className="px-1">
      <div className="flex min-h-7 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-ink-1">{label}</span>
        {meta && <Count>{meta}</Count>}
        {end && <span className="flex shrink-0 justify-end">{end}</span>}
      </div>
      {note && <p className="pb-1.5 text-[11px] leading-snug text-ink-2">{note}</p>}
    </li>
  );
}

/** A row a person can tick for the action in the footer. The whole line is the target. */
export function TickRow({
  checked, onChange, disabled, label, meta, end, note,
}: {
  checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean;
  label: string; meta?: ReactNode; end?: ReactNode; note?: ReactNode;
}) {
  return (
    <li>
      <label className={cx('flex min-h-7 items-center gap-2 rounded-row px-1 transition-colors', disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-lift')}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 shrink-0 accent-[var(--color-ink-1)] disabled:cursor-not-allowed"
        />
        <span className={cx('min-w-0 flex-1 truncate', disabled ? 'text-ink-3' : 'text-ink-1')}>{label}</span>
        {meta && <Count>{meta}</Count>}
        {end && <span className="flex w-18 shrink-0 justify-end">{end}</span>}
      </label>
      {note && <p className="pb-1.5 pl-6.5 pr-1 text-[11px] leading-snug text-ink-2">{note}</p>}
    </li>
  );
}

/** The status of one output, in the same words the canvas frames use. */
export function StatusChip({ status }: { status: keyof typeof STATUS_TONE }) {
  return <Chip tone={STATUS_TONE[status]}>{STATUS_WORD[status]}</Chip>;
}

/** A row in the sidebar that is read, not picked: a name, a quieter note, and one control at the right. */
export function ListRow({ name, meta, children }: { name: ReactNode; meta?: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex h-7 items-center gap-2 px-2 text-xs">
      <span className="min-w-0 flex-1 truncate text-ink-1">{name}</span>
      {meta && <span className="shrink-0 text-[11px] text-ink-3">{meta}</span>}
      {children}
    </li>
  );
}

/** One rule and whether it held. The state colour always carries its word. */
export function CheckRow({ rule, pass, where }: { rule: ReactNode; pass: boolean; where?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="min-w-0 text-ink-1">
        {rule}
        {where && <span className="block text-[11px] text-ink-3">{where}</span>}
      </span>
      <Chip tone={pass ? 'success' : 'error'}>{pass ? 'Passed' : 'Failed'}</Chip>
    </div>
  );
}

/* ---------- Page-scale form rows ----------
 * 36px tall, 14px text. For a tool that owns the screen. */

/** A named group in the main column, with no surface of its own. */
export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label>{title}</Label>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Page-scale setting row: name on the left, control on the right, 36px tall. */
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-3 text-sm text-ink-2">
      <span className="truncate">{label}</span>
      <span className="flex min-w-0 items-center gap-2">{children}</span>
    </div>
  );
}

/** Page-scale number field: 36px tall, 14px text, the unit inside at the right. */
export function NumberField({
  value, onChange, label, suffix, min, max,
}: { value: string | number; onChange: (value: string) => void; label: string; suffix?: string; min?: number; max?: number }) {
  return (
    <span className="relative block w-full">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-9 w-full rounded-btn border border-line bg-ground px-3 text-sm text-ink-1 transition-colors hover:border-line-hi focus:border-line-hi',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none',
          suffix && 'pr-9',
        )}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">{suffix}</span>}
    </span>
  );
}

/** Page-scale switch: the whole 36px row is the target. Changes a rule and takes effect at once. */
export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-9 w-full items-center justify-between gap-3 rounded-row text-left text-sm text-ink-2 transition-colors hover:text-ink-1"
    >
      <span className="truncate">{label}</span>
      <span aria-hidden className={cx('relative h-4 w-7 shrink-0 rounded-full border transition-colors', checked ? 'border-ink-1 bg-ink-1' : 'border-line-hi bg-lift')}>
        <span className={cx('absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all', checked ? 'left-[14px] bg-ground' : 'left-0.5 bg-ink-3')} />
      </span>
    </button>
  );
}

/** Page-scale checkbox: marks an item for the action that comes later. */
export function CheckField({
  checked, onChange, disabled, children,
}: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={cx('flex min-h-9 items-center gap-3 text-sm', disabled ? 'cursor-not-allowed text-ink-3' : 'cursor-pointer text-ink-1')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-ink-1)]" />
      {children}
    </label>
  );
}

/** One output drawn large at its true proportions. Children are positioned inside the frame. */
export function Preview({ w, h, label, working, children }: { w: number; h: number; label: string; working?: boolean; children?: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="flex h-48 w-full items-center justify-center rounded-btn border border-line bg-ground p-3">
      <span
        className={cx('relative block max-h-full max-w-full overflow-hidden rounded-row border border-line-hi bg-surface-2', working && 'animate-pulse')}
        style={{ aspectRatio: `${w} / ${h}`, ...(w / h >= 1.4 ? { width: '100%' } : { height: '100%' }) }}
      >
        {children}
      </span>
    </div>
  );
}

/** Where a person adds files, by dropping them or by choosing them. The whole area is the target. */
export function FileDrop({ onFiles, accept, children }: { onFiles: (files: File[]) => void; accept?: string; children: ReactNode }) {
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFiles(Array.from(e.dataTransfer.files)); }}
      className="flex min-h-9 cursor-pointer items-center justify-center rounded-btn border border-dashed border-line px-3 py-2 text-center text-xs text-ink-2 transition-colors hover:border-line-hi hover:text-ink-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#e7e5e4]"
    >
      <input type="file" multiple accept={accept} className="sr-only" onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      {children}
    </label>
  );
}

export const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
