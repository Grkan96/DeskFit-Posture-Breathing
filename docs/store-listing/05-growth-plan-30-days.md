# First 30 Days Growth Plan

Goal: 1,000 installs, 4.5+ rating with 50+ ratings, Day-7 retention above 20%, notification opt-in above 70%. Adjust after seeing real data. Budget assumption: low (0-150 USD).

## Pre-launch (T-14 to T-1)

- Google Play closed test requirement: personal developer accounts created after Nov 2023 need a closed test with 12+ testers for 14 days before production access. Start recruiting testers (friends, coworkers, Reddit/Discord) now.
- Finish store listings (see 01-04), privacy policy URL (docs/privacy-policy.html hosted publicly, e.g. GitHub Pages), Data safety form, content rating.
- Set up landing page or a simple link tree (optional) and a short tracked link per channel.

## Ratings and reviews

The app already calls the native review prompt after 5 completed sessions (`lib/review.js`, once per install). Improvements:
- Never ask on first launch or right after a reminder error; keep prompting after a positive moment (a completed session or a milestone).
- Consider also prompting on a streak milestone (7 days) because that is the happiest moment. Do this as a separate task; do not change code from this plan.
- Add a "Send feedback" email in Settings so unhappy users complain privately.
- Reply to every review in the first 30 days (Play Console supports replies; replies often raise ratings).
- Ask friends/testers for honest ratings only after real use; never incentivise or buy reviews (policy).

## Week-by-week

**Days 1-3 (soft launch)**
- Publish to TR first (the app has a native TR audience and less competition). Post to personal networks, LinkedIn, X.
- Ask early users for feedback; fix top 3 issues fast, ship 1.0.1.
- Reddit: r/Turkey (sparingly), r/ergonomics, r/PostureTips, r/backpain (read rules; share value first, disclose you are the maker, no spam), r/androidapps (Saturday self-promo threads), r/SideProject, r/indiehackers.

**Days 4-10 (content and community)**
- Product Hunt: launch on a Tuesday-Thursday, tagline "Posture and eye-break reminders with desk stretches and breathing". Prepare gallery from the screenshots, 60-second demo, maker comment with the story. Line up 10-20 supporters to comment (genuine users, not vote rings).
- Hacker News "Show HN" only if there is a technical angle (offline, no account, Expo).
- Post in developer/designer/gamer communities where long sitting is common (Discord, Turkish tech Slack/Telegram groups, Ekşi/Webrazzi/Onedio-style outlets by pitch).

**Days 11-20 (short video)**
TikTok / Instagram Reels / YouTube Shorts ideas (15-30s, faceless is fine, screen recording + text overlay):
1. "POV: your posture at hour 6 of work" then the reminder pops up.
2. "The 20-20-20 rule in 20 seconds."
3. "5 desk stretches you can do without leaving your chair."
4. "I got reminded to sit up straight for 7 days, here's my streak."
5. "Box breathing at your desk (try it for 1 minute)."
6. "Office workers: your neck when you look at your phone" (tech-neck awareness) with app CTA in bio.
7. "Rate my posture" duets/stitches with ergonomic tips.
8. Turkish variants: "Ofis çalışanlarının 5 dakikalık kurtuluş rutini", "Boyun ağrısı çekenler bunu deneyin".
Post 1 per day for 2 weeks, reuse across the three platforms, same CTA "link in bio". Track which hook gets the most watch-time and double down.
- Micro-influencers: offer the app to 10-20 ergonomics/physio/productivity/study-with-me creators (free, no scripts, disclose per platform rules). Physiotherapists and study-with-me YouTubers fit best.

**Days 21-30 (paid and iteration)**
- Apple Search Ads: Search Results campaign, exact match on own brand + "stand up reminder", "posture", "eye break"; start 5-10 USD/day for 7 days, cap CPA. Use Search Match in a separate discovery campaign to harvest terms, then add winners as exact match and negatives.
- Google App campaigns (UAC): only after organic conversion is proven (store listing conversion above ~25% on Play). Start 5-10 USD/day, target TR first (low CPI) then EN long-tail markets. Optimise for installs, later for a custom event (session completed).
- Meta/TikTok ads: boost the best-performing organic video, 3-5 USD/day.
- If ads revenue matters: compare ARPU (AdMob banner) vs CPI; with banner-only ads, paid UA rarely pays back, so prefer organic and ASA on high-intent terms.

## Weekly ASO loop

1. Check Play Console: acquisition, store listing conversion, search terms, crashes/ANR (target < 1%).
2. Update short description/keyword field with terms that actually bring impressions.
3. Run a listing experiment on icon and screenshot 1.
4. Ship a small update every 2 weeks (freshness helps ranking); mention what is new.

## Metrics to track

Impressions, page views, conversion rate, installs, D1/D7/D30 retention, notification permission rate, reminders started, sessions completed, review count/average, uninstall reasons. Use Play Console and App Store Connect (both free).

## Retention ideas

Streak milestone celebrations already exist; consider (as future work) weekly summary notification, home-screen widget, more breathing techniques, "Coming soon" categories currently gated in the Meditation tab.
