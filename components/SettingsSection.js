import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../lib/theme';

// Açılır/kapanır ayar bölümü. Animasyon LayoutAnimation ile; reduceMotion
// true ise animasyonsuz açılır/kapanır.
// Görsel: yumuşak gölgeli, yuvarlak köşeli "bento" kart; opsiyonel `icon`
// (emoji) ile başlık hiyerarşisi güçlendirilir. Prop sözleşmesi (title, open,
// onToggle, reduceMotion, children) aynen korunur — `icon` isteğe bağlıdır.
export default function SettingsSection({ title, icon, open, onToggle, reduceMotion, children }) {
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
        style={({ pressed }) => [styles.headerRow, pressed && styles.headerRowPressed]}
      >
        {icon ? (
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

function createStyles(colors) {
  // lib/theme.js henüz yumuşak-cam (glass) token'larını yayınlamamış
  // olabilir (paralel bir ajan ekliyor) — güvenli fallback ile tüket,
  // theme.js'e dokunma.
  const glassBorder = colors.glassBorder || colors.border;

  return StyleSheet.create({
    wrap: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: glassBorder,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
      borderRadius: 22,
    },
    headerRowPressed: {
      backgroundColor: colors.overlay,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSofter,
    },
    icon: { fontSize: 18 },
    title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
    chevron: { fontSize: 16, color: colors.subtext, minWidth: 20, textAlign: 'center' },
    body: {
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingBottom: 14,
      gap: 10,
    },
  });
}
