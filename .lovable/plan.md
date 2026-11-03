# AkuMart correction review and implementation plan

## Review outcome

The full six-page correction document and its accompanying instructions have been reviewed against the existing application. **No application code or screens have been changed.**

Preserve the existing logo, palette, typography, layout, sidebar and Marketplace/AkuBin switcher. This is targeted refinement, not a rebuild.

### Already present and worth preserving

- Public Marketplace browsing, listing details, search/filtering and public bin information.
- One shared account, registration consent with Terms and Privacy links, separate Marketplace verification and saved-action restoration.
- The signed-in sidebar, For You feed, listings, offers, orders, buyer requests, saved items, settings and supporting portals.
- Structured offers/counteroffers, partner eligibility filtering, quote selection and simulated payment/delivery/dispute/settlement actions.
- Buyer total calculation without an added surcharge, plus separate seller and partner commission deductions.
- Demo bin map/list/search and closest-bin controls, deposit history, redemptions and period selectors for leaderboards.
- Advertising submission/review and news/article editorial controls.

These are existing foundations, not confirmation that every workflow meets the new specification.

### Main corrections and missing functionality

- About has different Vision text and no separate approved Mission section. Public photos repeat, em dashes remain, and AkuBin imagery shows multiple openings rather than the specified device.
- Signup activates a local account immediately without email ownership confirmation. Onboarding currently presents Buyer or Seller, not all three required choices.
- Marketplace has a discovery feed but no distinct Buyer/Seller overview or instant dashboard role switch. Some record lists are user-scoped, but role scoping needs completion.
- For You listing links lead to the public detail page. Saved/listing/offer links and authenticated news/bin navigation share similar sidebar-loss problems.
- Checkout still permits independent pickup. Quotes use generated amounts and a lowest-price cue, not buyer-proposed recommended fares with plus/minus adjustment and partner acceptance/counters.
- Checkout exposes an extra zero buyer-commission row and an internal payout breakdown rather than the required buyer-only price summary.
- Transaction-qualified seller reviews and moderation are missing. Privacy protection and operational partner disclosure need a complete review, not just hiding fields.
- AkuBin uses alphanumeric codes and phone/PIN cues; its code is consumed by the first deposit. Account-wide numeric codes and safe multi-deposit sessions are missing.
- Reward screens promise expiry/value terms and fixed examples; leaderboards include seeded entries instead of being wholly calculated from eligible records.
- News intake is seeded/manual, not a simulated discovery/deduplication pipeline. Ads lack separate sponsorship/business products, centrally configured packages and genuine event reporting.

### What was checked in the browser

Home, About, public Marketplace, public AkuBin and Signup opened without page errors during this review. About and AkuBin were visually inspected, confirming the copy and bin-image mismatches. Authenticated workflow findings below are based on source review, not newly completed end-to-end tests.

## Approval and review process

1. Approve **one numbered correction only** before its implementation. Approval of this plan does not authorize every correction.
2. Before touching an existing screen, provide its current state, required change, implementation approach and effects on other screens. Explain missing screens/features before building them too.
3. Implement only that approved correction, test its affected journey and report the result for your review.
4. Wait for your review and explicit approval before the next correction. New discoveries that expand the scope require another proposal.

## Recommended implementation order

Each item is a separate approval unit, not permission to change several screens together.

| Order | Affected screens | Required change and dependencies |
|---|---|---|
| **1** | **About Us only** | Exact approved Our Vision and Our Mission in the existing bottom band; preserve design/buttons and remove this page's em dashes. No other screens affected. See detailed proposal below. |
| **2** | Public pages, help/legal, shared footer and sample text | Remove remaining em dashes and consistently identify simulations. Name each affected screen before approval; reward promises are handled in item 16. |
| **3** | Home, About, Marketplace previews and AkuBin imagery | Use distinct realistic public photos. Correct bin images to one intake, LCD, keypad, QR label and solar panel, no camera. Review proposed imagery before replacement; preserve layout. |
| **4** | For You, Saved, My Listings, Offers and listing detail | Add signed-in listing/offer details within the sidebar, fix in-app links and preserve public browsing/shared data. Test return filters/history, direct links and refreshes. |
| **5** | Signup, Login and email confirmation | Add pending confirmation then activation; keep consent, separate trading verification and restore intended actions. Genuine email ownership requires separately approved trusted account services. |
| **6** | Onboarding and Account Settings | Restore Buy Waste, Sell Waste and Buy & Sell Waste; enable the other role later. Depends on activation; retain shared account and independent AkuBin access. |
| **7** | Marketplace sidebar and dashboard navigation | Buyer/Seller switching for Both, role-aware destinations and action/page guards; preserve shared navigation and service switching. Depends on item 6. Server permissions require the security foundation below. |
| **8** | Buyer Dashboard and For You | User-scoped purchase/spend/quantity/category/trend metrics, active orders/offers/requests/saved items, delivery and notifications. Metrics open existing details; For You uses actual interests/activity. Depends on item 7. |
| **9** | Seller Dashboard and existing listing/offer/order views | User-scoped inventory/performance, offers, category sales, orders, gross sales/deductions/net earnings/payouts and delivery. Depends on item 7; reuse records and financial views from item 13. |
| **10** | Listings, Buyer Requests, Offers, Orders and partner details | Complete structured responses/trading checks. Audit contacts/addresses in views, receipts and notifications; only assigned approved partners receive operational details, with access logged. Depends on roles; true privacy needs trusted storage. |
| **11** | Logistics Partner onboarding/dashboard/jobs | Verification, vehicles, territories/material/capacity, all-eligible-partner notifications, statuses, proofs, earnings and disputes. Depends on item 10; protects pre-assignment details and prepares fare negotiation. |
| **12** | Accepted orders, logistics proposal/quotes and partner controls | Remove self-pickup/own logistics. Recommended Fare with plus/minus, configured bounds/step, broadcast, acceptance/rejection/counters, comparison and one frozen selection. Add deadlines, extension/cancellation and no double assignment. Depends on item 11; never pay before selection, no lowest-bid-auction framing. |
| **13** | Checkout, buyer Payments/receipts, seller/partner earnings | Waste Price, Delivery Fee, Total Payable and payment status only for buyer. One simulated payment; internal configurable commissions, company-paid processing costs, distinct paid confirmation and duplicate-safe effects. Depends on item 12; live provider work is separate. |
| **14** | Tracking, inspection, disputes, admin finance and reviews | Delivery/inspection/settlement stages and windows, evidence, separate material/transport disputes and appropriate holds/refunds. Transaction-qualified seller reviews, New seller fallback, rating counts and moderation. Depends on item 13; no financial guarantees from mock states. |
| **15** | AkuBin dashboard, internal locator/details, code/session/history | Internal map/list/search/closest-bin views. Short-lived single-use numeric account codes usable at any demo bin, validated before a multi-deposit session. Unique events, duplicate/rate controls, one active session per bin, connectivity failures. QR stays public information only; no trading gate. |
| **16** | Rewards, impact/history, leaderboard, public benefit text and reward admin | Remove unsupported rates, money equivalents, thresholds and expiry claims. Four approved benefit categories; configured earning/inventory/redemption policies, eligible-record period rankings, points separate from earnings. Depends on item 15. |
| **17** | Public/internal news, For You and editorial admin | Labeled simulated discovery, sourced summaries/date/scope, deduplication/relevance/tags, approval and synchronized publication; signed-in details stay internal. Real monitoring is a separate integration approval. |
| **18** | Advertise, eligible placements and ad admin | Separate Sponsored Listings and Business Advertisements, sectors, listing destinations, creatives, configured duration/pricing, approvals/pause and event reporting. Depends on listing/news navigation. No ads in checkout/verification/disputes/recycling; no fabricated results. |
| **19** | Admin permissions/settings and restricted actions | Complete support/operations/finance/editorial/super-admin scopes and policy coverage. Add settings alongside each approved dependent feature, audit here. Genuine authorization must precede production claims; no public role switcher. |
| **20** | All approved journeys | Final buyer/seller, logistics, recycling/rewards, campaigns, news and admin-dispute end-to-end checks; privacy, accessibility, direct links/refreshes and role switching. Test each correction immediately as well. |

## First correction proposed for approval

**Screen:** About Us.

**Current:** Introductory mission wording, four service/problem sections and a bottom Vision band with different aspirational text. There is no separate Our Mission section using your approved statement.

**Change and approach:** Reuse the existing bottom two-column band for clearly labeled Our Vision and Our Mission. Insert the exact text below, retain the existing calls to action and overall page design, and replace this page's own em dashes with ordinary punctuation. The introductory mission wording will no longer compete with the approved Mission statement.

**Our Vision**

To create a cleaner environment where waste is properly disposed of by giving every reusable material an opportunity to be reused.

**Our Mission**

To connect individuals and businesses that have reusable waste with businesses that need these materials for production, recycling, and repurposing through an easy and accessible marketplace.

**Impact:** About Us text/layout within the existing band only. No shared footer, photo replacement, account, sidebar or trading changes. Public image variety is a separate approval. Check the page at narrow and wide sizes after implementation.

**Approval requested:** Correction 1 only. All other items stay pending.

## Technical dependencies and honest prototype limits

- Current data, accounts, credentials, roles, payments and bin events are stored in the browser. They are editable/inspectable there. Do not enter real passwords or sensitive identity documents into this prototype.
- Client-side gates cannot establish genuine email ownership, private-data protection, server permissions or trusted bin/payment events. These need a separately approved Lovable Cloud security/data foundation before claiming those requirements are fulfilled. No service connection or data migration is authorized by this plan.
- Production payment/split/hold/refund capabilities and live bin connections remain out of scope without credentials and verified support. News discovery can be a labeled simulation until real sources/scheduling are approved.
- No production fare, reward, expiry or advertising policy has been supplied. Do not substitute hardcoded examples for those decisions. Use explicit configured demo policy where needed and request actual policy before production use.
- Reuse existing routes, components, shared records and rule tests. Add concrete behavioral tests for every approved business-rule change and verify the affected real user journey before reporting it complete.