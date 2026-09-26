import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';

// Açılır/kapanır ayar bölümü. Animasyon LayoutAnimation ile; reduceMotion
// true ise animasyonsuz açılır/kapanır.
export default function SettingsSection({ title, open, onToggle, reduceMotion, children }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  function handlePress() {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    onToggle();
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={styles.headerRow}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: { marginBottom: 10 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderStrong,
      marginBottom: 10,
    },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    chevron: { fontSize: 16, color: colors.subtext },
    body: { overflow: 'hidden' },
  });
}
