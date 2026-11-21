'use client';
// Mounted once in the layout. Inside the Photoshop plug-in it listens for the host and says
// hello, which turns the panel's status line to "Connected". In a browser tab it does nothing.
import { useEffect } from 'react';
import { ask, inPhotoshop, listen } from '@/lib/host';

export function HostBridge() {
  useEffect(() => {
    if (!inPhotoshop()) return;
    const stop = listen();
    void ask('ping').catch(() => {});
    return stop;
  }, []);
  return null;
}
