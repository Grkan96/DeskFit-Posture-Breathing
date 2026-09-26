import { StyleSheet, Text, View } from 'react-native';

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
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                isToday && !done && styles.dotToday,
              ]}
            >
              {done ? <Text style={styles.check}>✓</Text> : null}
            </View>
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
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    dotDone: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    dotToday: {
      borderColor: colors.accent,
    },
    check: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.onAccent,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
    },
    labelToday: {
      color: colors.accentText,
      fontWeight: '800',
    },
  });
}
