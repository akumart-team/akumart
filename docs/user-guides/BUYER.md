# Buyer workflow

Choose Buyer or Both in Settings. The role preference tailors navigation; current
verification and backend ownership checks control trading access.

## Your pages

| Page | What you do there |
|---|---|
| Dashboard | Review purchase/sale counts, offers and recent orders. Counts belong to this shared account, even if it also sells. |
| For you | See suggested materials and reading; hide irrelevant listing recommendations or open All listings. |
| Marketplace | Search the complete visible catalogue, with backend filters and pagination. |
| Listing details | Check price per unit, available stock, minimum order, material, location and seller reviews; save, report or make an offer. |
| My offers | Follow negotiations, counter, accept or reject when it is your turn. Expand history to find the order attached to an accepted offer. |
| Purchases / Orders | Find orders and open delivery/payment state and timeline. |
| Order details | Request logistics, compare/select a quote, cancel an eligible unpaid order, inspect delivery proof, confirm receipt, report an eligible issue, or review a settled sale. |
| My buyer requests | Post demand, view your requests, read supplier responses, shortlist or decline them. |
| Saved | Reopen saved listings/articles or remove bookmarks. |
| Verification | Complete Basic, then matching Full when needed. |
| Notifications / Support / Settings | Read updates, ask for help and maintain profile/preferences. |

## Buy from a listing

1. Browse freely. Open the listing and read its stock, units and minimum quantity.
2. Complete Basic verification if prompted, then make an offer with price, quantity
   and any conditions. A request may fail if stock changed meanwhile.
3. The seller can counter, accept or reject. Counteroffers alternate turns.
   You can have one active negotiation per listing. Continue that negotiation rather
   than sending duplicate offers. After rejection, expiry or acceptance, another
   offer is allowed if the listing has sufficient available stock.
4. Acceptance creates one order and reserves the agreed stock. Repeating acceptance
   does not create a second order. Terms are copied into the order.
5. Open the order. Read the delivery estimate, enter a destination and proposed fare,
   and request logistics. The fare must fit the backend range and step.
6. Eligible approved partners receive the job. Compare submitted quotes and select one.
   No quotes means you can reopen the request; you cannot invent a partner quote.
7. The order is now awaiting payment, not paid. Both buyer and seller need current,
   matching Full verification before checkout.

**Payment is currently unavailable for testing.** Paystack configuration is needed
before proceeding through verified payment, pickup, delivery, settlement and review.

## After payment becomes available

The selected partner can mark pickup, transit and delivery only after verified payment.
After delivery, the partner uploads proof and the inspection period starts. Inspect
the materials and either confirm receipt or open a dispute within the allowed window.
An active dispute/hold prevents normal receipt confirmation or payout progression.

Finance reviews disputes and settlement independently. A seller review is available
only after the order is settled. Confirming receipt is not the same as a completed payout.

## Buyer requests

Post the material, quantity, unit, maximum unit price, city and needed-by date.
Suppliers respond with their own quantity, price and note. Expand **View responses**
on your request to shortlist or decline each response.

Suppliers can edit terms before your decision and submit revised terms after a
decline. Shortlisted terms stay locked. Review the latest terms before deciding;
if they changed while your dialog was open, reload the response and review again.

**Shortlisting does not create an order or charge money.** Continue through a normal
Marketplace listing and offer when you agree to trade. Requests do not currently
have a frontend/backend delete or close action; their date and backend state govern visibility.

## Cancellation and problems

The buyer can cancel an eligible unpaid order. Cancellation releases its reserved
stock once. If a pending or successful payment attempt exists, support must reconcile
it before cancellation; do not retry payment or change local state to bypass that rule.

Disputes require the buyer's order, a held payment, an eligible delivery state and an
open inspection window. Upload any evidence privately. If no dispute form is shown,
the current order does not meet those conditions; use Support for other issues.
