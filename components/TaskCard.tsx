import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from './useTheme';
import { Task, SUBJECT_ICONS } from '@/types';

const formatDeadline = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const dayMs = 86400000;
  const dayDiff = Math.floor(
    (new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) /
      dayMs,
  );
  if (dayDiff === 0) return 'Сегодня';
  if (dayDiff === 1) return 'Завтра';
  if (dayDiff === -1) return 'Вчера';
  if (dayDiff < 0) return `Просрочено на ${-dayDiff} дн.`;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};

const statusColor = (status: Task['status']) => Palette.status[status];

const statusLabel: Record<Task['status'], string> = {
  active: 'Активно',
  submitted: 'Ожидает проверки',
  approved: 'Одобрено',
  rejected: 'Возвращено',
};

type Props = {
  task: Task;
  variant: 'parent' | 'child';
  onPress?: () => void;
  highlight?: boolean;
};

export const TaskCard: React.FC<Props> = ({ task, variant, onPress, highlight }) => {
  const { c } = useTheme();
  const overdue =
    new Date(task.deadline).getTime() < Date.now() &&
    (task.status === 'active' || task.status === 'rejected');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: highlight ? Palette.status.submitted : c.border,
          borderWidth: highlight ? 2 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.subjRow}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor:
                  variant === 'child' ? Palette.child.primarySoft : Palette.parent.primarySoft,
              },
            ]}
          >
            <Ionicons
              name={(SUBJECT_ICONS[task.subject] || 'book') as never}
              size={18}
              color={variant === 'child' ? Palette.child.primary : Palette.parent.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subj, { color: c.text }]} numberOfLines={1}>
              {task.subject}
            </Text>
            <Text
              style={[
                styles.deadline,
                { color: overdue ? Palette.status.rejected : c.textMuted },
              ]}
            >
              {formatDeadline(task.deadline)}
            </Text>
          </View>
        </View>
        <View style={[styles.xp, { backgroundColor: Palette.child.primary }]}>
          <Text style={styles.xpText}>+{task.xpReward} XP</Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: c.text }]} numberOfLines={2}>
        {task.description}
      </Text>

      <View style={styles.bottom}>
        <View style={[styles.statusDot, { backgroundColor: statusColor(task.status) }]} />
        <Text style={[styles.statusText, { color: c.textMuted }]}>
          {statusLabel[task.status]}
        </Text>
        {task.timeSpentSec > 0 && (
          <Text style={[styles.time, { color: c.textMuted }]}>
            · {Math.round(task.timeSpentSec / 60)} мин
          </Text>
        )}
      </View>

      {task.status === 'rejected' && task.parentComment && (
        <View
          style={[
            styles.commentBox,
            { backgroundColor: '#FEE2E2', borderColor: Palette.status.rejected },
          ]}
        >
          <Text style={styles.commentLabel}>Комментарий родителя</Text>
          <Text style={styles.commentText}>{task.parentComment}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  subjRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subj: { fontSize: 15, fontWeight: '600' },
  deadline: { fontSize: 12, marginTop: 2 },
  xp: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  xpText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  desc: { fontSize: 14, lineHeight: 19 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12 },
  time: { fontSize: 12 },
  commentBox: {
    marginTop: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  commentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  commentText: { fontSize: 13, color: '#7F1D1D' },
});
