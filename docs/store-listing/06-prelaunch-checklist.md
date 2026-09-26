# Pre-launch Checklist

## A. Blocking items found in the code (verified)

- [ ] `app.json` has no `android.package`. Required for Play. Suggested: `"package": "com.<yourname>.durushatirlatici"` (pick once, it can never be changed after publishing; Play id is permanent).
- [ ] `app.json` has no `ios.bundleIdentifier`. Required for App Store builds; use the same reverse-domain, e.g. `com.<yourname>.durushatirlatici`.
- [ ] No `android.versionCode` and no `ios.buildNumber`. `eas.json` sets `appVersionSource: "local"` and production `autoIncrement: true`, so EAS increments them, but with local source the initial values should still be declared: `"versionCode": 1`, `"buildNumber": "1"`. `version` is `1.0.0` already.
- [ ] Missing `ios.infoPlist` / permission strings review: notifications need none, but verify after the first iOS build. Set `"ios.config.usesNonExemptEncryption": false` (`ITSAppUseEncryptionExemptionKey`) to skip the export-compliance question.
- [ ] AdMob IDs are Google TEST IDs in two places. Replace with real ones (create AdMob account, add both apps, create Banner units):
  - `app.json` -> plugin `react-native-google-mobile-ads`: `androidAppId` (`ca-app-pub-3940256099942544~3347511713`) and `iosAppId` (`ca-app-pub-3940256099942544~1458002511`).
  - `lib/ads.js`: `TEST_BANNER_AD_UNIT_ID` (ios `.../2934735716`, android `.../6300978111`) exported as `BANNER_AD_UNIT_ID`. Use separate real unit IDs per platform (e.g. `__DEV__ ? TEST : REAL`, never click your own live ads or risk an account ban).
  - Add `app-ads.txt` on your developer website domain (AdMob asks for it).
- [ ] `lib/sharing.js`: `APP_STORE_URL = null`, so share text has no store link. After publish set to `https://play.google.com/store/apps/details?id=<android.package>` (optionally choose per platform with `Platform.select` and add the App Store URL `https://apps.apple.com/app/id<APPLE_ID>`). Also consider adding a Play referrer/UTM parameter, e.g. `&referrer=utm_source%3Dshare`, to measure sharing installs.
- [ ] `lib/i18n` + notifications: confirm the notification title for TR reads "Duruş Hatırlatıcı" (not the EN "Posture Reminder") when the app language is TR.
- [ ] `android` needs the `POST_NOTIFICATIONS` runtime permission flow verified on Android 13+ on a real dev build (not Expo Go); exact-alarm behaviour after reboot should be tested since the app relies on scheduled notifications.
- [ ] Expo Go patch: the project patches expo-notifications (patch-package). Production/dev-client builds must work without the patch side effects; do a preview build (`eas build -p android --profile preview`) and test notifications end to end before store submission. Reminder: rerun patch generation after SDK bumps.

## B. Google Play Console

- [ ] Developer account verified (identity, phone, D-U-N-S if organisation).
- [ ] Closed test: 12+ testers opted in for 14 continuous days (personal accounts created after Nov 13, 2023). Then apply for production.
- [ ] App content: privacy policy URL (publicly hosted `docs/privacy-policy.html`), ads declaration = yes, Data safety form (device identifiers via AdMob; name stored locally only), target audience 13+ (not designed for children, avoids Families policy), content rating questionnaire, news/health/government declarations (choose the health apps declaration honestly: this is not a medical app).
- [ ] Store listing: title, short and full description (TR and EN), 512 icon, 1024x500 feature graphic, 8 phone screenshots per language; optional 7/10-inch tablet shots (iOS `supportsTablet: true`).
- [ ] Category: Health & Fitness (or Productivity). Tags: wellness, health tips.
- [ ] Build: `eas build -p android --profile production` (AAB), upload with `eas submit` or manually; enable Play App Signing.
- [ ] Pre-launch report: fix crashes/accessibility flags.
- [ ] Countries: start with Turkey plus English-speaking markets; set pricing Free.

## C. App Store Connect

- [ ] Apple Developer Program (99 USD/year), App ID matching `bundleIdentifier`.
- [ ] Privacy nutrition labels: identifiers / usage data linked to AdMob (advertising); tracking declaration. If using AdMob personalised ads you must implement App Tracking Transparency (`NSUserTrackingUsageDescription` plus the ATT prompt) and Google's UMP consent for EEA/UK; currently neither exists in the code. Without them use non-personalised ads only or expect review issues.
- [ ] Screenshots for 6.9" and 6.5" iPhone (and iPad 13" because `supportsTablet: true`, or set it to false to skip iPad screenshots).
- [ ] Support URL, marketing URL (optional), privacy policy URL, age rating, review notes (no login required).
- [ ] Health disclaimer: keep "not a medical device" wording.

## D. Legal and policy

- [ ] Privacy policy matches the app: in-app text says name/preferences stay on device, ads by AdMob. Ensure `docs/privacy-policy.html` states the same, lists a contact email, and covers TR (KVKK) and EU (GDPR) basics.
- [ ] Add UMP (Google User Messaging Platform) consent for EEA/UK users when serving ads.
- [ ] Do not make medical claims in listing text (audited: the drafts use "wellness reminder" language).

## E. Quality gates before submission

- [ ] Run on a real Android and iOS device (production/preview build, not Expo Go): reminders fire with app killed, snooze/done actions work, quiet hours respected, vibration levels differ, eye-rest 20-min reminder works.
- [ ] Both languages checked on every screen; text not clipped on small phones and with large font sizes.
- [ ] Dark theme contrast; TalkBack/VoiceOver labels (slider and custom input labels exist).
- [ ] App icon and adaptive icon render correctly; splash screen colour `#E6F4FE` matches icon background.
- [ ] Crash reporting (optional: Sentry or Play Console vitals).
- [ ] Bump `version` for each submitted update; keep versionCode monotonic.

## F. After publish (same day)

- [ ] Replace `APP_STORE_URL`, ship 1.0.1.
- [ ] Add store badges/links to README and landing page.
- [ ] Start the growth plan in `05-growth-plan-30-days.md`.
