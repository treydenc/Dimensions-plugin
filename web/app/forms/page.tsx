// One tool, three forms. Each is a shell in components/shells with slots for your content.
import Link from 'next/link';
import { Chip, Label, Nav, Undecided } from '@/components/ui';
import { plan } from '@/plan';

const FORMS = [
  { id: 'hosted web app', href: '/forms/web', name: 'Web app', shell: 'WebShell', scale: 'Page scale', when: 'People open it in a browser and will not install anything.' },
  { id: 'plugin', href: '/forms/plugin', name: 'Plug-in', shell: 'PluginShell', scale: 'Panel scale, 320 wide', when: 'The work already lives in another application.' },
  { id: 'desktop app', href: '/forms/desktop', name: 'Desktop app', shell: 'DesktopShell', scale: 'Panel chrome, full window', when: 'Long sessions with many files, or files that must stay on the machine.' },
] as const;

export default function Forms() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
      <Nav name={plan.name ?? <Undecided what="tool name" />} current="forms" />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Forms</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-2">One tool, the poster resizer, built three ways from the same sample data.</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-3">
        {FORMS.map((f) => (
          <li key={f.id}>
            <Link href={f.href} className="flex h-full flex-col gap-3 rounded-panel border border-line bg-surface-1 p-5 transition-colors hover:border-line-hi">
              <span className="flex items-center justify-between gap-2">
                <span className="text-xl font-semibold tracking-tight">{f.name}</span>
                {plan.form.production === f.id && <Chip tone="success">In the plan</Chip>}
              </span>
              <span className="text-sm text-ink-2">{f.when}</span>
              <span className="mt-auto pt-3">
                <Label>{f.scale}</Label>
                <span className="mt-1 block font-mono text-[11px] text-ink-3">components/shells/{f.shell}.tsx</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
