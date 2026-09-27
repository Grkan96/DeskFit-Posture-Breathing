'use no memo';
// Android ana ekran widget'ının GÖRSEL tanımı.
//
// ÖNEMLİ: Bu dosya 'react-native-android-widget' paketini üst seviyede import
// eder. O paket sadece gerçek native derlemede (dev/preview/production EAS
// build) mevcuttur — Expo Go'da native modül bulunmadığından bu dosyayı
// import etmenin kendisi bile çöker. Bu yüzden bu dosya HİÇBİR YERDE üst
// seviye `import` ile yüklenmemeli; sadece lib/widgetUpdate.js içindeki
// güvenli, Expo Go kontrolünden SONRA çalışan `require()` çağrılarıyla
// yüklenmelidir. Bkz. lib/widgetUpdate.js.
//
// Renk paleti: ana ekranın yeni koyu antrasit + amber "kadran" kimliğiyle
// tutarlı olması için, lib/theme.js'teki açık/koyu temalar KULLANILMAZ.
// Widget her zaman aynı sabit koyu/amber paleti kullanır (config'de
// light/dark iki varyant render etmemiz gerektiği için ikisi de bu paleti
// döner) — tıpkı yeni ana ekranın sistem temasından bağımsız sabit
// koyu/amber kimliği kullanması gibi, bilinçli bir tasarım kararı.
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const PALETTE = {
  bg: '#1B1D1F',
  panel: '#141617',
  amber: '#F2A64B',
  text: '#EDEAE3',
  faint: '#9A9DA1',
  empty: '#2A2D30',
};

// Widget'lar hook kullanamaz, sadece primitiflerden (FlexWidget/TextWidget/...)
// oluşan saf bir ağaç döndüren fonksiyonlar olabilir. Async da olamazlar.
// Tüm görünür metinler (statusLabel, nextLabel, a11y etiketleri...) çağıran
// taraftan (lib/widgetUpdate.js) hazır, çevrilmiş string olarak gelir — bu
// bileşen kendi başına çeviri YAPMAZ.
//
// Not: react-native-android-widget genişlik/yükseklik için sadece
// 'wrap_content' | 'match_parent' | sayı (dp) kabul eder — yüzde string'i
// ('50%') veya CSS flex-basis desteklenmez. Bu yüzden ilerleme çubuğu
// yüzdesi, iki kardeş FlexWidget'ın `flex` ağırlıklarıyla (flex: pct /
// flex: 100 - pct) orantılı olarak oluşturulur; sonuç görsel olarak aynı
// "dolgu çubuğu" etkisini verir.
export function StreakWidget({
  title,
  streak,
  todayCount,
  goal,
  progressPercent,
  streakA11y,
  ratioA11y,
  isRunning,
  statusLabel,
  statusA11y,
  nextLabel,
  nextA11y,
  weekStripA11y,
  last7Days = [],
}) {
  const c = PALETTE;
  const hasStreak = Number(streak) > 0;
  const pct = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  const fillFlex = Math.max(pct, 0.0001); // 0 iken de FlexWidget'ın geçerli bir flex alması için
  const trackFlex = Math.max(100 - pct, 0.0001);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: c.bg,
        borderRadius: 20,
        padding: 12,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel={title}
    >
      {/* Durum satırı: dolu/boş nokta + "AKTİF"/"DURAKLATILDI" */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isRunning ? c.amber : c.empty,
            marginRight: 6,
          }}
          accessibilityLabel={statusA11y}
        />
        <TextWidget
          text={statusLabel}
          style={{ fontSize: 11, fontWeight: '700', color: isRunning ? c.amber : c.faint }}
          maxLines={1}
          accessibilityLabel={statusA11y}
        />
      </FlexWidget>

      <TextWidget
        text={title}
        style={{ fontSize: 12, fontWeight: '600', color: c.faint }}
        maxLines={1}
      />

      {/* Seri sayısı (büyük, amber) + bugünkü X/Y */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={hasStreak ? `🔥 ${streak}` : '🔥 —'}
          style={{ fontSize: 24, fontWeight: 'bold', color: c.amber }}
          accessibilityLabel={streakA11y}
          maxLines={1}
        />
        <TextWidget
          text={`${todayCount}/${goal}`}
          style={{ fontSize: 15, fontWeight: 'bold', color: c.text }}
          accessibilityLabel={ratioA11y}
          maxLines={1}
        />
      </FlexWidget>

      {/* Bugünkü ilerleme çubuğu (koyu track + amber dolgu, flex ağırlıklı) */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          height: 8,
          borderRadius: 4,
          backgroundColor: c.empty,
          overflow: 'hidden',
        }}
        accessibilityLabel={ratioA11y}
      >
        <FlexWidget style={{ flex: fillFlex, height: 8, backgroundColor: c.amber }} />
        <FlexWidget style={{ flex: trackFlex, height: 8, backgroundColor: c.empty }} />
      </FlexWidget>

      {/* Sonraki hatırlatıcı saati (yalnızca çalışıyorsa ve biliniyorsa) */}
      {nextLabel ? (
        <TextWidget
          text={nextLabel}
          style={{ fontSize: 11, fontWeight: '600', color: c.faint }}
          accessibilityLabel={nextA11y}
          maxLines={1}
        />
      ) : null}

      {/* Haftalık mini şerit: 7 gün, amber dolu / koyu boş */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          backgroundColor: c.panel,
          borderRadius: 10,
          padding: 4,
        }}
        accessibilityLabel={weekStripA11y}
      >
        {last7Days.map((day, index) => (
          <FlexWidget
            key={day && day.date ? day.date : index}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: day && day.count > 0 ? c.amber : c.empty,
            }}
          />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
