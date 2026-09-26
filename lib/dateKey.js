// Günlük istatistik anahtarları kullanıcının YEREL gününe göre üretilir.
// (toISOString() UTC verir; Türkiye'de gün 03:00'te dönmüş olurdu.)
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Öğlen saatine sabitlenir, böylece yaz/kış saati geçişleri günü kaydırmaz.
export function addDays(date, delta) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta, 12);
}
