import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../lib/theme';

// Ek bağımlılık gerektirmeyen, sadece View'larla çizilen dairesel ilerleme
// halkası. İki yarım daire "kırpma" kutusu kullanılır: sağ kutu 0–%50,
// sol kutu %50–%100 aralığını gösterir. Her kutudaki daire yalnızca üst ve
// sağ kenarı renkli olduğu için döndürüldüğünde yarım yay gibi görünür.
export default function GoalRing({ progress, size = 150, thickness = 12, children }) {
  const colors = useThemeColors();
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const half = size / 2;

  const arcBase = {
    position: 'absolute',
    top: 0,
    width: size,
    height: size,
    borderRadius: half,
    borderWidth: thickness,
    borderColor: 'transparent',
    borderTopColor: colors.accent,
    borderRightColor: colors.accent,
  };

  // Sağ yarı: -135° tamamen gizli, 45° tam yarım yay.
  const rightRotation = -135 + Math.min(p, 0.5) * 360;
  // Sol yarı: 45° tamamen gizli, 225° tam yarım yay.
  const leftRotation = 45 + Math.max(0, p - 0.5) * 360;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.track,
          { width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: colors.border },
        ]}
      />
      {p > 0 && (
        <View style={[styles.clip, { left: half, width: half, height: size }]}>
          <View style={[arcBase, { left: -half, transform: [{ rotate: `${rightRotation}deg` }] }]} />
        </View>
      )}
      {p > 0.5 && (
        <View style={[styles.clip, { left: 0, width: half, height: size }]}>
          <View style={[arcBase, { left: 0, transform: [{ rotate: `${leftRotation}deg` }] }]} />
        </View>
      )}
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  clip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
