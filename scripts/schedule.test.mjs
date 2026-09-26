// Çalıştır: node scripts/schedule.test.mjs
import assert from 'node:assert';
import { buildScheduleDates, isWorkingTime, planStreakAlertDates, dayKey } from '../lib/schedule.js';

const ws = { enabled: true, days: [1, 2, 3, 4, 5], start: 9, end: 18 };
const mon10 = new Date(2026, 8, 28, 10, 0);
const sat10 = new Date(2026, 8, 26, 10, 0);
assert.ok(isWorkingTime(mon10, ws));
assert.ok(!isWorkingTime(sat10, ws));
assert.ok(!isWorkingTime(new Date(2026, 8, 28, 18, 0), ws));
assert.ok(!isWorkingTime(new Date(2026, 8, 28, 8, 59), ws));
assert.ok(isWorkingTime(sat10, { ...ws, enabled: false }));
assert.ok(isWorkingTime(new Date(2026, 8, 28, 23, 0), { ...ws, start: 22, end: 6 }));
assert.ok(!isWorkingTime(new Date(2026, 8, 28, 12, 0), { ...ws, start: 22, end: 6 }));

// Cuma 16:00'dan 48 saat: sadece Cuma 16-18 arası, hafta sonu yok.
const fri = new Date(2026, 8, 25, 16, 0).getTime();
const ds = buildScheduleDates({ intervalMinutes: 30, quietHoursEnabled: false, workSchedule: ws, now: fri });
assert.ok(ds.length > 0);
assert.ok(ds.every((d) => d.getDay() === 5 && d.getHours() >= 16 && d.getHours() < 18));
assert.strictEqual(buildScheduleDates({ intervalMinutes: 30, quietHoursEnabled: false, now: fri }).length, 96);

const now = new Date(2026, 8, 26, 12, 0).getTime();
const today = dayKey(new Date(now));
const yest = dayKey(new Date(now - 864e5));
const sa = { enabled: true, minutes: 19 * 60 + 30 };
let r = planStreakAlertDates({ stats: { streak: 3, lastCompletedDate: yest }, streakAlert: sa, now });
assert.strictEqual(r.length, 1);
assert.deepStrictEqual([r[0].getDate(), r[0].getHours(), r[0].getMinutes()], [26, 19, 30]);
r = planStreakAlertDates({ stats: { streak: 3, lastCompletedDate: today }, streakAlert: sa, now });
assert.deepStrictEqual([r.length, r[0].getDate()], [1, 27]);
const plan = (stats, streakAlert = sa, n = now) => planStreakAlertDates({ stats, streakAlert, now: n }).length;
assert.strictEqual(plan({ streak: 1, lastCompletedDate: yest }), 0);
assert.strictEqual(plan({ streak: 5, lastCompletedDate: '2020-01-01' }), 0);
assert.strictEqual(plan({ streak: 3, lastCompletedDate: yest }, { ...sa, enabled: false }), 0);
assert.strictEqual(plan({ streak: 3, lastCompletedDate: yest }, sa, new Date(2026, 8, 26, 20, 0).getTime()), 0);
console.log('all schedule tests passed');
