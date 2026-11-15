# Frontend validation

Development validation date: 15 November 2026. Frontend: `http://localhost:8080`;
existing backend: `http://localhost:3000`. These results describe the development
database, not production readiness.

Result: **40 distinct visible-browser checks passed**, with no unresolved failures
in this pass. Earlier test-helper failures were corrected and successfully rerun.

## Automated checks

- TypeScript: passed (`node node_modules/typescript/bin/tsc --noEmit`).
- Vitest: 37 tests passed across 7 files.
- ESLint for API components, verification centre and changed tests: no errors;
  one existing Fast Refresh mixed-export warning in `data-view.tsx`.
- Production frontend build: passed. Tooling reports the existing tsconfig-paths
  plugin advisory; deployment was not performed.

Fixed during validation: missing `ActionButton` import in admin settings. Updated
verification tests for the three-step form; added document upload reuse after a
failed submission, full-tier type/eligibility and tracking contract checks.

## Visible browser checks

The persistent visible Edge browser navigated the actual frontend and used its
forms. Successful requests below went to the real development backend, rather
than mocked browser responses.

| Area | Evidence / scope |
|---|---|
| Member pages | Marketplace, requests, offers, AkuBin, rewards, partner and verification loaded without page errors or failed API responses. |
| Staff pages | Overview, settings, bins, finance, support, content and advertising loaded under super staff without page errors or failed API responses. |
| Verification | Approved account opens an update deliberately; Details → Documents flow; missing document blocks continuation. Desktop fills the main area. Mobile at 390px has no horizontal overflow. No additional identity application was submitted in this run. |
| Staff management | Edited an existing inactive membership through PUT, then restored the original role and enabled state. |
| Buyer-request review | Loaded a supplier response; declined it, then restored shortlisted status. |
| Account/order records | Searched an account and opened its detail; inspected a real order. No money or payment state was changed. |
| Bin operations | Created a dedicated offline test location; edited it; opened/resolved maintenance; recorded a synthetic collection; registered/revoked its authenticated controller; opened telemetry and event history. |
| Articles | Created a draft, loaded the full editing payload, published it, opened public detail and unpublished it again. |
| Recommendations | Temporarily published the existing development listing; verified accepted impression/view/dismiss events with another account. Restored the listing to paused. |
| Rewards | Created a one-point physical test reward, requested it as a member, rejected it as staff and archived it. Ledger validation checks one debit and one matching refund for that request. |
| Expandable account details | Session details, points activity, reward rules and offer negotiation history. See machine-readable results for final status. |

Browser evidence is in the sibling `course-browser/captures/frontend-visible/`
directory in the workspace. Files include:

- `additional-validation.json`: this run's checks, failures and rerun resolutions.
- `ADDITIONAL_VALIDATION.md`: generated readable result summary.
- `history.jsonl`: page navigation and API method/status metadata.
- Page screenshots, `verification-mobile.png` and `controller-key-masked.png`.
- Earlier `REPORT.md` / `flows.json`: preceding public/member/staff page audit and
  listing, upload, support, login/logout and access-control checks.

Test helper errors (wrong expected success status, ambiguous selector and viewport
restoration) are retained in the evidence and marked resolved after successful reruns.
One-time controller keys are masked in screenshots and excluded from saved results.

## Development fixtures and cleanup

- Dedicated test bin `33b3af67-78f2-404d-8f12-fa1dbf6c5588`: offline; maintenance
  resolved; test controller revoked. Real physical bin controllers were not replaced.
- Article `d3679c9d-6b25-46c4-8d11-a6bd1ceac838`: unpublished.
- Reward `f697d3ff-dbdc-463b-a252-3dd438bcb99c`: archived; redemption
  `3718505f-f381-41c5-b7c2-c0bfc8765638` rejected, returning its reserved point.
- Listing `176c0af9-7b2e-4a63-9485-6a49e32283ae`: restored to paused.
- Existing member staff access restored; buyer response restored to shortlisted.
- Synthetic records and their audit history are retained for review.

## Still requires validation or integration work

| Workflow | What is required |
|---|---|
| Payments, payout setup, refunds and reconciliation | Finish frontend payment controls; configure Paystack test credentials/webhooks and use actual test payment references. |
| Paid-order delivery, proof, buyer receipt, disputes and settlement | Real verified test payment, eligible independent logistics partner, actual test evidence, buyer/seller and an independent finance actor. Do not manufacture held payments or completed delivery records. |
| Reward approval and completed fulfilment | A reward genuinely fulfilled in the test operation and its existing operator/provider receipt. Only the request/reject/refund branch was exercised here. |
| Paid campaign placements and statistics | A paid, approved, active campaign plus backend tracking configuration. Empty placement reads and mocked tracking contract checks do not prove a live paid placement. |
| Recommended jobs and approved-partner controls | An approved partner with eligible jobs. The current logistics fixture is suspended; page reads alone do not validate an approved partner's entire lifecycle. |
| Fine-grained staff permissions | This run covers super access and inactive-member rejection. It does not exhaustively exercise every page under each of operations, support, finance and content. |
| Other configuration/moderation forms | Page reads are checked, but not every settings, package, rate, news, moderation or application mutation was submitted. |
| AI assistant / Google sign-in | Available and configured providers, then frontend integration/validation. |
| Email delivery / recovery | Was tested previously on the backend; email delivery was not repeated in this browser pass. |

The role-specific explanations start at [User guides](user-guides/README.md).
# Trading response revisions — 15 November 2026

Implemented supplier edits while a response is sent, revised resubmission after
decline, and locked shortlisted terms. Requests must remain open and unexpired.
The backend enforces ownership and verification, checks edit version timestamps,
and stores before/after audit records. The frontend sends version timestamps for
supplier changes and buyer decisions and refreshes resources after errors.

Buyer/listing negotiations now allow one unexpired active offer. Rejected,
accepted or expired negotiations allow a new offer subject to available stock.
Existing negotiations remain accessible from listing details.

Validation for this change:
- Frontend: 80 tests passed, TypeScript and production build passed.
- Backend: isolated compilation passed; all 17 platform API tests passed against
  an isolated database, including editable terms, stale decisions, declined
  resubmission, audit snapshots and duplicate active-offer rejection. Provider
  integrations in this suite are stubs, not live payment validation.
- Visible browser: 12 layout checks passed across Requests, Offers, Orders and the
  supplier-response dialog at 1440, 768 and 390 pixels. No horizontal overflow or
  page alerts. The live fixture was shortlisted and remained unchanged; edit and
  resubmission mutations were tested in the isolated API and frontend suites.

Guides: [Seller](user-guides/SELLER.md), [Buyer](user-guides/BUYER.md).
No additional database migration is needed for these response rules.

