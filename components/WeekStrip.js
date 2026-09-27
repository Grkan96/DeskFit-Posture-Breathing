import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Son 7 gün: her gün için bir nokta (yapıldıysa dolu) + gün harfi. `days` =
// lib/stats.js getLast7Days çıktısı; `labels` = 0 (Pazar)..6 kısa gün adları.
export default function WeekStrip({ days, labels, colors, todayLabel, doneLabel, missedLabel }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const done = d.count > 0;
        const isToday = i === days.length - 1;
        const name = labels[d.weekday] || '';
        const a11y = `${name}${isToday ? `, ${todayLabel}` : ''}: ${done ? doneLabel : missedLabel}`;
        return (
          <View key={d.date} style={styles.cell} accessible accessibilityLabel={a11y}>
            {done ? (
              <LinearGradient
                colors={[colors.gradientFrom, colors.gradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.dot, styles.dotDone]}
              >
                <Text style={styles.check}>✓</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.dot, isToday && styles.dotToday]} />
            )}
            <Text style={[styles.label, isToday && styles.labelToday]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    row: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingHorizontal: 4,
    },
    cell: {
      alignItems: 'center',
      flex: 1,
      gap: 4,
    },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg,
      borderWidth: 1.5,
      borderColor: colors.glassBorder,
    },
    dotDone: {
      borderWidth: 0,
      shadowColor: colors.accent,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    dotToday: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    check: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtext,
    },
    labelToday: {
      color: colors.accentText,
      fontWeight: '800',
    },
  });
}
