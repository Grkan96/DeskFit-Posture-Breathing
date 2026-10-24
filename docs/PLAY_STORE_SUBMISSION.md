# Google Play Submission Guide

Package: `com.gurkanuslu.durus` (permanent once published). Note: the Play
policy details below are from memory of the policy as of early 2026 and could
NOT be re-verified online while writing this; check the linked Play Help pages
before relying on numbers.

## 0. Before you start (blockers)

- [ ] Put a real contact email in `docs/privacy-policy.html` (TR + EN sections) and host it publicly (GitHub Pages from `docs/` works). Use that URL in Play Console.
- [ ] AdMob: create the app, banner unit (Android already set in `app.json` / `lib/ads.js`), and in AdMob > Privacy & messaging create and PUBLISH a GDPR message (EEA/UK). Without a published message, `AdsConsent` never shows a form. Add `app-ads.txt` on your developer website domain.
- [ ] `google-play-service-account.json` (for `eas submit`) must NEVER be committed. Add it to `.gitignore`.
- [ ] Developer account: identity + phone verified.

## 1. Create app

Play Console > Create app: name, default language (Turkish or English), App (not game), Free, accept declarations. Enable Play App Signing (default).

## 2. App content section (Policy > App content)

1. **Privacy policy**: URL of hosted `privacy-policy.html`.
2. **Ads**: "Yes, my app contains ads".
3. **App access**: all functionality available without login.
4. **Content rating**: category "Utility / productivity / other" style questionnaire. Answer No to violence, sexual content, profanity, gambling, drugs, user-generated content, location sharing. Ads are allowed. Expected rating: Everyone / PEGI 3 / IARC 3+.
5. **Target audience**: choose **13+ only** (or 18+). Do NOT include under-13 groups: that would pull the app into the Families policy and restrict ad SDKs (AdMob would need to be child-directed configured).
6. **Data safety** (see table below).
7. **Government apps**: No. **Financial features**: none. **Health apps declaration**: select the honest option: the app is wellness/reminders, not a medical device, no health-data collection or medical claims (if Play lists an option "none of these"/"wellness only", use it).
8. **Advertising ID declaration**: "Yes, the app uses advertising ID" -> purpose: Advertising or marketing. (The AdMob SDK declares `com.google.android.gms.permission.AD_ID`; the answer must match, otherwise the release is flagged.)
9. **News app**: No. **COVID/Health Connect**: No.

### Data safety answers

| Question | Answer |
|---|---|
| Does the app collect or share required user data types? | Yes |
| All data encrypted in transit? | Yes (AdMob uses HTTPS) |
| Users can request data deletion? | Yes: local data is deleted by uninstalling; ad data via Google account controls (state this in the policy, already done) |
| **Device or other IDs** (advertising ID) | Collected: Yes. Shared: Yes (Google AdMob). Optional: No/required by ads SDK. Purposes: Advertising or marketing. Processed ephemerally: No |
| **App activity / App interactions** (ad interaction) | Collected + shared with Google AdMob, purpose Advertising, Analytics-like ad measurement |
| **Approximate location** (IP-derived by AdMob) | Collected + shared, purpose Advertising |
| **App info and performance** (crash logs/diagnostics by AdMob SDK) | Collected + shared, purposes Advertising, Analytics-like diagnostics |
| Name / personal info | NOT collected: name is stored only on the device and never leaves it (Play: "collected" means transmitted off-device) |
| Health and fitness | Not collected (session counts stay local) |

When AdMob's own guidance (Google's "Play Data Safety" page for AdMob) lists
additional data types, follow that list: it is the source of truth for the ad SDK.

## 3. Store listing

Use `docs/store-listing/01-listing-en.md` and `02-listing-tr.md`. 512x512 icon, 1024x500 feature graphic, 8 phone screenshots per language (`04-screenshots.md`). Category: Health & Fitness. Contact email (public) required.

## 4. Testing requirement for new personal accounts

Personal developer accounts created after 13 Nov 2023 must run a **closed test
with at least 12 testers opted in, continuously for 14 days**, before they can
apply for production access (organisation accounts are exempt). (Unverified this
session: confirm the current numbers at
https://support.google.com/googleplay/android-developer/answer/14151465 , Google
has changed this rule before.)

Steps:
1. Testing > Closed testing > create track; upload the AAB (see `docs/release-runbook.md`).
2. Testers: create an email list / Google Group with 12+ real people; each must opt in via the opt-in link and stay opted in. Recruit ~20 to be safe.
3. Wait 14 continuous days; testers should actually install and use it (activity counts in the production-access questionnaire).
4. Dashboard > "Apply for production": answer questions about testing, app, and readiness. Review can take days.
5. Then create a production release, choose countries (start with Turkey + English-speaking markets), and roll out (staged 20% -> 100% recommended).

## 5. Final checks

- Pre-launch report (auto-run on test tracks): fix crashes/accessibility flags.
- Confirm consent form appears from an EEA test device (see runbook: UMP debug geography) and no ads load before consent.
- Set `APP_STORE_URL` in `lib/sharing.js` after publish (`https://play.google.com/store/apps/details?id=com.gurkanuslu.durus`) and ship 1.0.1.
