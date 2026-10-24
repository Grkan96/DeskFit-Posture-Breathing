// Dinlenme günü (streak freeze) — saf mantık testleri. Çalıştır: node scripts/restday.test.mjs
// Sadece lib/dayStreak.js'i (RN/AsyncStorage bağımsız) test eder — lib/stats.js'in
// AsyncStorage sarmalayıcıları (markRestDay/unmarkRestDay/getRestDayInfo) bu saf
// fonksiyonların ince bir kabuğudur; daykey.test.mjs ile aynı yaklaşım.
import assert from 'node:assert';
import {
  localDayKey,
  addDays,
  computeStreak,
  sanitizeStats,
  weekStartKey,
  restWeekState,
  canMarkRestDay,
  bridgeStreakForRestDay,
  unbridgeStreakForRestDay,
  REST_DAYS_PER_WEEK,
} from '../lib/dayStreak.js';

assert.strictEqual(REST_DAYS_PER_WEEK, 2);

// --- weekStartKey: hafta Pazartesi'den başlar (yerel takvim) ---
{
  // 2026-09-21 Pazartesi, 2026-09-27 Pazar (aynı hafta), 2026-09-28 sonraki Pazartesi.
  assert.strictEqual(weekStartKey(new Date(2026, 8, 21, 0, 1)), '2026-09-21', 'Pazartesi kendisi');
  assert.strictEqual(weekStartKey(new Date(2026, 8, 24, 12, 0)), '2026-09-21', 'hafta ortası (Perşembe)');
  assert.strictEqual(weekStartKey(new Date(2026, 8, 27, 23, 59)), '2026-09-21', 'Pazar, hâlâ aynı hafta');
  assert.strictEqual(weekStartKey(new Date(2026, 8, 28, 0, 0)), '2026-09-28', 'yeni hafta Pazartesi');
}

// --- restWeekState: haftalık sıfırlama, hak düşürme ---
{
  // Aynı hafta içinde: sayaç korunur.
  const sameWeek = restWeekState(
    { restDaysUsedThisWeek: 1, restDaysWeekStart: '2026-09-21' },
    new Date(2026, 8, 24)
  );
  assert.deepStrictEqual(sameWeek, { weekStart: '2026-09-21', usedThisWeek: 1, remaining: 1 });

  // Geçen haftadan kalan sayaç: yeni haftada birikmez, 0'a döner (2 hak).
  const staleWeek = restWeekState(
    { restDaysUsedThisWeek: 2, restDaysWeekStart: '2026-09-14' },
    new Date(2026, 8, 24)
  );
  assert.deepStrictEqual(staleWeek, { weekStart: '2026-09-21', usedThisWeek: 0, remaining: 2 });

  // restDaysWeekStart hiç yoksa (yeni kullanıcı / göç) da sıfırdan başlar.
  const fresh = restWeekState({ restDaysUsedThisWeek: 0, restDaysWeekStart: null }, new Date(2026, 8, 24));
  assert.deepStrictEqual(fresh, { weekStart: '2026-09-21', usedThisWeek: 0, remaining: 2 });

  // remaining negatife düşmez (bozuk/aşırı veri).
  const over = restWeekState({ restDaysUsedThisWeek: 5, restDaysWeekStart: '2026-09-21' }, new Date(2026, 8, 22));
  assert.strictEqual(over.remaining, 0);
}

// --- canMarkRestDay: geçmiş/gelecek gün kısıtı + seans/işaret/hak kontrolleri ---
{
  const today = '2026-09-24';
  const base = { history: {}, restDays: {}, restDaysUsedThisWeek: 0, restDaysWeekStart: '2026-09-21' };

  // Gelecek gün reddedilir.
  assert.strictEqual(canMarkRestDay(base, '2026-09-25', today).ok, false);
  assert.strictEqual(canMarkRestDay(base, '2026-09-25', today).reason, 'invalid-date');

  // Bugün İZİN VERİLİR (geçmiş dahil bugün).
  assert.strictEqual(canMarkRestDay(base, today, today).ok, true);

  // Geçmiş gün de izin verilir.
  assert.strictEqual(canMarkRestDay(base, '2026-09-20', today).ok, true);

  // Bozuk/geçersiz anahtar reddedilir.
  assert.strictEqual(canMarkRestDay(base, 'garbage', today).ok, false);

  // O gün seans yapılmışsa reddedilir.
  const withSession = { ...base, history: { '2026-09-23': 1 } };
  const r = canMarkRestDay(withSession, '2026-09-23', today);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'has-session');

  // Zaten işaretliyse reddedilir.
  const withMark = { ...base, restDays: { '2026-09-22': true } };
  const r2 = canMarkRestDay(withMark, '2026-09-22', today);
  assert.strictEqual(r2.ok, false);
  assert.strictEqual(r2.reason, 'already-marked');

  // Bu haftanın hakkı bitmişse reddedilir.
  const noRights = { ...base, restDaysUsedThisWeek: 2, restDaysWeekStart: '2026-09-21' };
  const r3 = canMarkRestDay(noRights, '2026-09-22', today);
  assert.strictEqual(r3.ok, false);
  assert.strictEqual(r3.reason, 'no-rights-left');

  // Ama hak biten hafta GEÇMİŞSE (yeni hafta başladıysa) tekrar 2 hak vardır.
  const staleButOk = canMarkRestDay(
    { ...base, restDaysUsedThisWeek: 2, restDaysWeekStart: '2026-09-14' },
    '2026-09-22',
    today
  );
  assert.strictEqual(staleButOk.ok, true);
  assert.strictEqual(staleButOk.week.remaining, 2);
}

// --- bridgeStreakForRestDay / unbridgeStreakForRestDay: seri koruma ---
{
  // Bitişik gün (lastCompletedDate + 1): seri AYNI kalır, lastCompletedDate ilerler.
  const bridged = bridgeStreakForRestDay({ streak: 5, lastCompletedDate: '2026-09-24' }, '2026-09-25');
  assert.deepStrictEqual(bridged, { streak: 5, lastCompletedDate: '2026-09-25' });

  // Zincirleme: art arda iki dinlenme günü (iki farklı hak) köprüyü ilerletir.
  const chained = bridgeStreakForRestDay(bridged, '2026-09-26');
  assert.deepStrictEqual(chained, { streak: 5, lastCompletedDate: '2026-09-26' });

  // Köprüden sonra gerçek bir seans normal şekilde seriyi artırır (computeStreak DOKUNULMADI).
  const nextStreak = computeStreak({
    streak: chained.streak,
    lastCompletedDate: chained.lastCompletedDate,
    today: '2026-09-27',
    yesterday: '2026-09-26',
  });
  assert.strictEqual(nextStreak, 6, 'dinlenme günü köprüsünden sonra seri normal şekilde büyümeli');

  // Bitişik OLMAYAN / ilgisiz bir geçmiş gün: seriye/lastCompletedDate'e dokunulmaz.
  const untouched = bridgeStreakForRestDay({ streak: 3, lastCompletedDate: '2026-09-10' }, '2026-09-20');
  assert.deepStrictEqual(untouched, { streak: 3, lastCompletedDate: '2026-09-10' });

  // Hiç seans yapılmamış (streak 0, lastCompletedDate null): dokunulmaz.
  const none = bridgeStreakForRestDay({ streak: 0, lastCompletedDate: null }, '2026-09-20');
  assert.deepStrictEqual(none, { streak: 0, lastCompletedDate: null });

  // Kontrast: dinlenme günü işaretlenMEmiş gerçek bir boşluk normal kuralla kırılır.
  const realGap = computeStreak({
    streak: 5,
    lastCompletedDate: '2026-09-24', // 25 atlandı, dinlenme günü de işaretlenmedi
    today: '2026-09-26',
    yesterday: '2026-09-25',
  });
  assert.strictEqual(realGap, 1, 'işaretlenmemiş boşluk seriyi normal şekilde kırmalı');

  // unbridge: en son köprülenen günü geri sarar (hak geri verilince).
  const reverted = unbridgeStreakForRestDay(chained, '2026-09-26');
  assert.deepStrictEqual(reverted, { streak: 5, lastCompletedDate: '2026-09-25' });

  // unbridge: köprülenen gün bu değilse (daha eski bir işaret), dokunulmaz (güvenli taraf).
  const notLatest = unbridgeStreakForRestDay(chained, '2026-09-25');
  assert.deepStrictEqual(notLatest, { streak: 5, lastCompletedDate: '2026-09-26' });
}

// --- sanitizeStats: geriye uyumluluk (eski kayıtlarda restDays alanları yok) ---
{
  const DEFAULT_STATS = {
    totalSessions: 0,
    streak: 0,
    lastCompletedDate: null,
    history: {},
    byType: { breathing: 0, movements: 0, exercises: 0 },
    celebratedMilestones: [],
    achievements: {},
    challenge: { active: false, startDate: null, doneDates: [], completed: false },
    restDays: {},
    restDaysUsedThisWeek: 0,
    restDaysWeekStart: null,
  };

  // Eski (SDK öncesi özellik) kayıtlı veri: restDays alanları hiç yok.
  const oldSaved = {
    totalSessions: 12,
    streak: 4,
    lastCompletedDate: '2026-09-23',
    history: { '2026-09-23': 1 },
    byType: { breathing: 4, movements: 3, exercises: 5 },
  };
  const migrated = sanitizeStats(oldSaved, DEFAULT_STATS);
  assert.deepStrictEqual(migrated.restDays, {});
  assert.strictEqual(migrated.restDaysUsedThisWeek, 0);
  assert.strictEqual(migrated.restDaysWeekStart, null);
  // Eski alanlar bozulmadan kalmalı.
  assert.strictEqual(migrated.streak, 4);
  assert.strictEqual(migrated.totalSessions, 12);

  // Var olan yeni-alanlı veri doğru şekilde okunur.
  const current = sanitizeStats(
    {
      ...oldSaved,
      restDays: { '2026-09-22': true, '2026-09-21': true },
      restDaysUsedThisWeek: 2,
      restDaysWeekStart: '2026-09-21',
    },
    DEFAULT_STATS
  );
  assert.deepStrictEqual(current.restDays, { '2026-09-22': true, '2026-09-21': true });
  assert.strictEqual(current.restDaysUsedThisWeek, 2);
  assert.strictEqual(current.restDaysWeekStart, '2026-09-21');

  // Bozuk restDays verisi güvenli şekilde süzülür (garbage key, false/1 değerleri, dizi/null).
  for (const bad of [null, 5, 'x', [], { history: [1, 2] }]) {
    const s = sanitizeStats(bad, DEFAULT_STATS);
    assert.deepStrictEqual(s.restDays, {});
    assert.strictEqual(s.restDaysUsedThisWeek, 0);
    assert.strictEqual(s.restDaysWeekStart, null);
  }
  const dirty = sanitizeStats(
    {
      ...oldSaved,
      restDays: { '2026-09-22': true, garbage: true, '2026-09-21': false, '2026-09-20': 1 },
      restDaysUsedThisWeek: 'NaN',
      restDaysWeekStart: 12345,
    },
    DEFAULT_STATS
  );
  assert.deepStrictEqual(dirty.restDays, { '2026-09-22': true });
  assert.strictEqual(dirty.restDaysUsedThisWeek, 0);
  assert.strictEqual(dirty.restDaysWeekStart, null);
}

// --- Uçtan uca senaryo: haftada 2 hak kullanımı + hafta sıfırlaması ---
{
  // Pazartesi (09-21) seans yapıldı, streak=1. Salı+Çarşamba (22,23) tatile çıkıldı,
  // ikisi de dinlenme günü işaretlendi (2 hak da kullanıldı). Perşembe (24) seans:
  // seri kırılmadan devam etmeli (2).
  let stats = {
    streak: 1,
    lastCompletedDate: '2026-09-21',
    history: { '2026-09-21': 1 },
    restDays: {},
    restDaysUsedThisWeek: 0,
    restDaysWeekStart: '2026-09-21',
  };

  for (const day of ['2026-09-22', '2026-09-23']) {
    const check = canMarkRestDay(stats, day, '2026-09-24');
    assert.strictEqual(check.ok, true, `${day} işaretlenebilmeli`);
    const bridged = bridgeStreakForRestDay(stats, day);
    stats = {
      ...stats,
      restDays: { ...stats.restDays, [day]: true },
      restDaysWeekStart: check.week.weekStart,
      restDaysUsedThisWeek: check.week.usedThisWeek + 1,
      streak: bridged.streak,
      lastCompletedDate: bridged.lastCompletedDate,
    };
  }
  assert.strictEqual(stats.restDaysUsedThisWeek, 2);
  assert.strictEqual(stats.streak, 1, 'iki dinlenme günü boyunca seri sabit kalmalı');
  assert.strictEqual(stats.lastCompletedDate, '2026-09-23');

  // Hakkı kalmadı: 3. bir gün dinlenme günü olarak işaretlenemez.
  const noMoreRights = canMarkRestDay(stats, '2026-09-20', '2026-09-24');
  assert.strictEqual(noMoreRights.ok, false);
  assert.strictEqual(noMoreRights.reason, 'no-rights-left');

  // Perşembe (24) gerçek bir seans: computeStreak DOKUNULMADAN devam eder.
  const thursdayStreak = computeStreak({
    streak: stats.streak,
    lastCompletedDate: stats.lastCompletedDate,
    today: '2026-09-24',
    yesterday: '2026-09-23',
  });
  assert.strictEqual(thursdayStreak, 2);

  // Sonraki Pazartesi (28): yeni hafta, haklar 2'ye sıfırlanır (birikmedi).
  const nextWeek = restWeekState(stats, new Date(2026, 8, 28));
  assert.deepStrictEqual(nextWeek, { weekStart: '2026-09-28', usedThisWeek: 0, remaining: 2 });
}

console.log('restday tests passed');
