// The hosted web app form of a tool: a full page at page scale (36px controls, 14px text).
// A top bar names the tool and the job and holds the one primary action; the work fills the
// main column; detail and settings sit in a side column that drops below on narrow screens.
// No hooks and no demo content here. Built from the tokens in app/globals.css.
import type { ReactNode } from 'react';
import { cx } from '@/components/ui';

export { CheckField as TickRow, NumberField, Preview, Section, SettingRow as Row, SwitchRow } from '@/components/ui';

export type WebShellProps = {
  /** The tool's name, far left of the top bar. */
  tool: ReactNode;
  /** What is open: the job or document name. Rendered as the page's h1. */
  title: ReactNode;
  /** One quiet fact about the job, beside the title (the source file, an owner). */
  meta?: ReactNode;
  /** Where the job stands, in words. Announced politely when it changes. */
  status?: ReactNode;
  /** The primary action, and at most one quiet neighbour. */
  actions?: ReactNode;
  /** The main column: the work itself. */
  children: ReactNode;
  /** The side column: detail and settings. Follows the main column on narrow screens. */
  aside?: ReactNode;
  /** Names the side column for screen readers. */
  asideLabel?: string;
};

export function WebShell({ tool, title, meta, status, actions, children, aside, asideLabel = 'Details' }: WebShellProps) {
  return (
    <div className="min-h-screen bg-ground text-sm text-ink-1">
      <header className="border-b border-line bg-ground lg:sticky lg:top-0 lg:z-10">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold tracking-tight">{tool}</span>
            <span aria-hidden className="h-4 w-px bg-line-hi" />
            <h1 className="truncate font-medium">{title}</h1>
            {meta && <span className="truncate text-xs text-ink-3">{meta}</span>}
          </div>
          {(status || actions) && (
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3 sm:flex-none sm:justify-end">
              {status && <div aria-live="polite" className="flex items-center gap-3 text-xs text-ink-3">{status}</div>}
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
        </div>
      </header>

      <div className={cx('mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6', !!aside && 'lg:grid-cols-[minmax(0,1fr)_24rem]')}>
        <main className="min-w-0 space-y-8">{children}</main>
        {aside && (
          <aside aria-label={asideLabel} className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:self-start lg:overflow-y-auto">
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
