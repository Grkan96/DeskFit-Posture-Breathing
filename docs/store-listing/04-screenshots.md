# Screenshots (8) and Graphics

Format: portrait, Play 1080x1920 min (or 9:16 up to 1080x2400), iOS 6.9" (1320x2868) and 6.5" (1284x2778) sets. Put the caption above a device frame, large bold text (max 6 words for the title), consistent background per screen. Use one colour per screen family (blue for reminders, green for breathing, orange for stats). Capture in both languages (TR set, EN set). Use realistic data (name "Alex"/"Ayşe", streak 12, ~40 sessions), light theme for 6 shots and dark theme for 1-2.

| # | Screen to capture | EN title | EN subtitle | TR title | TR subtitle |
|---|---|---|---|---|---|
| 1 | HomeScreen, active state ("Active, every 30 minutes"), dial visible, reminder count > 0 | Sit Up Straight. Every Time. | Gentle posture reminders on your schedule | Dik Otur. Her Seferinde. | Senin belirlediğin aralıklarla nazik hatırlatmalar |
| 2 | HomeScreen, interval slider + presets + custom minutes | Your Interval, Your Rules | Every 15, 30, 60 minutes or your own | Aralık Senin Seçimin | 15, 30, 60 dakika ya da kendi süren |
| 3 | Notification (system shade) with posture message and Snooze / Done buttons (mock or real device capture) | Reminders That Tell You What To Do | Snooze or mark done right from the notification | Ne Yapacağını Söyleyen Bildirimler | Bildirimden ertele ya da tamamla |
| 4 | Settings: Eye rest toggle ON with "20-20-20 rule" hint | Protect Your Eyes: 20-20-20 | Look away every 20 minutes, 20 seconds | Gözlerini Koru: 20-20-20 | Her 20 dakikada 20 saniye uzağa bak |
| 5 | MeditationScreen: three category cards (Movements, Exercises, Breathing) + streak header | Stretch, Strengthen, Breathe | Short sessions that fit between meetings | Esne, Güçlen, Nefes Al | Toplantı arasına sığan kısa seanslar |
| 6 | MovementsScreen or StepSession in progress (e.g. Neck Stretch step with instruction) | 5 Desk Stretches in 3 Minutes | No equipment, no changing clothes | 3 Dakikada 5 Masa Hareketi | Ekipman yok, kıyafet değiştirmek yok |
| 7 | BreathingScreen mid-session, animated circle, "Breathe In", cycle counter (dark theme) | Guided Breathing, 3 Techniques | 4-7-8, box and coherent breathing | Rehberli Nefes, 3 Teknik | 4-7-8, kutu ve uyumlu nefes |
| 8 | StatsScreen: streak, total sessions, 7-day chart, by type, share button | Build a Streak, Keep It Going | Track progress and hit 7, 30, 100 days | Seri Yap, Devam Ettir | İlerlemeni izle, 7, 30, 100 güne ulaş |

Order rationale: shots 1-3 sell the core promise (first 3 are visible without scrolling in search results), 4 covers the eye keyword, 5-7 show the content depth, 8 closes with retention.

Optional: a 15-20s preview video (Play promo video is a YouTube link; App Store preview up to 30s): start reminder, notification arrives, 10s stretch, streak +1.

# Icon and Feature Graphic

## Icon (512x512 Play, 1024x1024 iOS)

Current icon: `assets/icon.png` and adaptive layers with backgroundColor `#E6F4FE` (light blue). Recommendations:

- One simple, recognisable shape: a side-view seated/standing spine silhouette or a straight vertical line above a small arc (spine + check mark). Avoid text.
- Strong contrast on both light and dark launchers: deep teal/blue (#0E7C86 or app primary) background with white glyph beats light-blue on white grid backgrounds.
- Keep the glyph inside the adaptive-icon safe zone (centre 66%); the monochrome layer must be a clean single-colour shape (Android 13 themed icons).
- Test at 48px: still readable? If not, simplify.
- Avoid: stock yoga/lotus (crowded with meditation apps), red "bad posture" imagery, tiny eyes.
- A/B test 2 icon variants with Play Store listing experiments after ~1000 installs.

## Feature graphic (Play, 1024x500)

- Left: logo + headline "Posture Reminder & Eye Break" (TR variant: "Duruş Hatırlatıcı & Göz Molası"), subline "Stretch. Breathe. Rest your eyes."
- Right: phone mock (Home screen) tilted slightly, floating notification card "Sit up straight 🪑" overlapping it.
- Same colour system as the icon; text must stay in the centre 70% (edges crop on some surfaces). No badges/prices/"Download" text (Play policy).
- Make a TR version for the TR listing.

## Tooling

Figma or Canva templates; capture real screenshots with Android Studio emulator (Pixel 8) and iOS simulator; frame with Previewed / AppMockUp / Figma frames.
