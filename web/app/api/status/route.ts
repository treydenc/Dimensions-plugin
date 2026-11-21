import { NextResponse } from 'next/server';
import { hasKey, MODEL } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ mode: hasKey() ? 'claude' : 'sample', model: MODEL });
}
