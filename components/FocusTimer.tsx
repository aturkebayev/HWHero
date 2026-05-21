import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from './useTheme';
import { Task } from '@/types';

const POMODORO_SEC = 25 * 60;
const RING_SIZE = 240;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

type Props = {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (elapsedSec: number) => void;
};

export const FocusTimer: React.FC<Props> = ({ task, visible, onClose, onComplete }) => {
  const { c } = useTheme();
  const [remaining, setRemaining] = useState(POMODORO_SEC);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setRemaining(POMODORO_SEC);
      setElapsed(0);
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running) setRunning(false);
  }, [remaining, running]);

  const progress = 1 - remaining / POMODORO_SEC;
  const dashOffset = CIRC * (1 - progress);

  const handleDone = () => {
    Alert.alert(
      'Сдать квест?',
      'Отправить задание на проверку родителю?',
      [
        { text: 'Ещё подучусь', style: 'cancel' },
        {
          text: 'Отправить',
          style: 'default',
          onPress: () => {
            onComplete(elapsed);
            onClose();
          },
        },
      ],
    );
  };

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.wrap, { backgroundColor: c.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.subj, { color: c.text }]}>{task.subject}</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={[styles.descr, { color: c.textMuted }]} numberOfLines={3}>
          {task.description}
        </Text>

        <View style={[styles.shield, { backgroundColor: Palette.child.primarySoft }]}>
          <Text style={[styles.shieldText, { color: Palette.child.primaryDark }]}>
            🛡️ Щит концентрации активен
          </Text>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={c.border}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={Palette.child.primary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringText} pointerEvents="none">
            <Text style={[styles.time, { color: c.text }]}>{fmt(remaining)}</Text>
            <Text style={[styles.elapsed, { color: c.textMuted }]}>
              Прошло: {fmt(elapsed)}
            </Text>
          </View>
        </View>

        <View style={styles.btns}>
          <TouchableOpacity
            style={[styles.btn, { borderColor: c.border, backgroundColor: c.card }]}
            onPress={() => setRunning((r) => !r)}
          >
            <Ionicons
              name={running ? 'pause' : 'play'}
              size={22}
              color={c.text}
            />
            <Text style={[styles.btnText, { color: c.text }]}>
              {running ? 'Пауза' : 'Старт'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleDone}
          >
            <Ionicons name="checkmark" size={22} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff' }]}>Готово!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: Spacing.lg, paddingTop: Spacing.xxl + 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subj: { fontSize: 18, fontWeight: '700' },
  descr: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.md },
  shield: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  shieldText: { fontSize: 14, fontWeight: '600' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.lg },
  ringText: { position: 'absolute', alignItems: 'center' },
  time: { fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'] },
  elapsed: { fontSize: 14, marginTop: 4 },
  btns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: Palette.child.primary,
    borderColor: Palette.child.primary,
  },
  btnText: { fontSize: 16, fontWeight: '600' },
});
