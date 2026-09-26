// Çalıştır (saat dilimi başına): TZ=Europe/Istanbul node scripts/daykey.test.mjs
// Ya da hepsi: node scripts/daykey.test.mjs --all
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ZONES = ['Europe/Istanbul', 'Pacific/Auckland', 'America/Los_Angeles', 'UTC'];
if (process.argv.includes('--all')) {
  let fail = false;
  for (const tz of ZONES) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      env: { ...process.env, TZ: tz },
      encoding: 'utf8',
    });
    process.stdout.write(r.stdout + r.stderr);
    if (r.status !== 0) fail = true;
  }
  process.exit(fail ? 1 : 0);
}

const { localDayKey, addDays, computeStreak, trimHistory, sanitizeStats } = await import('../lib/dayStreak.js');
const { planStreakAlertDates, buildScheduleDates } = await import('../lib/schedule.js');
const { DEFAULT_CHALLENGE } = await import('../lib/challenge.js');

// Yerel bileşenlerden kurulan tarih, her saat diliminde aynı yerel anahtarı vermeli
// (eski toISOString() Istanbul/Auckland'da 00:30'da, LA'da 17:00+'da yanlıştı).
for (const [h, mi] of [[0, 30], [1, 0], [12, 0], [17, 30], [23, 30]]) {
  assert.strictEqual(localDayKey(new Date(2026, 8, 26, h, mi)), '2026-09-26', `${h}:${mi}`);
}

// Simülasyon: art arda 5 gün, her gün gece yarısından hemen sonra (00:15) seans.
function simulate(hour, minute, days = 5) {
  let s = { streak: 0, lastCompletedDate: null };
  for (let i = 0; i < days; i++) {
    const now = new Date(2026, 8, 20 + i, hour, minute);
    s = {
      streak: computeStreak({
        streak: s.streak,
        lastCompletedDate: s.lastCompletedDate,
        today: localDayKey(now),
        yesterday: localDayKey(addDays(now, -1)),
      }),
      lastCompletedDate: localDayKey(now),
    };
  }
  return s.streak;
}
assert.strictEqual(simulate(0, 15), 5);
assert.strictEqual(simulate(23, 45), 5);
assert.strictEqual(simulate(12, 0), 5);

// Aynı gün iki seans: seri artmaz.
{
  const now = new Date(2026, 8, 26, 0, 20);
  const k = localDayKey(now);
  assert.strictEqual(computeStreak({ streak: 4, lastCompletedDate: k, today: k, yesterday: localDayKey(addDays(now, -1)) }), 4);
  // Bir gün atlandı -> 1.
  assert.strictEqual(computeStreak({ streak: 4, lastCompletedDate: '2026-09-24', today: k, yesterday: '2026-09-25' }), 1);
}

// Göç: eski UTC anahtarı. Yerel 26 Eylül 20:00'de (LA'da UTC 27 Eylül 03:00) kaydedilmiş
// seans "2026-09-27" olarak durur; yerel bugün 26 iken seri sıfırlanmamalı/artmamalı.
{
  const now = new Date(2026, 8, 26, 21, 0);
  const oldUtcKey = new Date(2026, 8, 26, 20, 0).toISOString().slice(0, 10);
  const r = computeStreak({ streak: 6, lastCompletedDate: oldUtcKey, today: localDayKey(now), yesterday: localDayKey(addDays(now, -1)) });
  assert.ok(r >= 6, `göç: seri korunmalı, ${r}`);
  assert.ok(r <= 7);
  // Ertesi gün (yerel 27) gerçek bir devam: eski anahtar ne olursa olsun seri kopmamalı.
  const next = new Date(2026, 8, 27, 9, 0);
  const r2 = computeStreak({ streak: 6, lastCompletedDate: localDayKey(now), today: localDayKey(next), yesterday: localDayKey(addDays(next, -1)) });
  assert.strictEqual(r2, 7);
}

// DST: takvim günü aritmetiği (24 saatlik kayma değil).
assert.strictEqual(localDayKey(addDays(new Date(2026, 2, 9, 0, 30), -1)), '2026-03-08');
assert.strictEqual(localDayKey(addDays(new Date(2026, 10, 2, 0, 30), -1)), '2026-11-01');
assert.strictEqual(localDayKey(addDays(new Date(2026, 3, 6, 0, 30), -1)), '2026-04-05');

// trimHistory: eski/bozuk anahtarlar düşer, eski UTC anahtarları (biçim aynı) korunur.
{
  const now = new Date(2026, 8, 26, 0, 30);
  const h = trimHistory({ '2026-09-26': 2, '2026-09-12': 1, '2026-09-11': 5, 'garbage': 3, '2026-09-25': -1 }, 14, now);
  assert.deepStrictEqual(h, { '2026-09-26': 2, '2026-09-12': 1 });
}

// Bozuk depolanmış veri.
{
  const D = { totalSessions: 0, streak: 0, lastCompletedDate: null, history: {}, byType: { breathing: 0, movements: 0, exercises: 0 }, celebratedMilestones: [], achievements: {}, challenge: DEFAULT_CHALLENGE };
  for (const bad of [null, 5, 'x', [], { history: [1, 2], byType: 'a', challenge: { doneDates: 'x', active: 1 }, celebratedMilestones: 'x', achievements: [], streak: 'NaN', lastCompletedDate: 12 }]) {
    const s = sanitizeStats(bad, D);
    assert.ok(Array.isArray(s.challenge.doneDates) && Array.isArray(s.celebratedMilestones));
    assert.strictEqual(s.streak, 0);
    assert.strictEqual(s.lastCompletedDate, null);
    assert.deepStrictEqual(s.byType, D.byType);
  }
  const ok = sanitizeStats({ totalSessions: 9, streak: 3, lastCompletedDate: '2026-09-25', history: { '2026-09-25': 2 }, byType: { breathing: 4 } }, D);
  assert.strictEqual(ok.totalSessions, 9);
  assert.strictEqual(ok.byType.breathing, 4);
  assert.strictEqual(ok.history['2026-09-25'], 2);
}

// Seri bildirimi: gece yarısı civarı.
{
  const sa = { enabled: true, minutes: 19 * 60 + 30 };
  const now = new Date(2026, 8, 26, 0, 20).getTime();
  const r = planStreakAlertDates({ stats: { streak: 3, lastCompletedDate: '2026-09-25' }, streakAlert: sa, now });
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual([r[0].getDate(), r[0].getHours()], [26, 19]);
  const late = new Date(2026, 8, 26, 23, 50).getTime();
  const r2 = planStreakAlertDates({ stats: { streak: 3, lastCompletedDate: '2026-09-26' }, streakAlert: sa, now: late });
  assert.deepStrictEqual([r2.length, r2[0].getDate()], [1, 27]);
  // Göç: ileri görünen eski anahtar bugün sayılır -> yarına planlanır.
  const r3 = planStreakAlertDates({ stats: { streak: 3, lastCompletedDate: '2026-09-27' }, streakAlert: sa, now: late });
  assert.deepStrictEqual([r3.length, r3[0].getDate()], [1, 27]);
}

// Geçersiz aralık sonsuz döngü / geçmiş tarih üretmemeli.
{
  const ws = { enabled: true, days: [], start: 9, end: 18 };
  for (const iv of [0, -5, NaN, undefined]) {
    assert.deepStrictEqual(buildScheduleDates({ intervalMinutes: iv, quietHoursEnabled: false, workSchedule: ws }), []);
  }
}

console.log(`daykey tests passed (TZ=${process.env.TZ || 'system'})`);
