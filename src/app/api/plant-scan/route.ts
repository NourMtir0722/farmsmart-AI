import { NextResponse } from 'next/server';

// NOTE: This endpoint uses a paid third-party API (Plant.id).
// It is disabled by default unless ENABLE_PAID_AI (server-only) === 'true'.
// TODO: Reintroduce a free/local alternative before enabling by default.

export async function POST() {
  const enablePaidAI = process.env.ENABLE_PAID_AI === 'true';
  if (!enablePaidAI) {
    return NextResponse.json(
      {
        disabled: true,
        errorCode: 'PAID_AI_DISABLED_BY_POLICY',
        message: 'Plant.id scanning is disabled by policy. Set ENABLE_PAID_AI=true on the server to enable.'
      },
      { status: 501, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private' } }
    );
  }

  return NextResponse.json(
    {
      disabled: true,
      errorCode: 'PAID_AI_TEMPORARILY_DISABLED',
      message: 'Plant.id scanning temporarily unavailable in this environment.'
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
        'Retry-After': '3600'
      }
    }
  );
}