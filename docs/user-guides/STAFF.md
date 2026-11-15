# Staff console and permissions

Staff access comes from an active backend membership. A buyer/seller switch never
grants access. Super administrators assign an existing account in **Settings → Staff
and permissions**, select its role and enabled state, and provide an audit reason.
The last active super administrator cannot be removed. Initial staff bootstrap is
a deployment operation, not a public account flow.

| Role | Main responsibilities |
|---|---|
| Super | All staff areas; assign roles, configure settings/packages and view audit records. |
| Operations | Operational overview, users/orders, listing moderation, partner review, bin management, verification and support. |
| Support | User/order investigation, verification review, support tickets/enquiries and dispute queue. Financial dispute decisions require finance or super. |
| Finance | Payments and order investigation, holds, disputes and reward review/catalogue/rules. Settlement/refund execution depends on payment integration. |
| Content | Articles, news and campaign moderation. |

The console hides unavailable navigation, and the backend enforces permissions on
every request. Roles are not inferred from account email or local browser state.

The header on every admin page includes **Switch to my account** and **Sign out**
(on mobile, the account link reads **My account**). Switching keeps you signed in.
Sign out first opens a confirmation dialog. **Stay signed in** cancels; **Yes, sign
out** calls the backend logout endpoint, clears the frontend session and returns
you to Sign in. Admin pages are then restricted again. The same dialog works on mobile.

| Page | Actions and workflow |
|---|---|
| Overview (`/admin`) | Read authorized summaries, search users and inspect orders, participants, holds and delivery proof. User details are read-only. |
| Verification (`/admin/verification`) | Open private documents and decide a submission with a reason and optional expiry. Never review your own submission. Approval follows backend tier/type rules. |
| Listings (`/admin/listings`) | Review listings and moderation status with a reason. Moderation is distinct from the owner's publish/pause setting. |
| Partners (`/admin/partners`) | Inspect business documents and approve, reject or suspend an application. Rejected partners may reapply. |
| Bins (`/admin/bins`) | Register a location; manage details, maintenance, collections, controllers, telemetry and operational history. |
| Support (`/admin/support`) | Update tickets, read enquiries and investigate disputes. |
| Finance (`/admin/finance`) | Inspect payment/order records, manage holds/dispute decisions and AkuBin rewards. |
| Content (`/admin/content`) | Create articles, load complete article content for editing, publish/unpublish and review news proposals. |
| Advertising (`/admin/ads`) | Moderate campaigns; super administrators configure packages. Approval requires the backend's payment checks. |
| Settings (`/admin/settings`) | Read platform settings; super can initialize/update configuration and edit staff memberships. Audit records show recorded changes. |

## Bin operations

Use **Manage bin** to open its tabs. Opening a maintenance ticket makes the bin
unavailable. Resolving a ticket does not automatically put it online: inspect the
physical device first and explicitly update availability. A collection record resets
recorded capacity but does not open any physical lock.

Register only the intended controller. An authenticated controller key is shown once:
save it securely and provision the hardware. Legacy mode is a separately configured
pilot option. Revocation disables the controller and ends its active sessions while
retaining history. Do not replace the live controller merely to test the UI.

## Financial and reward decisions

Use a reason when placing/releasing holds or deciding disputes. Transaction
participants cannot release their own transaction or decide their own dispute.
Provider failures may leave a pending backend operation; refresh and investigate
before retrying. Paystack settlement, refund, payout and reconciliation workflows
are not yet validated through the frontend.

Reward rejection returns reserved points/stock once. Approval awaits fulfilment.
Record a fulfilment reference only after the reward was actually delivered by the
operator/provider. This form records a receipt; it does not transfer money or airtime.
Archive a reward to remove it from the active catalogue. Changes to earning rates
affect subsequent validated hardware events; use the agreed operational policy.
