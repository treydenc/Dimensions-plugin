'use client';
// The desktop app form: one window that fills the screen, at panel scale.
// Title bar and status bar stay put; sidebar, main area and inspector each scroll on their own.
// Under 1024px the sidebar hides behind a button and the inspector drops below the main area.
// No demo content in here. Built only from the tokens in app/globals.css and components/ui.tsx.
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Label, cx } from '@/components/ui';

export { CheckRow, ListRow } from '@/components/ui';

export type DesktopShellProps = {
  /** App name, at the left of the title bar. */
  name: ReactNode;
  /** What is open, beside the app name. */
  title?: ReactNode;
  /** Window-level actions, at the right of the title bar. Use SmallButton. */
  actions?: ReactNode;
  /** Left column. Use SidebarSection with SidebarRow or ListRow. */
  sidebar: ReactNode;
  /** Names the sidebar: the text of the button that opens it on narrow screens. */
  sidebarLabel: string;
  /** Strip above the main area. */
  toolbar?: ReactNode;
  /** Main area, on the ground colour. */
  children: ReactNode;
  /** Right column. Use InspectorHeader and PanelSection. */
  inspector?: ReactNode;
  /** Names the inspector for screen readers. */
  inspectorLabel?: string;
  /** Bottom strip. Use StatusItem. */
  statusbar?: ReactNode;
  /** Optional: control the narrow-screen sidebar from outside, for example to close it after a pick. */
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
};

export function DesktopShell({
  name, title, actions, sidebar, sidebarLabel, toolbar, children, inspector, inspectorLabel = 'Details', statusbar, sidebarOpen, onSidebarOpenChange,
}: DesktopShellProps) {
  const [inner, setInner] = useState(false);
  const open = sidebarOpen ?? inner;
  const setOpen = (next: boolean) => {
    setInner(next);
    onSidebarOpenChange?.(next);
  };
  const sidebarId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInner(false);
      onSidebarOpenChange?.(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onSidebarOpenChange]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-1 text-xs text-ink-2">
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={sidebarId}
            onClick={() => setOpen(!open)}
            className={cx(
              'inline-flex h-7 shrink-0 items-center justify-center rounded-btn border border-line px-3 text-xs font-medium text-ink-1 transition-colors hover:bg-lift-hi lg:hidden',
              open ? 'bg-lift-hi' : 'bg-lift',
            )}
          >
            {sidebarLabel}
          </button>
          <span className="shrink-0 font-semibold text-ink-1">{name}</span>
          {title && (
            <>
              <span aria-hidden className="h-3 w-px shrink-0 bg-line-hi" />
              <span className="truncate">{title}</span>
            </>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <div className="relative flex min-h-0 flex-1">
        <nav
          id={sidebarId}
          aria-label={sidebarLabel}
          className={cx(
            'w-56 shrink-0 overflow-y-auto border-r border-line bg-surface-1 lg:static lg:block',
            open ? 'absolute inset-y-0 left-0 z-20' : 'hidden',
          )}
        >
          {sidebar}
        </nav>
        {open && <div aria-hidden onClick={() => setOpen(false)} className="absolute inset-0 z-10 bg-ground/60 lg:hidden" />}

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <main className="flex shrink-0 flex-col lg:min-h-0 lg:min-w-0 lg:flex-1 lg:shrink">
            {toolbar && (
              <div className="sticky top-0 z-[1] flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-1 px-3">
                {toolbar}
              </div>
            )}
            <div className="bg-ground p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">{children}</div>
          </main>
          {inspector && (
            <aside aria-label={inspectorLabel} className="shrink-0 border-t border-line bg-surface-1 lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0">
              {inspector}
            </aside>
          )}
        </div>
      </div>

      {statusbar && (
        <footer className="flex h-10 shrink-0 items-center gap-4 overflow-hidden whitespace-nowrap border-t border-line px-3 text-[11px] text-ink-3">
          {statusbar}
        </footer>
      )}
    </div>
  );
}

/** A named group in the sidebar. `aside` sits at the right of the label, for a count or a column name. */
export function SidebarSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line p-2 last:border-b-0">
      <div className="flex h-7 items-center justify-between gap-2 px-2">
        <Label>{title}</Label>
        {aside && <span className="text-[11px] text-ink-3">{aside}</span>}
      </div>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

/** A row in the sidebar that can be picked. The picked row lifts and takes full ink. */
export function SidebarRow({ children, meta, selected, onClick }: { children: ReactNode; meta?: ReactNode; selected?: boolean; onClick?: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={onClick}
        className={cx(
          'flex h-7 w-full items-center justify-between gap-2 rounded-row px-2 text-left text-xs transition-colors',
          selected ? 'bg-lift font-medium text-ink-1' : 'text-ink-2 hover:text-ink-1',
        )}
      >
        <span className="truncate">{children}</span>
        {meta && <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-3">{meta}</span>}
      </button>
    </li>
  );
}

/** The top of the inspector: what is selected, its size, and a note about it. */
export function InspectorHeader({ name, meta, note, children }: { name: ReactNode; meta?: ReactNode; note?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-2 border-b border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="truncate text-sm font-medium text-ink-1">{name}</h2>
        {meta && <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-3">{meta}</span>}
      </div>
      {note && <p className="text-xs text-ink-2">{note}</p>}
      {children && <div className="flex items-center gap-2 pt-1">{children}</div>}
    </div>
  );
}

/** One fact in the status bar. Give it `grow` to push what follows to the right. */
export function StatusItem({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return <span className={cx('min-w-0 truncate', grow && 'flex-1')}>{children}</span>;
}
