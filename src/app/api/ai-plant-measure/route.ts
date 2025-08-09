import { NextRequest, NextResponse } from 'next/server'

// NOTE: This endpoint uses a paid third-party API (Google Vision).
// It is disabled by default unless ENABLE_PAID_AI === 'true'.
// TODO: Reintroduce a free/local alternative before enabling by default.

export async function POST(_request: NextRequest) {
  const enablePaidAI = process.env.ENABLE_PAID_AI === 'true'
  // If not enabled by policy, return 501 (Not Implemented)
  if (!enablePaidAI) {
    return NextResponse.json(
      {
        disabled: true,
        errorCode: 'PAID_AI_DISABLED_BY_POLICY',
        message: 'AI measurement (Google Vision) is disabled by policy. Set ENABLE_PAID_AI=true to enable.'
      },
      {
        status: 501,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
          Pragma: 'no-cache',
          Expires: '0',
        }
      }
    )
  }

  // If enabled but temporarily unavailable (ops toggle), return 503 with Retry-After
  const isTemporarilyUnavailable = false
  if (isTemporarilyUnavailable) {
    return NextResponse.json(
      {
        disabled: true,
        errorCode: 'PAID_AI_TEMPORARILY_UNAVAILABLE',
        message: 'Paid AI measurement temporarily unavailable in this environment.'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
          Pragma: 'no-cache',
          Expires: '0',
          'Retry-After': '3600',
        }
      }
    )
  }

  // Placeholder response until real implementation is wired
  return NextResponse.json(
    { disabled: true, errorCode: 'PAID_AI_NOT_WIRED', message: 'Endpoint enabled but implementation not wired yet.' },
    { status: 501, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private', Pragma: 'no-cache', Expires: '0' } }
  )
}