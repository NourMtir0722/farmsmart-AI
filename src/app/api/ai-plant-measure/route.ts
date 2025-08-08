import { NextRequest, NextResponse } from 'next/server'

// NOTE: This endpoint uses a paid third-party API (Google Vision).
// It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'.
// TODO: Reintroduce a free/local alternative before enabling by default.

export async function POST(_request: NextRequest) {
  const enablePaidAI = process.env.NEXT_PUBLIC_ENABLE_PAID_AI === 'true'
  return NextResponse.json(
    {
      disabled: true,
      message: enablePaidAI
        ? 'Paid AI measurement temporarily disabled in this environment.'
        : 'AI measurement (Google Vision) is disabled. Set NEXT_PUBLIC_ENABLE_PAID_AI=true to enable.'
    },
    { status: 501 }
  )
}