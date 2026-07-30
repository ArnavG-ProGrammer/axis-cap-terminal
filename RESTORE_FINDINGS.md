# RESTORE FINDINGS

## Non-Blocking Bugs & Notices (Unrelated to Production Site Loading)

1. **TypeScript Type Mismatches in Test / Heatmap Files**:
   - `src/lib/backtest/__tests__/backtest.test.ts` references missing global Jest test definitions (`jest`, `describe`, `it`, `expect`).
   - `src/lib/valuation/__tests__/reconcile.test.ts` has missing properties in mocked `ValuationInputs` objects.
   - `src/components/BespokeIndianHeatmap.tsx` has d3 hierarchy node property access (`x0`, `y0`, `x1`, `y1`) on strict `HierarchyNode` generic types.
   - *Note*: These do not block production build as `next.config.ts` sets `typescript.ignoreBuildErrors: true`.

2. **Next.js 16 Middleware Deprecation Warning**:
   - Next.js 16 displays a deprecation warning regarding `middleware` file convention (suggests migrating to `proxy` convention).

3. **Missing Metadata Base Warning**:
   - Social OpenGraph / Twitter meta image resolution lacks explicit `metadataBase` in root layout export (defaults to `http://localhost:3000`).
