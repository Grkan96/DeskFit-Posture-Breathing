import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';

const TABS = [
  { key: 'home', label: 'Ana Ekran', icon: '🏠' },
  { key: 'meditation', label: 'Meditasyon', icon: '🧘' },
  { key: 'settings', label: 'Ayarlar', icon: '⚙️' },
];

export default function TabBar({ activeTab, onChange }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
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
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    icon: {
      fontSize: 18,
      opacity: 0.5,
    },
    iconActive: {
      opacity: 1,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.faint,
    },
    labelActive: {
      color: colors.accent,
    },
  });
}
