import type { Metadata } from 'next';
import '@fontsource-variable/instrument-sans';
import './globals.css';
import { HostBridge } from '@/components/HostBridge';
import { plan } from '@/plan';

export const metadata: Metadata = { title: plan.name ?? '[ tool name ]' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <HostBridge />
        {children}
      </body>
    </html>
  );
}
