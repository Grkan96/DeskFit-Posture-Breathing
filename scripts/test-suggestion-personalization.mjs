// Çalıştır: node scripts/test-suggestion-personalization.mjs
// Ağrı bölgesine göre kişiselleştirilmiş öneri mantığını doğrular:
// - Geçerli painArea varken doğru hareket/egzersiz eşleşiyor mu
// - painArea yokken eski "en az yapılan tür" davranışı korunuyor mu
// - Geçersiz/eksik/bozuk profil verisiyle çökmüyor mu
import assert from 'node:assert';
import {
  MOVEMENT_META,
  EXERCISE_META,
  PAIN_AREA_SUGGESTIONS,
  pickSuggestion,
} from '../lib/sessionContent.js';
import { PAIN_AREAS, normalizeProfile } from '../lib/onboardingProfile.js';
import { en } from '../lib/locales/en.js';
import { tr } from '../lib/locales/tr.js';

const ALL_META = [...MOVEMENT_META, ...EXERCISE_META];
const d = new Date(2026, 5, 10);

// 1) Her ağrı bölgesi için bir eşleşme tanımlı ve o id gerçekten var (movements/exercises).
for (const area of PAIN_AREAS) {
  const match = PAIN_AREA_SUGGESTIONS[area];
  assert.ok(match, `PAIN_AREA_SUGGESTIONS eksik: ${area}`);
  const meta = ALL_META.find((m) => m.id === match.id);
  assert.ok(meta, `${area} için eşleşen meta bulunamadı: ${match.id}`);
  const list = match.type === 'movements' ? MOVEMENT_META : EXERCISE_META;
  assert.ok(list.find((m) => m.id === match.id), `${area} eşleşmesi ${match.type} listesinde değil`);
}
// PAIN_AREA_SUGGESTIONS'ta PAIN_AREAS dışında fazladan anahtar yok.
for (const key of Object.keys(PAIN_AREA_SUGGESTIONS)) {
  assert.ok(PAIN_AREAS.includes(key), `PAIN_AREA_SUGGESTIONS'ta bilinmeyen bölge: ${key}`);
}

// 2) painArea varken: doğru tür + matchedId + personalized:true, byType'tan bağımsız.
for (const area of PAIN_AREAS) {
  const expected = PAIN_AREA_SUGGESTIONS[area];
  const s1 = pickSuggestion({ movements: 0, exercises: 0, breathing: 0 }, d, 3, area);
  const s2 = pickSuggestion({ movements: 99, exercises: 99, breathing: 0 }, d, 3, area);
  for (const s of [s1, s2]) {
    assert.equal(s.personalized, true, `${area}: personalized true olmalı`);
    assert.equal(s.type, expected.type, `${area}: type uyuşmuyor`);
    assert.equal(s.matchedId, expected.id, `${area}: matchedId uyuşmuyor`);
    assert.ok(Number.isInteger(s.techniqueIndex));
  }
}

// 3) örnekte verilen özel eşleşmeler: boyun -> neck-stretch, bel -> seated-figure-four.
assert.equal(pickSuggestion(null, d, 3, 'neck').matchedId, 'neck-stretch');
assert.equal(pickSuggestion(null, d, 3, 'lowerBack').matchedId, 'seated-figure-four');

// 4) painArea yokken: eski davranış korunuyor (personalized:false, matchedId:null,
//    en az yapılan tür mantığı aynen çalışıyor).
assert.deepEqual(
  { type: pickSuggestion({ movements: 5, exercises: 0, breathing: 3 }, d).type,
    personalized: pickSuggestion({ movements: 5, exercises: 0, breathing: 3 }, d).personalized,
    matchedId: pickSuggestion({ movements: 5, exercises: 0, breathing: 3 }, d).matchedId },
  { type: 'exercises', personalized: false, matchedId: null }
);
assert.equal(pickSuggestion({ movements: 5, exercises: 4, breathing: 1 }, d).type, 'breathing');
assert.equal(pickSuggestion({ movements: 5, exercises: 4, breathing: 1 }, d, 3, null).personalized, false);
assert.equal(pickSuggestion({ movements: 5, exercises: 4, breathing: 1 }, d, 3, undefined).personalized, false);

// 5) Geçersiz/bozuk painArea değerleri sessizce yok sayılıp eski mantığa düşer, çökmez.
for (const bad of ['invalid-area', '', 0, 123, {}, [], 'NECK', 'neck ']) {
  assert.doesNotThrow(() => pickSuggestion({ movements: 1, exercises: 2, breathing: 3 }, d, 3, bad));
  const s = pickSuggestion({ movements: 1, exercises: 2, breathing: 3 }, d, 3, bad);
  assert.equal(s.personalized, false, `bozuk painArea (${JSON.stringify(bad)}) kişiselleştirme tetiklememeli`);
  assert.equal(s.matchedId, null);
}

// 6) Eksik/bozuk byType + geçerli painArea: çökmeden kişiselleştirilmiş sonucu döner
//    (byType, painArea eşleşince zaten kullanılmıyor).
for (const badByType of [null, undefined, {}, 'bozuk', 42, []]) {
  assert.doesNotThrow(() => pickSuggestion(badByType, d, 3, 'neck'));
  assert.equal(pickSuggestion(badByType, d, 3, 'neck').matchedId, 'neck-stretch');
}

// 7) normalizeProfile ile gelen (bozuk depodan okunmuş) bir profilin painArea'sı
//    doğrudan pickSuggestion'a çökmeden verilebilir.
const profileFromBrokenStorage = normalizeProfile({ painArea: 'shoulder', deskHours: 'garbage' });
assert.doesNotThrow(() => pickSuggestion(null, d, 3, profileFromBrokenStorage.painArea));
assert.equal(pickSuggestion(null, d, 3, profileFromBrokenStorage.painArea).matchedId, 'shoulder-shrug');
const profileFromGarbage = normalizeProfile('tamamen bozuk veri');
assert.equal(profileFromGarbage.painArea, null);
assert.doesNotThrow(() => pickSuggestion(null, d, 3, profileFromGarbage.painArea));
assert.equal(pickSuggestion(null, d, 3, profileFromGarbage.painArea).personalized, false);

// 8) Yeni locale anahtarları en/tr'de var, {name}/{pain} placeholder'ları eşleşiyor,
//    ve her eşleşen hareketin başlığı (movements/exercises.items.<id>.title) mevcut.
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
for (const [name, dict] of [['en', en], ['tr', tr]]) {
  assert.ok(dict.meditation.suggestionPersonalizedBody, `${name}: suggestionPersonalizedBody eksik`);
  assert.equal(
    placeholders(dict.meditation.suggestionPersonalizedBody),
    '{name},{pain}',
    `${name}: suggestionPersonalizedBody placeholder'ları {name}/{pain} olmalı`
  );
  for (const area of PAIN_AREAS) {
    assert.ok(dict.onboardingFlow.questions.pain[area], `${name}: pain label eksik ${area}`);
    const match = PAIN_AREA_SUGGESTIONS[area];
    const items = match.type === 'movements' ? dict.movements.items : dict.exercises.items;
    assert.ok(items[match.id]?.title, `${name}: ${match.type}.items.${match.id}.title eksik`);
  }
}
assert.equal(
  placeholders(en.meditation.suggestionPersonalizedBody),
  placeholders(tr.meditation.suggestionPersonalizedBody)
);

console.log('suggestion-personalization OK');
