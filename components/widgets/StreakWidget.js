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
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { lightColors, darkColors } from '../../lib/theme';

// Widget'lar hook kullanamaz, sadece primitiflerden (FlexWidget/TextWidget/...)
// oluşan saf bir ağaç döndüren fonksiyonlar olabilir. Async da olamazlar.
export function StreakWidget({
  title,
  streak,
  todayCount,
  goal,
  streakA11y,
  ratioA11y,
  theme = 'light',
}) {
  const c = theme === 'dark' ? darkColors : lightColors;
  const hasStreak = Number(streak) > 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: c.surface,
        borderRadius: 20,
        padding: 14,
      }}
      clickAction="OPEN_APP"
      accessibilityLabel={title}
    >
      <TextWidget
        text={title}
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: c.subtext,
        }}
        maxLines={1}
      />

      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={hasStreak ? `🔥 ${streak}` : '🔥 —'}
            style={{ fontSize: 26, fontWeight: 'bold', color: c.text }}
            accessibilityLabel={streakA11y}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget
            text={`${todayCount}/${goal}`}
            style={{ fontSize: 20, fontWeight: 'bold', color: c.accent }}
            accessibilityLabel={ratioA11y}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
