import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, radius } from '../lib/theme';

// Shared card used across Stats (and available to any other screen) for the
// simplified, low-noise card language: variant="soft" (the common case) is a
// plain `colors.surface` panel with a thin `colors.border` edge and a barely
// visible shadow — no gradient, no glass. The default variant="gradient" is
// reserved for the one card per screen that should genuinely stand out (e.g.
// a challenge/highlight card): a *thin* gradient frame (colors.gradientFrom
// -> gradientTo) around an opaque-ish content panel, so the gradient reads
// as a subtle accent edge rather than a heavy wash across the whole card.
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
          styles.wrapSoft,
          rounded,
          { shadowColor: colors.shadow, backgroundColor: colors.surface },
          style,
        ]}
      >
        {softInner}
      </View>
    );
  }

  // A few px of the gradient show around the content as a thin frame instead
  // of washing the whole card — keeps the accent without the visual weight.
  const innerRadius = Math.max(0, cornerRadius - 3);
  const inner = (
    <View
      style={[
        styles.content,
        { borderRadius: innerRadius },
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
    <View style={[styles.wrapGradient, rounded, { shadowColor: colors.shadow }, style]}>
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
  wrapSoft: {
    alignSelf: 'stretch',
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  wrapGradient: {
    alignSelf: 'stretch',
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  gradient: {
    overflow: 'hidden',
    padding: 3,
  },
  content: {
    overflow: 'hidden',
  },
});
