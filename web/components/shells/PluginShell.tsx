// The plug-in form: a 320px panel docked inside someone else's application.
// The panel is the whole product. Header and footer stay put; the body scrolls.
// Panel scale throughout (28px controls, 12px text). No demo content lives here.
import type { ReactNode } from 'react';
import { Undecided, cx } from '@/components/ui';

export { Count, PanelRow, RowList, StatusChip, StatusMark, TickRow } from '@/components/ui';

/* ---------- The shell ---------- */

export type PluginShellProps = {
  /** The tool's name. Sits at the left of the header. */
  title: ReactNode;
  /** A small mark at the right of the header, usually a <StatusMark>. */
  status?: ReactNode;
  /** One optional fixed line under the header: what the panel is working on. */
  context?: ReactNode;
  /** The scrolling body. Usually a run of <PanelSection>s. */
  children: ReactNode;
  /** Pinned to the bottom: progress and the one primary action. */
  footer?: ReactNode;
  /** Names the scrolling body for screen readers. */
  bodyLabel?: string;
};

export function PluginShell({ title, status, context, children, footer, bodyLabel = 'Panel' }: PluginShellProps) {
  return (
    <section className="flex h-full min-h-0 w-80 max-w-full shrink-0 flex-col border-l border-line bg-surface-1 text-xs text-ink-2">
      <header className="shrink-0 border-b border-line">
        <div className="flex h-10 items-center justify-between gap-3 px-3">
          <h1 className="min-w-0 truncate text-xs font-semibold text-ink-1">{title}</h1>
          {status && <span className="shrink-0">{status}</span>}
        </div>
        {context && <div className="flex h-7 items-center gap-2 border-t border-line px-3">{context}</div>}
      </header>

      {/* The body can take focus so it scrolls from the keyboard. Section headers run edge to edge,
          so their focus ring is drawn inside the edge instead of being clipped by the scroll area. */}
      <div
        role="region"
        aria-label={bodyLabel}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] focus-visible:-outline-offset-2! [&_summary:focus-visible]:-outline-offset-2!"
      >
        {children}
      </div>

      {footer && <footer className="shrink-0 space-y-2.5 border-t border-line p-3">{footer}</footer>}
    </section>
  );
}

/* ---------- Demo only ---------- */

/** A plain stand-in for the application the panel is docked in. It imitates nothing:
 *  an empty canvas marked as not ours, and the panel at full height on the right. */
export function HostFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 w-full justify-end overflow-hidden bg-ground">
      <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
        <Undecided what="host app" />
      </div>
      {children}
    </div>
  );
}
