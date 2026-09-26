# Büyüme Yol Haritası — İndirilme Sayısını Artırma

Bu doküman, uygulamanın mevcut halinin analizi ve indirilme sayısını
artırmaya yönelik özellik fikirlerini önceliğe göre listeler.

## Mevcut durum (özet)

- Duruş hatırlatıcı (aralık, sessiz saatler, ses/titreşim, erteleme/yaptım butonları)
- Göz dinlendirme (20-20-20) bildirimi
- Meditasyon sekmesi: 5 hareket, 5 egzersiz, 3 nefes tekniği
- İstatistik: seri (streak), toplam seans, 7 günlük grafik, tür dökümü
- Paylaşım (sadece düz metin, mağaza linki boş), mağaza değerlendirme isteği
- TR/EN dil desteği (varsayılan TR, cihaz dili algılanmıyor)
- AdMob banner (test ID'leri)

**Temel eksikler:** paylaşım görsel değil ve link içermiyor → viral döngü yok;
"Yaptım" butonu hiçbir şey kaydetmiyor → günlük hedef/ilerleme hissi yok;
yalnızca 2 dil ve cihaz dili algılanmıyor → global pazarlara kapalı;
mağaza aramalarında "pomodoro", "göz egzersizi" gibi yüksek hacimli
anahtar kelimelerde görünmüyor.

## Öncelikli fikirler

| # | Fikir | Neden indirmeyi artırır | Durum |
|---|-------|-------------------------|-------|
| 1 | **Görsel başarı kartı paylaşımı** (seri + 7 gün grafiği + "Google Play'de ücretsiz" CTA, mağaza linkiyle) | Her paylaşım yeni kullanıcı getiren organik reklam; Instagram hikâye / WhatsApp formatı | 1. dalga |
| 2 | **Dik oturuş check-in'i + günlük hedef halkası** ("Yaptım" butonu sayılır, 5/8 ilerleme, check-in serisi) | Günlük tutunma (retention) mağaza sıralamasının ana sinyali; daha çok aktif kullanıcı = daha çok yorum | 1. dalga |
| 3 | **Odak (Pomodoro) modu** + mola sırasında masa başı hareket önerisi | "pomodoro/focus timer" çok aranan kelimeler; uygulamayı yeni kitleye açar | 1. dalga |
| 4 | **Göz egzersizleri kategorisi** + yeni nefes tekniği (fizyolojik iç çekiş) | "göz yorgunluğu / eye exercises" aramaları; içerik zenginliği | 1. dalga |
| 5 | **Rozetler / başarımlar** | Oyunlaştırma → tutunma ve paylaşılacak an yaratır | 1. dalga |
| 6 | **Cihaz dilini otomatik algılama + yeni diller** (EN varsayılan yedek; ES, DE, PT-BR…) | Her yeni dil = yeni mağaza vitrini ve pazar; en yüksek kaldıraçlı ASO hamlesi | 2. dalga |
| 7 | **Mağaza listeleme metinleri (ASO)** — başlık, kısa/uzun açıklama, anahtar kelimeler (TR/EN) | Arama görünürlüğü; ekran görüntüsü metinleri | 2. dalga |
| 8 | Arkadaşını davet et / "birlikte dik otur" meydan okuması (paylaşılan kod ile 7 günlük challenge) | Referans döngüsü | Sonraki |
| 9 | Çalışma saatleri (sadece hafta içi 09–18 hatırlat) | Masa başı çalışanların gerçek ihtiyacı → daha az silme | Sonraki |
| 10 | Ana ekran widget'ı / Android Quick Settings kutucuğu | Görünürlük + tutunma (Expo Go'da çalışmaz, dev build gerekir) | Sonraki |
| 11 | Sesli rehberlik (nefes seanslarında ses/tizleme) | İçerik kalitesi → yorum puanı | Sonraki |
| 12 | Uzun süreli bildirim kuyruğu için arka plan görevi (48 saat sınırı) | Uygulama açılmazsa hatırlatmalar duruyor → sessiz churn | Sonraki |

## Yayın öncesi zorunlu işler (indirmeyi doğrudan etkiler)

- `app.json` içine gerçek `android.package` ve mağaza linki (paylaşımlar link taşısın).
- AdMob gerçek ID'leri; ilk açılışta reklam göstermeme (ilk izlenim / puan).
- Gizlilik politikasındaki e-posta alanını doldurmak (Play Console reddi riski).
- Değerlendirme isteğini "günlük hedef tamamlandı" anına bağlamak (en mutlu an).
