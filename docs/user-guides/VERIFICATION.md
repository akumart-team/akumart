# Email confirmation and Marketplace verification

## Two different checks

**Email confirmation** proves you control the email used for signup. Supabase sends
the signup code. It is part of account registration.

**Marketplace verification** is an application reviewed by authorized staff. It
decides whether the account can perform restricted trading actions. An email code
does not approve your trading profile.

## The Verification page

The page uses the available main-content width beside the sidebar. Its overview
shows Basic and Full as separate cards. Approved members see their status rather
than an automatically opened application. Review details and submission history
can be expanded when needed.

| Level | What it enables | Prerequisite |
|---|---|---|
| Basic | Publishing/editing listings, making/responding to offers, creating buyer requests and supplier responses | Signed-in account, accepted terms, staff approval |
| Full | Full Marketplace eligibility before checkout; seller payout eligibility | Current basic approval of the same individual/business type |

An approved logistics partner has separate delivery permissions. Partner approval
does not itself approve that account to act as a Marketplace buyer or seller.

## Submit an application

1. Choose **Start basic verification**, or Full after Basic is approved.
2. **Details:** choose Individual or Business and provide supporting information.
   Full follows the account type of current Basic approval.
3. **Documents:** attach at least one supporting document. Choose its type from the
   document menu. Both tiers require actual files, not filenames or links.
4. **Review:** check the details and files, consent to processing, and submit.
5. The application becomes **pending staff review**. It does not approve itself.
6. Return to the page or Notifications for the decision. The page refreshes status
   periodically and also offers a manual refresh.

Files must be JPEG, PNG, WebP or PDF, at most **3 MiB each**. Documents are private;
authorized viewers receive temporary access links. They do not appear on listings.
The backend currently accepts generic supporting information and document kinds;
the form does not promise automatic NIN/CAC checks or impose an invented identity
provider's checklist.

## Decisions, expiry and corrections

| State | What to do |
|---|---|
| Not started | Start the level needed for your action. |
| Pending review / Checking / Collecting | Wait for staff; another application at that level cannot be submitted simultaneously. |
| Approved | Continue the permitted action. Read any expiry date. |
| Needs resubmission / Rejected | Read the reason, correct the information and submit supporting files again. |
| Expired | Submit a new application; an expired approval cannot unlock trading. |
| Superseded | A later approval replaced this record; keep it as history only. |

Use **Update my basic/full information** only when you need a new application.
An existing current approval remains usable during review of its replacement.
Changing Basic from Individual to Business, or vice versa, can mean an old Full
approval no longer matches; complete the matching Full level.

If an action sent you here, the page offers **Resume** once its requirements are
satisfied. Approval does not automatically execute a purchase or submit an offer.
Your pending navigation intent is retained; document contents are not stored in
browser local storage.

Staff cannot review their own verification. Support, operations or super staff
review a specific submission and record a reason, with optional expiry. The backend
also records the review history and updates the account's notifications.

**AkuBin recycling and rewards never require Marketplace verification.**
