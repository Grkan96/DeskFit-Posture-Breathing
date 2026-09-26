// Çalıştır: node scripts/test-referral.mjs
import assert from 'node:assert';
import { buildShareUrl, nextShareState, shareProgress, buildWeekBar, PLAY_STORE_URL } from '../lib/referral.js';
import { shouldAskReview } from '../lib/reviewRules.js';
import { en } from '../lib/locales/en.js';
import { tr } from '../lib/locales/tr.js';

assert(PLAY_STORE_URL.endsWith('id=com.gurkanuslu.durus'));
assert(buildShareUrl().endsWith('&referrer=utm_source%3Dshare%26utm_medium%3Dapp'));
assert(buildShareUrl('badge').includes('%26utm_campaign%3Dbadge'));

let s = { count: 0 };
const flags = [];
for (let i = 0; i < 6; i++) { s = nextShareState(s); flags.push(s.rewarded); }
assert.deepEqual(flags, [false, false, true, false, false, true]);
assert.equal(s.rewards, 2);
assert.equal(shareProgress(4).untilNext, 2);
assert.equal(buildWeekBar([0, 1, 2, 0, 0, 0, 3]), '⬜🟩🟩⬜⬜⬜🟩');

const DAY = 86400000;
const st = { firstUse: 0 };
const ok = { totalSessions: 5, positive: true, state: st, now: 3 * DAY };
assert(shouldAskReview(ok));
assert(!shouldAskReview({ ...ok, positive: false }));
assert(!shouldAskReview({ ...ok, totalSessions: 4 }));
assert(!shouldAskReview({ ...ok, now: 3 * DAY - 1 }));
assert(!shouldAskReview({ ...ok, state: { firstUse: 0, prompted: true } }));
assert(!shouldAskReview({ ...ok, state: {} }));

for (const d of [en, tr]) {
  for (const k of ['rewardTitle', 'rewardBody', 'weekTitle', 'weekSummary', 'weekMessage', 'weekShare', 'progress']) assert(d.referral[k], k);
  for (const k of ['askTitle', 'askBody', 'yes', 'no', 'later', 'mailSubject']) assert(d.review[k], k);
}
console.log('referral/review tests OK');
