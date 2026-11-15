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
   Buyer & Seller or Recycle & Earn. Enter and confirm your password, then accept
   the account terms. All these fields are required.
3. AkuBin is included automatically with every account. Submit registration and
   check your email for the confirmation code.
4. Enter the 6?8 digit code. Use Resend code if needed; requests may be rate limited.
5. Signup details are saved to your profile before you enter the account.
   Recycle & Earn opens My AkuBin; Buyer, Seller and Buyer & Seller open their
   dashboard. There is no second onboarding screen after sign-in or confirmation.
   Older incomplete accounts also enter a dashboard and can update missing details
   in Settings. Old `/onboarding` bookmarks redirect to the account dashboard.
   Material interests remain optional.

Passwords must contain 8–72 characters and cannot be all spaces. Confirmation must
match. Phone numbers use 10–15 digits with an optional leading `+`; supplying a phone
does not itself prove ownership of that number. Email verification is separate from
Marketplace identity verification. Business and vehicle documents are required when
applying for logistics approval, rather than from every person at signup.

Joining does not automatically approve Marketplace verification. Use the separate
[Verification guide](VERIFICATION.md) when you want to trade.

## Sign in and account recovery

`/login` signs you into the existing backend account. On a normal reload, the refresh
cookie restores the session. If it expires or is revoked, sign in again. Sign-in
and email confirmation always open your account dashboard, including when an old
login link contains a redirect parameter. Staff keep their staff console landing.

`/forgot-password` requests a recovery code and accepts the code plus a new password.
A provider error means the request did not complete; the UI must not claim an email
was delivered. Email recovery was not repeated in the frontend page audit. Google
provider sign-in is not currently available.

Choose Sign out, then **Yes, sign out** to confirm. **Stay signed in** cancels without
ending the session. Confirmed logout clears the frontend session after backend
logout and opens Sign in. A failure stays visible in the dialog so you can retry.
Staff pages remain restricted regardless of the URL you enter.
