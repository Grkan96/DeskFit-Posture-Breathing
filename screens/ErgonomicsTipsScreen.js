import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERGONOMICS_TIPS } from '../lib/ergonomicsTips';
import { useThemeColors, radius } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import TipIcon from '../components/TipIcon';

// "Okundu" işaretleri sadece bu ekrana özel, basit bir id listesi olarak
// AsyncStorage'da tutulur (movements/exercises'daki istatistik akışına
// dokunmaz — tamamen opsiyonel bir görsel işaret).
const READ_KEY = 'durus-hatirlatici/tips-read';

async function loadReadIds() {
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveReadIds(ids) {
  try {
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    // Sessizce yok say — bu işaret salt görsel, kritik değil.
  }
}

// Tek bir ipucu kartı: dokununca açılıp kapanan (expand/collapse) gövde metni
// ve isteğe bağlı "okundu" işareti. MovementsScreen/ExercisesScreen'in kart
// dilini (glass kart, radius token'ları) izler.
function TipCard({ styles, colors, t, tip, title, body, expanded, onToggle, read, onToggleRead }) {
  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.cardHeader, pressed && styles.cardPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${expanded ? '' : body}`}
        accessibilityHint={expanded ? undefined : title}
      >
        <View style={styles.cardIconWrap}>
          <TipIcon icon={tip.icon} size={20} color={colors.accentText} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        {read && <Text style={styles.readBadge}>✓</Text>}
        <Text style={styles.chevron}>{expanded ? '︿' : '﹀'}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.cardBody}>
          <Text style={styles.cardBodyText}>{body}</Text>
          <Pressable
            onPress={onToggleRead}
            style={styles.readRow}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: read }}
            accessibilityLabel={read ? t('ergonomicsTips.readDoneLabel') : t('ergonomicsTips.readLabel')}
          >
            <View style={[styles.readCheck, read && styles.readCheckDone]}>
              {read && <Text style={styles.readCheckMark}>✓</Text>}
            </View>
            <Text style={[styles.readLabel, read && styles.readLabelDone]}>
              {read ? t('ergonomicsTips.readDoneLabel') : t('ergonomicsTips.readLabel')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ErgonomicsTipsScreen({ onBack }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);
  const [readIds, setReadIds] = useState([]);

  useEffect(() => {
    loadReadIds().then(setReadIds);
  }, []);

  function toggleExpanded(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function toggleRead(id) {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveReadIds(next);
      return next;
    });
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('ergonomicsTips.backToMeditation')}
      >
        <Text style={styles.backText}>{t('ergonomicsTips.backToMeditation')}</Text>
      </Pressable>

      <Text style={styles.title} accessibilityRole="header">
        {t('ergonomicsTips.title')}
      </Text>
      <Text style={styles.subtitle}>{t('ergonomicsTips.subtitle')}</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {ERGONOMICS_TIPS.map((tip) => (
          <TipCard
            key={tip.id}
            styles={styles}
            colors={colors}
            t={t}
            tip={tip}
            title={t(`ergonomicsTips.items.${tip.id}.title`)}
            body={t(`ergonomicsTips.items.${tip.id}.body`)}
            expanded={expandedId === tip.id}
            onToggle={() => toggleExpanded(tip.id)}
            read={readIds.includes(tip.id)}
            onToggleRead={() => toggleRead(tip.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      backgroundColor: colors.bg,
    },
    backButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
    },
    backText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 6,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      lineHeight: 18,
    },
    list: {
      flex: 1,
      marginTop: 14,
    },
    listContent: {
      paddingBottom: 24,
      gap: 10,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 12,
    },
    cardPressed: {
      opacity: 0.85,
    },
    cardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.accentSofter,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    readBadge: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      marginLeft: 4,
    },
    chevron: {
      fontSize: 14,
      color: colors.muted,
      marginLeft: 4,
    },
    cardBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 2,
    },
    cardBodyText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 19,
    },
    readRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      minHeight: 44,
      alignSelf: 'flex-start',
      gap: 8,
    },
    readCheck: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readCheckDone: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    readCheckMark: {
      color: colors.onAccent,
      fontSize: 13,
      fontWeight: '800',
    },
    readLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
    },
    readLabelDone: {
      color: colors.accentText,
    },
  });
}
