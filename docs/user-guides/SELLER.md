# Seller workflow

Choose Seller or Both in Settings. With Both, switch modes in the sidebar. Staff
permissions are separate; selling never grants access to the admin console.

## Your pages

| Page | What you do there |
|---|---|
| Dashboard | See your account's listing/order counts, incoming offers and recent orders. |
| My listings | Open drafts/published/paused listings, edit them, publish or pause. |
| Create listing | Upload a real image and enter material, grade, condition, quantity, unit price, minimum order, partial-order preference, pickup city/area and description. |
| Incoming offers & negotiations | Review buyer terms, counter, accept or reject when it is your turn. Expand history and open the resulting order. |
| Sales & orders | Follow your orders and their timelines. |
| Buyer requests | Read demand and respond with quantity, price and a note; you cannot respond to your own request. |
| For you | Browse recommendations and other published materials/reading. |
| Verification / Notifications / Support / Settings | Maintain eligibility, follow updates, ask for help and change preferences. |

## List materials

1. Complete current Basic verification. The backend requires it even to save or edit
   a draft; this is not an offline draft editor.
2. Open Create listing and continue through the verification gate.
3. Upload an image (JPEG/PNG/WebP, at most 3 MiB). Describe the actual material and
   location, then save as Draft, Published or Paused.
4. A published listing appears publicly only while its seller is eligible and stock
   remains available. Paused/draft listings remain visible to their owner, not the public.
5. Use My listings to edit or pause. Moderation flags may require staff action before editing.

Available stock is **total quantity minus reserved and sold quantity**. You cannot
reduce total stock below existing reservations/sales. Publishing a listing does not
prove a sale, payment or collection happened.

## Negotiate and fulfil a sale

1. A buyer submits an offer. Review its price, quantity and conditions.
2. Counteroffers alternate turns. Accepting the latest valid terms creates an order
   and reserves stock. Closed/expired offers cannot be negotiated again.
3. The buyer requests logistics and chooses a partner quote. There is no simulated
   self-pickup path that bypasses logistics.
4. Complete matching Full verification before the buyer can check out. Both buyer
   and seller must meet the backend requirement at that stage.
5. Await verified payment before physical fulfilment. The partner records pickup,
   delivery and proof. Follow the order timeline rather than a verbal payment claim.
6. Buyer inspection/confirmation or dispute handling comes before finance settlement.
7. Seller and partner payout accounts are required for actual release. An independent
   finance reviewer handles release; a participant cannot release their own transaction.

Payment, payout and settlement execution are currently pending Paystack configuration.
The frontend does not simulate them or add fees to a buyer's total locally.

## Buyer-request responses and disputes

Your response to a buyer request is an expression of supply, not an order. The buyer
can shortlist/decline it. Proceed through a listing and offer for an actual trade.

Open **View & respond** to check your current response. While it is **Sent**, use
**Edit response** to change the price, quantity or message before the buyer decides.
If it is **Declined**, use **Send revised response** to submit new terms for review.
**Shortlisted** responses are locked. Editing and resubmitting require an open,
unexpired request and current Basic verification. Each supplier has one current
response per request; revisions retain the same response ID and an audit history.

Requests, negotiations and orders have separate searchable card views. Use the
request dialog for supplier terms, the negotiation history for counteroffers, and
the order details page for fulfilment.

The buyer initiates an eligible delivery dispute. You can view order information and
authorized evidence; staff make the applicable decision. Use Support to provide context
or resolve account issues. Sellers cannot use the buyer-only unpaid cancellation action.
