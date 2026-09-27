import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radius } from '../lib/theme';

// Shared bento card used across Home and Stats for the 2026 wellness-app
// refresh: a soft sage-green -> sky-blue gradient with a translucent "glass"
// panel on top (the default), or (variant="soft") a plain surface card with
// a normal border, for the smaller action/secondary tiles in the same grid.
// Purely presentational — no data logic lives here, so screens keep passing
// their own props/children through unchanged.
export default function GradientCard({
  children,
  style,
  contentStyle,
  variant = 'gradient',
  cornerRadius = radius.xl,
  glass = true,
}) {
  const colors = useThemeColors();
  const rounded = { borderRadius: cornerRadius };

  if (variant === 'soft') {
    const softInner = (
      <View
        style={[
          styles.content,
          rounded,
          glass && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          contentStyle,
        ]}
      >
        {children}
      </View>
    );
    return (
      <View
        style={[
          styles.wrap,
          rounded,
          { shadowColor: colors.shadow, backgroundColor: colors.surface },
          style,
        ]}
      >
        {softInner}
      </View>
    );
  }

  const inner = (
    <View
      style={[
        styles.content,
        rounded,
        glass && {
          backgroundColor: colors.glassBg,
          borderColor: colors.glassBorder,
          borderWidth: 1,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.wrap, rounded, { shadowColor: colors.shadow }, style]}>
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[rounded, styles.gradient]}
      >
        {inner}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    elevation: 3,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  gradient: {
    overflow: 'hidden',
  },
  content: {
    overflow: 'hidden',
  },
});
