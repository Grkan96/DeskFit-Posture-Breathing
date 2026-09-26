import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const TABS = [
  { key: 'home', labelKey: 'tabBar.home', icon: '🏠' },
  { key: 'meditation', labelKey: 'tabBar.meditation', icon: '🧘' },
  { key: 'settings', labelKey: 'tabBar.settings', icon: '⚙️' },
];

export default function TabBar({ activeTab, onChange }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (!active) Haptics.selectionAsync().catch(() => {});
              onChange(tab.key);
            }}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.labelKey)}
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tab: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    pill: {
      paddingHorizontal: 18,
      paddingVertical: 4,
      borderRadius: 999,
    },
    pillActive: {
      backgroundColor: colors.accentSofter,
    },
    icon: {
      fontSize: 20,
      opacity: 0.6,
    },
    iconActive: {
      opacity: 1,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
    },
    labelActive: {
      color: colors.accentText,
      fontWeight: '800',
    },
  });
}
