import { NextResponse } from 'next/server';

// NOTE: This endpoint uses a paid third-party API (Plant.id).
// It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'.
// TODO: Reintroduce a free/local alternative before enabling by default.

export async function POST() {
  const enablePaidAI = process.env.NEXT_PUBLIC_ENABLE_PAID_AI === 'true';
  if (!enablePaidAI) {
    return NextResponse.json(
      { disabled: true, message: 'Plant.id scanning is disabled. Set NEXT_PUBLIC_ENABLE_PAID_AI=true to enable.' },
      { status: 501 }
    );
  }

  return NextResponse.json(
    { disabled: true, message: 'Paid API temporarily disabled in this environment.' },
    { status: 501 }
  );
}