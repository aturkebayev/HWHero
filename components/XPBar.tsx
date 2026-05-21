import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Palette, Radius } from '@/constants/theme';
import { useTheme } from './useTheme';
import { XP_PER_LEVEL } from '@/types';

type Props = { xp: number; level: number };

export const XPBar: React.FC<Props> = ({ xp, level }) => {
  const { c } = useTheme();
  const into = xp % XP_PER_LEVEL;
  const ratio = into / XP_PER_LEVEL;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [ratio, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.lvl, { color: c.text }]}>Уровень {level}</Text>
        <Text style={[styles.xp, { color: c.textMuted }]}>
          {into} / {XP_PER_LEVEL} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lvl: { fontSize: 16, fontWeight: '700' },
  xp: { fontSize: 13 },
  track: {
    height: 14,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Palette.child.primary,
    borderRadius: Radius.sm,
  },
});
