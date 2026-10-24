import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import { getStats, getLast7Days } from '../lib/stats';
import { buildWeekBar, getShareCount, shareProgress } from '../lib/referral';
import { shareWeeklyCard } from '../lib/sharing';

// Haftalık özet kartı (metin + emoji; Expo Go'da ek native modül gerektirmez)
// ve paylaşım/davetçi rozeti sayacı.
export default function ShareCard() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [week, setWeek] = useState({ bar: '⬜⬜⬜⬜⬜⬜⬜', days: 0, sessions: 0, streak: 0 });
  const [shares, setShares] = useState(0);

  const refresh = useCallback(async () => {
    const stats = await getStats();
    const counts = getLast7Days(stats.history).map((d) => d.count);
    setWeek({
      bar: buildWeekBar(counts),
      days: counts.filter((n) => n > 0).length,
      sessions: counts.reduce((a, b) => a + b, 0),
      streak: stats.streak,
    });
    setShares(await getShareCount());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onShare() {
    const ok = await shareWeeklyCard(t('referral.weekMessage', week));
    if (ok) setShares(await getShareCount());
  }

  const p = shareProgress(shares);
  const styles = StyleSheet.create({
    card: { marginTop: 10, padding: 16, borderRadius: 16, backgroundColor: colors.accentSofter, alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '700', color: colors.accentText },
    bar: { fontSize: 22, marginTop: 8, letterSpacing: 2 },
    summary: { fontSize: 13, color: colors.subtext, marginTop: 6 },
    button: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.accent },
    buttonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    progress: { fontSize: 12, color: colors.subtext, marginTop: 10 },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('referral.weekTitle')}</Text>
      <Text style={styles.bar}>{week.bar}</Text>
      <Text style={styles.summary}>{t('referral.weekSummary', week)}</Text>
      <Pressable onPress={onShare} style={styles.button}>
        <Text style={styles.buttonText}>{t('referral.weekShare')}</Text>
      </Pressable>
      <Text style={styles.progress}>{t('referral.progress', { count: p.count, left: p.untilNext })}</Text>
    </View>
  );
}
