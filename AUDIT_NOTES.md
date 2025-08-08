# Hallucination & Comment Audit

## Executive Summary
- Paid API features (Plant.id, Google Vision) are disabled by default and gated via `NEXT_PUBLIC_ENABLE_PAID_AI`. Some docs still read as if production is fully enabled.
- API routes for Plant.id and Google Vision intentionally return HTTP 501; ensure this is clearly documented to avoid confusion.
- Manual plant-measure API uses simulated/mock behavior with a placeholder for future real CV; UI/docs must not imply real AI measurement.
- Inclinometer util is implemented with portrait-only assumption and secure-context gating; behavior is safe and documented.
- Demo placeholders exist (charts, test instructions); low risk but mark explicitly as demo.
- Env examples include API keys; acceptable but should mention paid features are hidden by default.
- No hardcoded secrets or sensitive logs detected.

## Findings by Severity

### High
- [high] src/app/api/plant-scan/route.ts:3 – Paid Plant.id endpoint disabled
Context: NOTE: This endpoint uses a paid third-party API (Plant.id). It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'. TODO: Reintroduce a free/local alternative before enabling by default.
Risk: Disabled/paid dependency
Suggested fix: Create issue to track free/local alternative and update README to state this route returns 501 by default.

- [high] src/app/api/ai-plant-measure/route.ts:3 – Paid Google Vision endpoint disabled
Context: NOTE: This endpoint uses a paid third-party API (Google Vision). It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'. TODO: Reintroduce a free/local alternative before enabling by default.
Risk: Disabled/paid dependency
Suggested fix: Create issue to implement free/local path; reword README to reflect disabled-by-default behavior.

- [high] PLANT_SCANNER_README.md:18/49/150 – Claims of real Plant.id integration and production while route returns 501 by default
Context: “Plant.id Integration: Real API integration with proper error handling”; “Production: Uses real Plant.id API”; “Missing API Key: Graceful fallback to mock data”.
Risk: Fabricated behavior claim
Suggested fix: Reword to note gating via `NEXT_PUBLIC_ENABLE_PAID_AI`; clarify that current API route is disabled unless enabled.

### Medium
- [medium] src/app/api/plant-measure/route.ts:13/83/149 – Mock data and placeholder for future CV API
Context: “Mock measurement data for development”; “Helper function to call real computer vision API (placeholder…)”; “Use computer vision API (simulated for now)”.
Risk: Ambiguous TODO / dead path
Suggested fix: Add UI note that results are simulated; create issue to scope real CV or keep as manual-only.

- [medium] README.md:8/19/132/138/206 – Optional Plant.id/Google Vision mentions and API keys
Context: “Optional integration with Plant.id and Google Vision APIs”; env shows API key variables.
Risk: Disabled/paid dependency
Suggested fix: Explicitly state the routes return 501 unless `NEXT_PUBLIC_ENABLE_PAID_AI=true` is set.

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
- src/app/api/ai-plant-measure/route.ts:4 – It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'.
- src/app/api/ai-plant-measure/route.ts:5 – TODO: Reintroduce a free/local alternative before enabling by default.
- src/app/api/plant-measure/route.ts:13 – Mock measurement data for development
- src/app/api/plant-measure/route.ts:83 – Helper function to call real computer vision API (placeholder for future implementation)
- src/app/api/plant-measure/route.ts:149 – Use computer vision API (simulated for now)
- src/app/api/plant-scan/route.ts:4 – It is disabled by default unless NEXT_PUBLIC_ENABLE_PAID_AI === 'true'.
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
