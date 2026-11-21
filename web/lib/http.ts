// Wraps a route so every failure reaches the UI as one plain-language sentence.
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function explain(err: unknown): { message: string; status: number } {
  if (err instanceof ZodError) return { message: err.issues[0]?.message ?? 'That input is not valid.', status: 400 };
  if (err instanceof Anthropic.AuthenticationError) return { message: 'The API key was rejected. Check ANTHROPIC_API_KEY in .env.local.', status: 502 };
  if (err instanceof Anthropic.RateLimitError) return { message: 'Claude is rate limited right now. Wait a few seconds and try again.', status: 502 };
  if (err instanceof Anthropic.APIConnectionError) return { message: 'Could not reach Claude. Check the internet connection.', status: 502 };
  if (err instanceof Anthropic.APIError) return { message: `Claude returned an error (${err.status ?? 'unknown'}).`, status: 502 };
  return { message: err instanceof Error ? err.message : 'Something went wrong.', status: 500 };
}

export async function handle<T>(work: () => Promise<T>) {
  try {
    return NextResponse.json(await work());
  } catch (err) {
    console.error(err);
    const { message, status } = explain(err);
    return NextResponse.json({ error: message }, { status });
  }
}
