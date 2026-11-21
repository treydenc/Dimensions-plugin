// The plug-in form: a panel docked inside someone else's application.
// The panel is the whole product. Header and footer stay put; the body scrolls.
// Panel scale throughout (28px controls, 12px text). No demo content lives here.
//
// Three layers, as on treydenc.com/ai-principles: the colour field at the back, a pane over it
// that carries the header and the one action, and a black canvas card inside the pane for the work.
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
  /** Fill the width it is given. Set inside the real plug-in; the 320px default is for demos. */
  fill?: boolean;
};

export function PluginShell({ title, status, context, children, footer, bodyLabel = 'Panel', fill }: PluginShellProps) {
  return (
    <section className={cx('color-field flex h-full min-h-0 max-w-full shrink-0 flex-col p-2 text-xs text-ink-2', fill ? 'w-full' : 'w-80 border-l border-line')}>
      <div className="glass-still flex min-h-0 flex-1 flex-col rounded-panel">
        <header className="shrink-0 px-3">
          <div className="flex h-11 items-center justify-between gap-3">
            <h1 className="min-w-0 truncate text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-1">{title}</h1>
            {status && <span className="shrink-0 rounded-btn bg-canvas px-2 py-1 shadow-raised">{status}</span>}
          </div>
          {context && <div className="flex h-7 items-center gap-2 border-t border-line">{context}</div>}
        </header>

        {/* The body can take focus so it scrolls from the keyboard. Section headers run edge to edge,
            so their focus ring is drawn inside the edge instead of being clipped by the scroll area. */}
        <div
          role="region"
          aria-label={bodyLabel}
          tabIndex={0}
          className="mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-card bg-canvas shadow-raised [scrollbar-width:thin] focus-visible:-outline-offset-2! [&_summary:focus-visible]:-outline-offset-2!"
        >
          {children}
        </div>

        {footer ? <footer className="shrink-0 space-y-2.5 p-3">{footer}</footer> : <div className="h-2 shrink-0" />}
      </div>
    </section>
  );
}

/* ---------- Demo only ---------- */

/** A plain stand-in for the application the panel is docked in. It imitates nothing:
 *  an empty canvas marked as not ours, and the panel at full height on the right.
 *  Pass hosted when the page is running inside Photoshop, and the stand-in steps aside. */
export function HostFrame({ children, hosted }: { children: ReactNode; hosted?: boolean }) {
  // Inside the real plug-in there is nothing to stand in for: the panel is the whole window.
  if (hosted) return <div className="h-dvh min-h-0 w-full overflow-hidden bg-ground">{children}</div>;
  return (
    <div className="flex h-dvh min-h-0 w-full justify-end overflow-hidden bg-ground">
      <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
        <Undecided what="host app" />
      </div>
      {children}
    </div>
  );
}
