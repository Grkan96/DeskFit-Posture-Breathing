// Çalıştır: node scripts/test-session-content.mjs
import assert from 'node:assert';
import { MOVEMENT_META, EXERCISE_META, QUICK_BREAK_MOVEMENT_IDS, QUICK_BREAK_TOTAL_SECONDS, pickSuggestion } from '../lib/sessionContent.js';
import { QUICK_BREATH } from '../lib/breathingTechniques.js';
import { en } from '../lib/locales/en.js';
import { tr } from '../lib/locales/tr.js';

assert.ok(MOVEMENT_META.length >= 10 && EXERCISE_META.length >= 7);
for (const [name, d] of [['en', en], ['tr', tr]]) {
  for (const m of MOVEMENT_META) assert.ok(d.movements.items[m.id]?.title && d.movements.items[m.id]?.instruction, `${name} movement ${m.id}`);
  for (const e of EXERCISE_META) assert.ok(d.exercises.items[e.id]?.title && d.exercises.items[e.id]?.instruction, `${name} exercise ${e.id}`);
  for (const k of ['quickBreakTitle', 'quickBreakDescription', 'suggestionTitle', 'suggestionBody']) assert.ok(d.meditation[k], `${name} ${k}`);
  assert.ok(d.breathing.techniques.quick.title);
}
assert.equal(new Set(MOVEMENT_META.map((m) => m.id)).size, MOVEMENT_META.length);
// Hızlı mola tam 60 sn
const breath = QUICK_BREATH.phases.reduce((s, p) => s + p.seconds, 0) * QUICK_BREATH.cycles;
const moves = QUICK_BREAK_MOVEMENT_IDS.reduce((s, id) => s + MOVEMENT_META.find((m) => m.id === id).seconds, 0);
assert.equal(breath + moves, QUICK_BREAK_TOTAL_SECONDS);
// Öneri: en az yapılan tür
const d = new Date(2026, 5, 10);
assert.equal(pickSuggestion({ movements: 5, exercises: 0, breathing: 3 }, d).type, 'exercises');
assert.equal(pickSuggestion({ movements: 5, exercises: 4, breathing: 1 }, d).type, 'breathing');
// Hiç veri / eşitlik: güne göre döner, hepsi görülür
const seen = new Set();
for (let i = 0; i < 6; i++) seen.add(pickSuggestion(null, new Date(2026, 0, 1 + i)).type);
assert.equal(seen.size, 3);
const ti = new Set();
for (let i = 0; i < 6; i++) ti.add(pickSuggestion({}, new Date(2026, 0, 1 + i), 3).techniqueIndex);
assert.equal(ti.size, 3);
console.log('session-content OK');
