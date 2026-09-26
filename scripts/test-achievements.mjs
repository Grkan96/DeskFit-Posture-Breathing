// Çalıştır: node scripts/test-achievements.mjs
import assert from 'node:assert';
import { ACHIEVEMENTS, evaluateAchievements } from '../lib/achievements.js';
import { startChallenge, progressChallenge, CHALLENGE_DAYS } from '../lib/challenge.js';
import { en } from '../lib/locales/en.js';
import { tr } from '../lib/locales/tr.js';

const base = { totalSessions: 1, streak: 1, byType: { breathing: 1, movements: 0, exercises: 0 }, todayCount: 1, challengeCompleted: false };
assert.deepEqual(evaluateAchievements(base, {}), ['first_session']);
assert.deepEqual(evaluateAchievements(base, { first_session: 'x' }), []);
const big = { totalSessions: 50, streak: 100, byType: { breathing: 10, movements: 5, exercises: 5 }, todayCount: 3, challengeCompleted: true };
assert.equal(evaluateAchievements(big, {}).length, ACHIEVEMENTS.length);

let c = startChallenge('2026-01-01');
let done;
for (let i = 1; i <= 7; i++) {
  const r = progressChallenge(c, `2026-01-0${i}`);
  c = r.challenge;
  done = r.justCompleted;
  if (i < 7) assert(!done);
}
assert(done && c.completed && !c.active && c.doneDates.length === CHALLENGE_DAYS);
assert.equal(progressChallenge(c, '2026-01-09').justCompleted, false);
// Aynı gün iki seans tek gün sayılır
assert.equal(progressChallenge(progressChallenge(startChallenge('a'), 'a').challenge, 'a').challenge.doneDates.length, 1);

const keys = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
assert.deepEqual(keys(en).sort(), keys(tr).sort(), 'en/tr keys must match');
for (const a of ACHIEVEMENTS) {
  for (const f of ['title', 'description']) assert(en.achievements.items[a.id]?.[f] && tr.achievements.items[a.id]?.[f]);
}
console.log('ALL OK:', ACHIEVEMENTS.length, 'badges,', keys(en).length, 'locale keys');
