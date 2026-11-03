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

Each numbered item is a separate approval unit. Its affected screens and dependencies are listed so the existing UI can be preserved.

| Order | Affected screens | Proposed correction | Dependencies / effects |
|---|---|---|---|
| **1** | **About Us only** | Replace the existing Vision band with clearly differentiated Our Vision and Our Mission using your exact statements. Preserve its existing two-column treatment and buttons. Remove em dashes from this page's own text and title. | No account, navigation, payment or reward changes. Detailed first proposal below. |
| **2** | Public pages, help/legal text, shared footer, visible sample content | Audit and remove remaining em dashes; consistently mark simulated figures, activities and capabilities without inventing operational claims. | Shared text can affect multiple pages, which must be named before approval. Reward policy wording is handled in item 16. |
| **3** | Home, About, Marketplace previews, AkuBin and associated imagery | Replace repeated public photos with distinct realistic images. Correct AkuBin images to one intake, LCD, numeric keypad, QR label and solar panel, no camera. Use official branding only. | Generate proposed images for review before replacing them. Preserve compositions, dimensions and typography. |
| **4** | For You, Saved, My Listings, Offers and listing details | Add an internal signed-in listing detail/offer presentation and direct in-app links there, preserving public browsing and shared listing content. | Reuse existing listing and offer behavior. Preserve return filters/history and test direct links/refreshes. No dashboard redesign. |
| **5** | Signup, Login, account email confirmation | Add pending-email-confirmation and activation steps, retain consent links and intended-action restoration. Keep account email verification separate from trading verification. | Requires the account-security decision below. A demo step must not claim to verify real email ownership. |
| **6** | Onboarding and Account Settings | Restore Buy Waste, Sell Waste and Buy & Sell Waste; allow later activation of the other role with appropriate prompts. | Follows account activation. Retain one account and independent AkuBin access; preserve listing/bin intent. |
| **7** | Marketplace sidebar and dashboard navigation | Add Buyer/Seller view switching for Both, role-aware destinations and page/action guards while preserving shared destinations and service switching. | Depends on item 6. Genuine server-enforced permissions require the separately approved security foundation. |
| **8** | Buyer Dashboard, For You | Build procurement overview: purchases, spend, quantities/categories/trends, orders/offers/requests/saved items, delivery and notifications. Clickable metrics use the user's records. | Depends on item 7; reuse existing detail views. Keep For You as discovery based on actual interests/activity, not fabricated behavior. |
| **9** | Seller Dashboard, My Listings, Received Offers, Sales Orders | Build inventory/revenue overview: listing performance, offers, category sales, completed orders, gross sales, deductions, earnings/payouts and delivery. | Depends on item 7 and shared scoped selectors. Financial views are completed in item 13, not duplicated. |
| **10** | Listings, Buyer Requests, Offers, Orders, partner operational details and reporting | Complete structured request responses and trading checks. Audit private-field exposure across views/receipts/notifications; restrict operational contacts to assigned approved partners and record access. | Depends on roles. True confidentiality requires trusted storage/authorization; the current browser store cannot provide it. Preserve structured negotiations, no unrestricted messaging. |
| **11** | Logistics Partner onboarding/dashboard and job details | Complete verification, vehicles, territories/material/capacity, eligible job notifications, operational status/proofs, earnings, disputes and assignment-scoped details. | Depends on item 10. Notify all eligible approved partners, not only nearest. Creates the operational foundation for fare negotiation. |
| **12** | Accepted offer/order, logistics fare/quote comparison and partner quote controls | Remove self-pickup/own logistics. Add Recommended Fare with minus/plus proposal, configurable bounds/step, request broadcast, accept/reject/counters, partner selection and frozen fare. Add Awaiting Logistics deadlines, extension/cancellation and prevent double assignment. | Depends on item 11 and centrally configured sample fare rules. Remove lowest-price-auction framing. No payment until an eligible partner is selected. |
| **13** | Checkout, buyer Payments/receipts, seller Earnings & Payouts, partner earnings | Show Waste Price, Delivery Fee and Total Payable only, plus payment/receipt status. Collect one simulated payment; keep commissions internal and processing fees as company cost. Separate paid confirmation from accepted offers; prevent duplicate payment/order effects. | Depends on item 12. Live payment support/credentials remain separate and unapproved. No custody or financial guarantee claims. |
| **14** | Tracking, inspection, disputes, finance/admin resolution and seller review | Complete agreed delivery/inspection/settlement stages, configurable windows, distinct material/transport disputes, evidence, payout holds/refund outcomes and audit events. Add completed-verified-transaction-only reviews, New seller fallback, rating counts and moderation without seller deletion. | Depends on item 13. Provider-supported production releases/refunds cannot be promised from demo states. |
| **15** | AkuBin dashboard, internal locator/bin details, Generate Recycling Code and active session/history | Keep signed-in locator/details inside the sidebar. Replace permanent PIN/alphanumeric identity with short-lived single-use numeric account codes redeemable at any demo bin. Validate before starting one session; support multiple deposits, event deduplication, rate limits, one active session per bin and connectivity failures. | Independent of trading verification. QR remains public bin information only and preserves context. Genuine hardware verification needs an approved trusted service. |
| **16** | AkuBin rewards, impact/history, leaderboard, public benefit text and reward admin | Remove unsupported rates, money equivalents, thresholds and expiry promises. Present Airtime and Data, Cash Rewards, Physical Gifts and Personal Recycling Impact; centralize policies/inventory. Calculate period rankings from eligible verified recycling records and keep points separate from earnings. | Depends on item 15. Show configured sample policy as demo only; do not invent production reward values. |
| **17** | Public/signed-in news, For You and editorial admin | Add labeled simulated discovery, summaries, deduplication, relevance/tags, source/link/publication date/geographic scope and editorial approval. Synchronize published news and keep signed-in details internal. | Reuse shared content records; live monitoring/scheduling is a separate integration approval. |
| **18** | Advertise, For You/search/news/public placements and ad admin | Separate Sponsored Listings and Business Advertisements, eligible sectors, real listing destinations, creative submission, configurable durations/prices, approvals/pause and event reporting. | Depends on internal listing/news navigation. No ads in checkout, verification, disputes or active recycling. Never generate fake performance on approval. |
| **19** | Admin permissions/settings and affected restricted actions | Complete support/operations/finance/editorial/super-admin scopes and central policy management. Add configuration alongside each approved dependent feature, then audit coverage here. | Trusted authorization must precede production claims. No public role switcher. Preserve current staff-only demo entry. |
| **20** | All approved journeys | Final end-to-end regression, privacy, direct-link/refresh, role-switching, accessibility and layout review. | Test each correction immediately too. Final paths cover buyer/seller, logistics, numeric-code recycling, rewards, campaigns, editorial and admin disputes. |

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