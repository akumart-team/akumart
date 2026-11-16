# Backend integration

Signup requires `firstName`, `lastName`, `displayName`, `email`, `phone`, `city`,
`marketRole`, `password` and `acceptedTerms: true`. The frontend sends `akubin: true`
for API compatibility. AkuBin always appears; no visibility toggle remains.
Signup offers buyer, seller, both and recycler. Logistics applications remain
available after signing in; existing logistics accounts keep their workspace.

Verified signup metadata fills missing profile fields and an unconfigured role.
Existing saved values, selected roles, consent, staff and partner permissions are
preserved. Sign-in and confirmation route directly to the account workspace,
regardless of legacy profile completeness. `/onboarding` is a compatibility redirect
to `/app`; there is no separate setup page. Legacy unassigned roles get a neutral
account dashboard without silently becoming buyers. Settings reads the application profile,
not stale browser registration state. Older accounts can recover available missing
metadata when signing in or loading their own profile. Information that was never
saved by an old registration backend must be entered by the account holder.

Role-specific orders/offers use `?mode=buyer|seller`; ownership is filtered before
pagination. The `/dev/roles` route remains removed. Existing `none` accounts must
choose a role; no staff/partner approval is granted from signup preferences.

User-facing page and workflow explanations start at [Workflow guides](user-guides/README.md).
Validation results and remaining gaps are recorded in [Frontend validation](VALIDATION.md).

The Nest backend is authoritative for public, account and admin data screens.
The previous mixed backend-login/mock-user state caused account page crashes and
exposed seeded marketplace products. Runtime routes now consume backend resources;
the old demo database is not restored. Only pending navigation intent is retained
in session storage. Prototype models/helpers remain as reference and test fixtures.

## Local setup

Run the existing backend on port 3000 and the frontend with `npm run dev`.
Copy `.env.example` to `.env.local`. Vite forwards `/api` to `API_PROXY_TARGET`
(for example `http://localhost:3000`). The default browser API base is `/api/v1`;
`VITE_API_BASE_URL` controls that separately. Restart Vite after editing these values.
`API_PROXY_TARGET` is server-side development configuration and is not exposed to
the browser. Vite loads mode-specific files such as `.env.development.local` too.
In production, forward `/api` from the frontend origin to the backend without
changing its paths. The backend's HttpOnly, SameSite=Lax refresh cookie requires
an appropriate same-site deployment. An unrelated frontend domain will not work
just by changing the API URL; review cookie/CORS deployment configuration first.
Only public configuration belongs in `VITE_*` variables.

Vite's development proxy does not run in a production build. For production, keep
`VITE_API_BASE_URL=/api/v1` and configure the hosting reverse proxy to forward `/api`
to the deployed backend. Alternatively, set `VITE_API_BASE_URL` to the full deployed
API URL before building, with compatible backend CORS and cookie settings. Changing
`API_PROXY_TARGET` alone does not configure production routing. Changes to `VITE_*`
values require rebuilding the frontend.

## Module layout

- `src/lib/api/client.ts`: JSON/multipart transport, typed errors, in-memory access
  token, cookie credentials, shared refresh, bounded authentication retry and timeout.
- `src/lib/api/types.ts`: the migrated backend request and response contracts.
- `src/lib/api/services/`: typed authentication/verification/upload services and the shared resource transport for the other modules.
- `src/lib/api/hooks/use-api.ts`: account-specific query keys and mutation invalidation.
- `src/lib/api/verification-policy.ts`: frontend eligibility matching backend TradePolicy.
- `src/components/api/`: reusable server data states, pagination, account/admin/public feature views, forms and signed images.
- `src/components/verification-page.tsx`: real private uploads and submission history.
- `src/components/verification-review.tsx`: paginated submissions, private document
  access, decisions/reasons and optional expiry.

No passwords, access tokens, signed document URLs or identity submissions are
written to localStorage by the API layer. The refresh token remains an HttpOnly
cookie. Server rendering never refreshes a session or stores a user's token.
Queries do not retry 4xx responses. Mutations do not retry network/provider errors.
Only a rejected authentication request can refresh and retry once.

## Verification contract

1. Register and confirm the email code, or log in with an existing account.
2. Upload actual files with `purpose=verification_document` through `POST /uploads`.
   JPEG, PNG, WebP and PDF are supported, at most 3 MiB per file. The backend checks
   actual file signatures. Completed upload IDs are reused if submission fails.
3. Submit `{ level, type, data, documents: [{ uploadId, kind }] }`. Both tiers require
   at least one document. The backend accepts generic short-string data and document
   kinds; the UI does not invent mandatory NIN/CAC checks or a fixed document checklist.
4. New applications remain pending until authorized staff decide. The UI does not
   simulate provider outcomes, approve itself, or reset backend verification.
5. Full submissions require current basic approval for the same account type.
6. Eligibility requires accepted terms and approved, unexpired records. Full trading
   eligibility requires matching basic/full types. A pending resubmission does not
   invalidate a still-current approval. Superseded approvals are excluded.
7. Staff access comes from the authenticated profile, not `/dev/roles`. Self-review
   is disabled in the UI and rejected by the backend. Private file access is requested
   on demand through signed access URLs.

`useTradeGate` keeps the intended action and checks fresh backend eligibility before
continuing. AkuBin routes do not use this gate. Actual authorization remains enforced
by the backend. Submission status refreshes every 15 seconds and on window focus;
users can also refresh manually. Submitted records and audit history are never deleted
by a frontend reset.

## Connected screens and limits

The app opens the backend dashboard. Marketplace browsing filters and pagination,
listing details/creation/updates, offers, orders, buyer requests, saved items,
notifications, support, profile/preferences, logistics applications, campaigns,
AkuBin totals/PIN/deposits/rewards/leaderboard/locations, published content and
admin queues now use backend HTTP requests. Forms report backend errors and do not
claim success from local mutations. Money and quantity fields remain decimal strings;
integer fields such as vehicle count and rating are converted explicitly.

The reusable resource views render only selected fields from backend responses.
Missing data renders an empty state; a failed request renders an error and retry.
No demo products or accounts are inserted as a fallback. Public views never call
hardware-controller deposit endpoints. AkuBin sessions and points come from actual
controller events. Bin maps show server coordinates on a labelled schematic map.
Staff roles are read from the authenticated backend profile; the old dev role
switcher is disabled. The old browser demo key is retired on hydration.

Additional connected controls include staff assignment, buyer-request response
review, full article editing, recommendations and event tracking, campaign placements
and statistics, account/order inspection, dispute evidence/review, bin maintenance,
collections/controllers/history, points history and reward administration. Their
implementation is separate from successful end-to-end validation; consult the
validation report for the checks actually performed.

This is a development integration. Paystack checkout/verification, payout setup,
settlement, refunds and reconciliation still need frontend completion and provider
testing. Paid-order delivery, dispute decisions and settled reviews cannot be fully
exercised with the current unpaid fixtures. AI and Google provider login remain
unavailable. Campaign tracking has contract tests, but a paid, active placement is
needed for a positive end-to-end tracking check. Email delivery/reset is not repeated
during the page audit. The legal pages remain drafts requiring normal project review.

Visible browser results and screenshots live in the sibling project's
`course-browser/captures/frontend-visible/`. The test listing is paused and the
support ticket is resolved in the configured development database.
# Marketplace navigation

`/marketplace` and `/marketplace/:id` use the shared `AccountShell` for authenticated
sessions, preserving role-specific dashboard navigation and the mobile menu.
Visitors retain the public website header and footer. The `/app` route uses the
same shell; Marketplace permission checks remain enforced by the backend and trade gate.



## Temporary AI support chat

The floating assistant calls `POST /api/v1/assistant/messages` on our backend through `src/lib/api/services/assistant.ts`. Only the backend calls the AI service. Optional authentication uses the existing API client; no provider key is shipped to the browser.

Messages and the random chat session ID live only in React memory. Closing the panel preserves them; 30 minutes without bot interaction, refresh, logout/account change, unmount, or Start new chat clears them and aborts outstanding requests. Each request includes up to 12 recent user/assistant messages, with the new message separate. Neither our backend nor browser storage saves conversations. External AI-service retention is independent.

Loading, retry without duplicate messages, quick suggestions, safe internal route links, and human support escalation are supported. Escalation links to Contact support without automatically creating a ticket or persisting a transcript.


### Listing bookmark eligibility

Saving a listing is available to Buyer accounts and Buyer & Seller accounts while in buyer mode, and only for another seller's published, eligible listing. The backend enforces ownership and role/mode checks within the save transaction. The frontend hides the bookmark for owners, seller-only accounts, seller mode, recyclers, and logistics accounts. Guests can sign in from the bookmark. Saving is not a trade and does not require buyer verification. Existing bookmarks can still be removed after changing roles or mode; saved-list retrieval excludes your own listings. Article bookmarks are independent.


### Marketplace action visibility and listing access

Marketplace actions follow the backend profile's current trading mode. Buyers see Post a buyer request; sellers see Sell your materials and Find buyer requests; dual-role accounts follow their active mode. Guests see Sign in to trade; recycling/logistics-only accounts have no trading actions. Direct access to My listings or the listing editor is blocked outside seller mode. Listing creation/updates require seller mode and the existing marketplace verification; buyer-request creation requires buyer mode and verification. Backend role checks apply even if the frontend is bypassed.


### AkuBin point equivalents

`GET /akubin/me/wallet` and `/akubin/me/summary` include decimal-string `pointValueNaira` and `balanceValueNaira`; summary additionally includes `lifetimeEarnedValueNaira`. The backend multiplies points by the current configured rate using decimal arithmetic, rounding the display value to two decimal places. Missing rate configuration returns null equivalents while preserving point balances.

Dashboard, My AkuBin, and Rewards display the equivalent beneath points. Lifetime equivalent is also valued at the current rate, rather than a historical cash total. These display-only fields do not change points, payment balances, redemption eligibility, or reward fulfillment.
