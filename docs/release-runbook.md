# Release Runbook

Expo SDK 57 is pinned (see AGENTS.md). Do not bump SDK packages as part of a release.
`eas.json`: `appVersionSource: "local"`, so versions live in `app.json`.

## One-time setup

```
npm i -g eas-cli
eas login
eas init            # links the project, writes extra.eas.projectId into app.json
```
The postinstall (`patch-package`) patches expo-notifications; it runs on EAS Build via `npm ci`, so make sure `patches/` is committed.

## Profiles

| Profile | Use | Output |
|---|---|---|
| `development` | dev client, internal | APK |
| `preview` | release-like test build, internal | APK (install directly, real notifications, ads via real IDs) |
| `production` | store | AAB, `autoIncrement: true` |

```
eas build -p android --profile development
eas build -p android --profile preview
eas build -p android --profile production
eas submit -p android --profile production --latest   # needs service account key, see below
```

## Version bumping

- `version` (user-visible, `app.json` `expo.version`): bump manually per release (semver): 1.0.0 -> 1.0.1.
- `android.versionCode` / `ios.buildNumber`: with `appVersionSource: local` and `autoIncrement: true`, `eas build --profile production` increments and writes them into `app.json` locally. Commit that change after each production build. versionCode must strictly increase for every upload to Play, including closed-test uploads.
- Tag releases: `git tag v1.0.1`.

## Play submission

- First upload of a brand-new app must be done manually in Play Console (Closed testing > Create release > upload AAB). `eas submit` works afterwards.
- Service account: Google Cloud service account with Play Console "Release manager" rights; save JSON as `google-play-service-account.json` (git-ignored, never commit). `eas.json` submit defaults to `track: internal`, `releaseStatus: draft`.
- See `docs/PLAY_STORE_SUBMISSION.md` for the console steps.

## Preview build: notification and ads test checklist (real Android device, NOT Expo Go)

Install the preview APK (QR/link from EAS), then:

- [ ] First launch: notification permission prompt appears (Android 13+), granting works, denying is handled without crash.
- [ ] Reminder fires at the set interval with the app in foreground, background and swiped away (killed).
- [ ] Reminder fires after device reboot.
- [ ] Snooze and Done notification actions work; counts update in the app.
- [ ] Quiet hours suppress reminders; work schedule respected.
- [ ] Vibration levels differ; sound on/off honoured; eye-rest 20-minute reminder works.
- [ ] Notification title reads "Duruş Hatırlatıcı" in TR and the English name in EN.
- [ ] Battery optimisation ON (default): reminders still arrive within a reasonable delay.
- [ ] Airplane mode: reminders still fire (local); app opens without ads and does not hang/crash.
- [ ] Ads: banner shows (real unit; do not tap your own ads). In a `development`/`__DEV__` build test IDs are used instead.
- [ ] Consent: to simulate EEA, temporarily pass `debugGeography: AdsConsentDebugGeography.EEA` and `testDeviceIdentifiers: [...]` to `AdsConsent.gatherConsent()` in `lib/consent.js` in a throwaway dev-client build; verify the form appears, and that declining prevents ad initialisation. Revert before release. (Requires a published GDPR message in AdMob.)
- [ ] Kill/relaunch several times: no "loading" hang on splash.
- [ ] Both languages and dark theme on every screen.

## Known limitations

- Expo Go: `adsAvailable()` is false; consent and ads are no-ops there.
- `AdBanner` (components/AdBanner.js) is mounted independently of `initializeAds()`; make it wait for `canRequestAds()` from `lib/consent.js` before rendering a banner so that no ad request precedes EEA consent.
- If R8/minify is ever enabled for release builds, add the UMP keep rule: `-keep class com.google.android.gms.internal.consent_sdk.** { *; }` (needs `expo-build-properties`, `extraProguardRules`). Not needed with Expo's default (minify off).
- iOS: AdMob iOS app ID in `app.json` is still Google's TEST ID; replace before any iOS release, and configure the ATT + GDPR messages in AdMob.
