// Çalıştır: node scripts/test-onboarding-profile.mjs
import assert from 'node:assert';
import { normalizeProfile, mergeProfile, loadProfile, saveProfile, PROFILE_KEY, EMPTY_PROFILE } from '../lib/onboardingProfile.js';
import { en } from '../lib/locales/en.js';
import { tr } from '../lib/locales/tr.js';

const mem = () => { const m = {}; return { m, getItem: async (k) => m[k] ?? null, setItem: async (k, v) => { m[k] = v; } }; };

assert.deepEqual(normalizeProfile(null), EMPTY_PROFILE);
assert.equal(normalizeProfile({ deskHours: 'x', painArea: 'neck' }).deskHours, null);
assert.equal(normalizeProfile({ painArea: 'neck' }).painArea, 'neck');
assert.deepEqual(normalizeProfile([1]), EMPTY_PROFILE);
assert.equal(mergeProfile({ painArea: 'back' }, { deskHours: '8plus' }).painArea, 'back');

const s = mem();
assert.deepEqual(await loadProfile(s), EMPTY_PROFILE);
await saveProfile({ deskHours: '6-8' }, s);
const p = await saveProfile({ painArea: 'eyes' }, s);
assert.equal(p.deskHours, '6-8');
assert.equal(p.painArea, 'eyes');
assert.equal(JSON.parse(s.m[PROFILE_KEY]).painArea, 'eyes');
s.m[PROFILE_KEY] = '{bozuk';
assert.deepEqual(await loadProfile(s), EMPTY_PROFILE);

const keys = (o, pre = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, pre + k + '.') : [pre + k]));
const enK = keys(en.onboardingFlow);
const trK = keys(tr.onboardingFlow);
for (const k of enK) assert(trK.includes(k), 'tr eksik: ' + k);
for (const k of trK) assert(enK.includes(k), 'en eksik: ' + k);
console.log('onboarding-profile OK');
