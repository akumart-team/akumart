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
- The Nest backend is authoritative. Public, account and admin data pages use `src/lib/api/` services and `src/components/api/` views. Never restore demo records or authorize from local state. See `docs/API_INTEGRATION.md`.
- Server responses and permissions govern live workflows. `src/lib/rules.ts` and `src/lib/actions.ts` contain legacy prototype helpers for reference; do not use them to mutate live data. Route mutations use the API resource layer.
- Restricted Marketplace actions must go through `useTradeGate()` (src/components/gate.tsx) so intent is preserved and resumed after verification; AkuBin flows must never call it.
- `useDB` subscribes to the whole DB snapshot and runs the selector during render, so selectors may return any derived value.
- Admin console access uses the authenticated backend profile's active staff role. Never use `/dev/roles` or local state to authorize API actions.
