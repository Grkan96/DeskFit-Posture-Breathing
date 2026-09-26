// İstatistikler değiştiğinde (seans bitti, hatırlatma teslim edildi vb.)
// açık ekranların kendini canlı güncelleyebilmesi için küçük bir olay yayıcı.
const listeners = new Set();

export function subscribeStatsChanged(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitStatsChanged() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      // Bir dinleyicideki hata diğerlerini etkilemesin.
    }
  });
}
