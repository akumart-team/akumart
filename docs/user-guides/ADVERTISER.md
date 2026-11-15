# Advertising workflow

Public **Advertise** explains the available backend packages. Signed-in members use
**Advertise** (`/app/advertise`) to create campaigns and view their own campaign history.

| Section | Purpose |
|---|---|
| Packages | Current placement, duration and pricing supplied by the backend. |
| New campaign | Choose a package, enter campaign copy and destination, targeting and upload the creative. |
| My campaigns | Track payment/review status and any moderation reason. |
| Campaign statistics | Expand a campaign to view recorded impressions, clicks and their ratio. |

Creating a campaign does not publish it. The backend snapshots the package price;
verified payment and staff approval are required for an active campaign to appear.
Paystack execution is currently unavailable for testing, so creation or an empty
placement response must not be described as a successful paid campaign.

Active placements can appear on Home, Marketplace, Articles and the account dashboard.
The browser records a visible impression and clicks using the backend-issued signed
tracking token. A client cannot manufacture its own valid tracking token. Targeting
can depend on the member's city and Marketplace preference.

Statistics reflect accepted tracking events, not a guarantee of unique people or
sales. Use Support for payment reconciliation or a moderation dispute. Campaign
refund and reconciliation controls still require payment integration completion.
