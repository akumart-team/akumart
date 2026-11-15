# Visitors and new accounts

## Before signing in

| Page | Purpose and actions |
|---|---|
| Home (`/`) | Overview of Marketplace and AkuBin, published reading and links to get started. |
| About (`/about`) | Explains the service and its purpose. |
| How it works (`/how-it-works`) | Introduces trading and recycling journeys. |
| Marketplace (`/marketplace`) | Search published materials by text, material, city, price and sort. Results come from the backend. |
| Listing (`/marketplace/:id`) | Read a visible listing and seller reviews. Sign in to save, report or make an offer. |
| Articles (`/articles`) | Published articles and approved news. Unpublished content is not public. |
| Article (`/articles/:slug`) | Read the published article; signed-in members can save it. |
| AkuBin (`/akubin`) | Find registered bins, availability, accepted materials and locations. |
| Bin details (`/akubin/bin/:code`) | Location and recycling instructions for the printed code. |
| FAQ / Help (`/faq`, `/help`) | Answers, explanations and a route to support. |
| Contact (`/contact`) | Send an enquiry or support ticket. It is received only after the backend accepts it. |
| Advertise (`/advertise`) | Available packages and the route to an advertiser account. |
| Legal (`/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/acceptable-use`) | Current project legal documents; these remain drafts for the project's review. |

## Create an account

1. Open **Get started** or `/signup`.
2. Enter first name, last name, display name, email, phone and city. Choose Buyer, Seller,
   Buyer & Seller or Logistics Partner. Enter and confirm your password, then accept
   the account terms. All these fields are required.
3. Optionally tick **Show AkuBin in my workspace**, regardless of your chosen role.
   This controls workspace shortcuts and activity cards. Leaving it unchecked does
   not disable your PIN or prevent you from earning points at a bin.
   Submit registration and check your email for the confirmation code.
4. Enter the code. Use Resend code if needed; repeated requests may be rate limited.
5. Review onboarding (`/onboarding`): your chosen role and contact details are saved.
   Material interests and AkuBin are optional. Finish setup to open your workspace.
   Older incomplete accounts must supply the missing details and choose a role.
   You can change preferences later in Settings.

Passwords must contain 8–72 characters and cannot be all spaces. Confirmation must
match. Phone numbers use 10–15 digits with an optional leading `+`; supplying a phone
does not itself prove ownership of that number. Email verification is separate from
Marketplace identity verification. Business and vehicle documents are required when
applying for logistics approval, rather than from every person at signup.

Joining does not automatically approve Marketplace verification. Use the separate
[Verification guide](VERIFICATION.md) when you want to trade.

## Sign in and account recovery

`/login` signs you into the existing backend account. On a normal reload, the refresh
cookie restores the session. If it expires or is revoked, sign in again; protected
account pages return you to login and preserve the destination.

`/forgot-password` requests a recovery code and accepts the code plus a new password.
A provider error means the request did not complete; the UI must not claim an email
was delivered. Email recovery was not repeated in the frontend page audit. Google
provider sign-in is not currently available.

Signing out clears the frontend session after backend logout. Staff pages remain
restricted regardless of the URL you enter.
