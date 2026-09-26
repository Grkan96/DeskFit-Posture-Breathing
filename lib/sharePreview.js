// "İlerlemeni paylaş" önizleme modalını React bileşeni olmayan modüllerden
// (örn. lib/celebrateMilestone.js) açabilmek için küçük bir yayın/abone yapısı.
// Modalın kendisi (components/SharePreviewModal.js) App.js içinde bir kez
// render edilir ve burada kendini dinleyici olarak kaydeder.

let listener = null;

export function registerSharePreviewListener(fn) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

// Modal açılabildiyse true döner. Dinleyici yoksa (modal henüz render
// edilmemiş) false döner; çağıran taraf metin paylaşımına düşebilir.
export function openSharePreview(payload = {}) {
  if (!listener) return false;
  try {
    listener(payload);
    return true;
  } catch (e) {
    return false;
  }
}
