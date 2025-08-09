# Hallucination & Comment Audit

## Executive Summary
 - Paid API features (Plant.id, Google Vision) are disabled by default. Server routes must gate via `ENABLE_PAID_AI` (server-only). UI may read `NEXT_PUBLIC_ENABLE_PAID_AI` for messaging only. Some docs still read as if production is fully enabled.
 - API routes for Plant.id and Google Vision intentionally return HTTP 501 Not Implemented when disabled by policy. Do not use 503 for policy gating. If 503 Service Unavailable is ever used (temporary outage), include a `Retry-After` header (seconds or HTTP-date).
- Manual plant-measure API uses simulated/mock behavior with a placeholder for future real CV; UI/docs must not imply real AI measurement.
- Inclinometer util is implemented with portrait-only assumption and secure-context gating; behavior is safe and documented.
- Demo placeholders exist (charts, test instructions); low risk but mark explicitly as demo.
 - Env examples include API keys; acceptable but should mention paid features are hidden by default. Clarify that `ENABLE_PAID_AI` controls server route availability, while `NEXT_PUBLIC_ENABLE_PAID_AI` only controls UI checks.
- No hardcoded secrets or sensitive logs detected.

## Findings by Severity

### High
- [high] src/app/api/plant-scan/route.ts:3 – Paid Plant.id endpoint disabled
Context: NOTE: This endpoint uses a paid third-party API (Plant.id). It is disabled by default unless the server flag ENABLE_PAID_AI === 'true'. The NEXT_PUBLIC_ENABLE_PAID_AI flag is for frontend UI messaging only. TODO: Reintroduce a free/local alternative before enabling by default.
Risk: Disabled/paid dependency
 Suggested fix: Create issue to track free/local alternative and update README to state this route returns 501 by default when disabled-by-policy. Gate the server route with `ENABLE_PAID_AI`; keep `NEXT_PUBLIC_ENABLE_PAID_AI` solely for frontend UI messaging. If returning 503 for a temporary outage, include a `Retry-After` header.

- [high] src/app/api/ai-plant-measure/route.ts:3 – Paid Google Vision endpoint disabled
Context: NOTE: This endpoint uses a paid third-party API (Google Vision). It is disabled by default unless the server flag ENABLE_PAID_AI === 'true'. The NEXT_PUBLIC_ENABLE_PAID_AI flag is for frontend UI messaging only. TODO: Reintroduce a free/local alternative before enabling by default.
Risk: Disabled/paid dependency
 Suggested fix: Create issue to implement free/local path; reword README to reflect disabled-by-default behavior with 501 when policy-disabled. Gate the server route with `ENABLE_PAID_AI`; keep `NEXT_PUBLIC_ENABLE_PAID_AI` solely for frontend UI messaging. If temporarily unavailable, use 503 with a `Retry-After` header.

Canonical server route gating pattern (use `ENABLE_PAID_AI` on the server; only use 503 for temporary outages and include `Retry-After`):

```ts
import { NextResponse } from 'next/server'

export async function POST() {
  const enabled = process.env.ENABLE_PAID_AI === 'true'
  if (!enabled) {
    return NextResponse.json(
      {
        disabled: true,
        errorCode: 'PAID_AI_DISABLED_BY_POLICY',
        message: 'Paid feature is disabled by policy. Set ENABLE_PAID_AI=true on the server to enable.'
      },
      { status: 501, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const temporarilyUnavailable = false // flip via ops/feature flag when needed
  if (temporarilyUnavailable) {
    return NextResponse.json(
      {
        disabled: true,
        errorCode: 'PAID_AI_TEMPORARILY_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please retry later.'
      },
      { status: 503, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } }
    )
  }

  // ...normal handler when enabled and available
}
```

- [high] PLANT_SCANNER_README.md:18/49/150 – Claims of real Plant.id integration and production while route returns 501 by default
Context: Documentation must state that Plant.id integration is gated server-side by `ENABLE_PAID_AI` and client-side messaging by `NEXT_PUBLIC_ENABLE_PAID_AI`. The API route returns HTTP 501 (Not Implemented) unless enabled by these policies. If returning 503 (Service Unavailable) for temporary outages, include a `Retry-After` header.
Risk: Fabricated behavior claim
 Suggested fix: Reword README accordingly so users understand that production use requires enabling `ENABLE_PAID_AI` server-side; the UI may reflect state via `NEXT_PUBLIC_ENABLE_PAID_AI`. Default behavior remains 501 when policy-disabled; 503 is reserved for temporary outages and must include `Retry-After`.

### Medium
- [medium] src/app/api/plant-measure/route.ts:13/83/149 – Mock data and placeholder for future CV API
Context: “Mock measurement data for development”; “Helper function to call real computer vision API (placeholder…)”; “Use computer vision API (simulated for now)”.
Risk: Ambiguous TODO / dead path
Suggested fix: Add UI note that results are simulated; create issue to scope real CV or keep as manual-only.

- [medium] README.md:8/19/132/138/206 – Optional Plant.id/Google Vision mentions and API keys
Context: “Optional integration with Plant.id and Google Vision APIs”; env shows API key variables.
Risk: Disabled/paid dependency
 Suggested fix: Explicitly state the routes return 501 unless `ENABLE_PAID_AI=true` is set on the server. The UI may reflect the state via `NEXT_PUBLIC_ENABLE_PAID_AI`. If using 503 for temporary outages, include `Retry-After`.

- [medium] src/app/ai-measure/page.tsx:90 – Gated banner
Context: Banner indicates paid APIs are disabled by default; action disabled.
Risk: Ambiguous TODO
Suggested fix: Adjust subtitle to explicitly say the page is disabled until enabled.

- [medium] src/app/plant-scanner/page.tsx:79 – Gated banner
Context: Banner about Plant.id gating.
Risk: Disabled/paid dependency
Suggested fix: Ensure sidebar/README messaging matches.

### Low
- [low] src/lib/measure/inclinometer.ts:105 – Portrait-only assumption
Context: “Assume portrait-only for v1. Ignore samples if not portrait.”
Risk: Ambiguous TODO
Suggested fix: Create issue to add landscape support.

- [low] src/lib/measure/inclinometer.ts:115 – Clamp note
Context: “Clamp pitch to avoid extreme values that could explode later trig use”.
Risk: Style/documentation
Suggested fix: Optional unit test later.

- [low] src/app/reports/page.tsx:85/92 – Chart placeholder
Context: “Chart placeholder”.
Risk: Ambiguous TODO
Suggested fix: Create issue or mark as demo-only.

- [low] src/app/test-theme/page.tsx:59 – Test instructions
Context: “Check browser console for debug logs”.
Risk: Style/demo content
Suggested fix: Mark page as test-only in README if kept.

- [low] src/app/lib/utils.ts:39 – Temporary ID generator
Context: “Generate random ID (temporary until we use proper database IDs)”.
Risk: Ambiguous TODO
Suggested fix: Create issue to replace with server-assigned IDs if needed.

## Index of Matches (path:line)
- src/lib/measure/inclinometer.ts:105 – Assume portrait-only for v1. Ignore samples if not portrait.
- src/lib/measure/inclinometer.ts:115 – Clamp pitch to avoid extreme values that could explode later trig use
- src/app/api/ai-plant-measure/route.ts:4 – It is disabled by default unless ENABLE_PAID_AI === 'true'.
- src/app/api/ai-plant-measure/route.ts:5 – TODO: Reintroduce a free/local alternative before enabling by default.
- src/app/api/plant-measure/route.ts:13 – Mock measurement data for development
- src/app/api/plant-measure/route.ts:83 – Helper function to call real computer vision API (placeholder for future implementation)
- src/app/api/plant-measure/route.ts:149 – Use computer vision API (simulated for now)
- src/app/api/plant-scan/route.ts:4 – It is disabled by default unless ENABLE_PAID_AI === 'true'.
- src/app/api/plant-scan/route.ts:5 – TODO: Reintroduce a free/local alternative before enabling by default.
- src/app/test-theme/page.tsx:59 – Check browser console for debug logs
- src/app/reports/page.tsx:85 – Chart placeholder
- src/app/reports/page.tsx:92 – Chart placeholder
- README.md:8 – Plant.id API (optional)
- README.md:19 – Optional integration with Plant.id and Google Vision APIs
- README.md:206 – NEXT_PUBLIC_ENABLE_PAID_AI=false
- PLANT_SCANNER_README.md:18 – Plant.id Integration: Real API integration with proper error handling
- PLANT_SCANNER_README.md:49 – Development vs Production: Uses mock data vs real API
- PLANT_SCANNER_README.md:150 – Troubleshooting references to API key and mock data
