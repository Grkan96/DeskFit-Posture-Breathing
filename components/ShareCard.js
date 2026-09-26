import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getLast7Days } from '../lib/stats';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

// Kare kart: Instagram hikâyesi / WhatsApp için görsel olarak yakalanır.
export const SHARE_CARD_SIZE = 300;
const BAR_MAX_HEIGHT = 56;

// Seriye göre kısa bir motivasyon cümlesi seçer.
function motivationKey(streak) {
  if (streak >= 30) return 'shareCard.motivationMonth';
  if (streak >= 7) return 'shareCard.motivationWeek';
  return 'shareCard.motivationStart';
}

// Paylaşılabilir başarı kartı. `ref`, react-native-view-shot'un captureRef'i
// için kök View'a iletilir (collapsable={false} Android'de yakalama için şart).
const ShareCard = forwardRef(function ShareCard({ streak = 0, totalSessions = 0, history = {} }, ref) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const weekdayLabels = t('stats.weekdays');
  const week = getLast7Days(history || {});
  const maxCount = Math.max(1, ...week.map((d) => d.count));
  const todayKey = week[week.length - 1].date;

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {/* Dekoratif daireler — kartı düz bir kutudan daha canlı gösterir */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.brandRow}>
        <Text style={styles.brandIcon}>🧘</Text>
        <Text style={styles.brandName} numberOfLines={1}>
          {t('shareCard.appName')}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>{t('stats.streakLabel')}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>✅ {totalSessions}</Text>
          <Text style={styles.statLabel}>{t('stats.sessionsLabel')}</Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        {week.map((day) => {
          const height = day.count === 0 ? 4 : Math.max(8, (day.count / maxCount) * BAR_MAX_HEIGHT);
          const isToday = day.date === todayKey;
          return (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height }, day.count > 0 && styles.barFilled]} />
              </View>
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {Array.isArray(weekdayLabels) ? weekdayLabels[day.weekday] : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.motivation} numberOfLines={2}>
        {t(motivationKey(streak))}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1}>
          {t('shareCard.footerCta')}
        </Text>
      </View>
    </View>
  );
});

export default ShareCard;

// Kart, temanın "yumuşak vurgu" renkleriyle çizilir: açık temada nane yeşili
// zemin + koyu yeşil yazı, koyu temada koyu yeşil zemin + açık yeşil yazı.
function createStyles(colors) {
  return StyleSheet.create({
    card: {
      width: SHARE_CARD_SIZE,
      height: SHARE_CARD_SIZE,
      borderRadius: 24,
      padding: 18,
      overflow: 'hidden',
      backgroundColor: colors.accentSofter,
      justifyContent: 'space-between',
    },
    blob: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      opacity: 0.45,
    },
    blobTop: {
      width: 180,
      height: 180,
      top: -70,
      right: -60,
    },
    blobBottom: {
      width: 140,
      height: 140,
      bottom: -60,
      left: -50,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    brandName: {
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '800',
      color: colors.accentText,
      letterSpacing: 0.3,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 10,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
    },
    chartRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 4,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
    },
    barTrack: {
      width: 16,
      height: BAR_MAX_HEIGHT,
      justifyContent: 'flex-end',
    },
    bar: {
      width: 16,
      borderRadius: 5,
      backgroundColor: colors.surface,
      opacity: 0.7,
    },
    barFilled: {
      backgroundColor: colors.accent,
      opacity: 1,
    },
    barLabel: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: '600',
      color: colors.accentText,
      opacity: 0.75,
    },
    barLabelToday: {
      opacity: 1,
      fontWeight: '800',
    },
    motivation: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accentText,
      textAlign: 'center',
    },
    footer: {
      alignSelf: 'center',
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    footerText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#ffffff',
    },
  });
}
