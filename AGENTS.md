<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All app data is a browser-persisted mock store (`src/lib/store.ts`, seed in `src/lib/seed.ts`); no backend yet — prototype simulates payments, verification, bins and AI.
- Business rules (fees, verification tiers, points, partner eligibility) live as pure functions in `src/lib/rules.ts` with tests in `src/test/rules.test.ts`; mutations live in `src/lib/actions.ts`.
- Restricted Marketplace actions must go through `useTradeGate()` (src/components/gate.tsx) so intent is preserved and resumed after verification; AkuBin flows must never call it.
- `useDB` subscribes to the whole DB snapshot and runs the selector during render, so selectors may return any derived value.
- Admin console is gated by a dev-only staff role set at /dev/roles; never expose role switching on public pages.
