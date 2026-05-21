import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, selectOverdueTasks } from '@/store';
import { useTheme } from '@/components/useTheme';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { heroEmojiForLevel } from '@/types';

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const dayIndex = (d: Date) => (d.getDay() + 6) % 7;

export default function ParentStats() {
  const { c } = useTheme();
  const tasks = useAppStore((s) => s.tasks);
  const children = useAppStore((s) => s.children);
  const heroes = useAppStore((s) => s.heroByChildId);
  const overdue = useAppStore(selectOverdueTasks);

  const stats = useMemo(() => {
    const approved = tasks.filter((t) => t.status === 'approved');
    const submitted = tasks.filter((t) => t.status === 'submitted');
    const active = tasks.filter((t) => t.status === 'active' || t.status === 'rejected');
    const totalMin = Math.round(tasks.reduce((sum, t) => sum + t.timeSpentSec, 0) / 60);
    return {
      approved: approved.length,
      submitted: submitted.length,
      active: active.length,
      totalMin,
      approvedList: approved,
    };
  }, [tasks]);

  const weekData = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - dayIndex(today));
    const counts = Array(7).fill(0);
    for (const t of tasks) {
      if (t.status !== 'approved' || !t.approvedAt) continue;
      const a = new Date(t.approvedAt);
      if (a < startOfWeek) continue;
      const diffDays = Math.floor((a.getTime() - startOfWeek.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 7) counts[diffDays] += 1;
    }
    return counts;
  }, [tasks]);

  const maxCount = Math.max(1, ...weekData);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of stats.approvedList) {
      map.set(t.subject, (map.get(t.subject) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [stats.approvedList]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg }}
      >
        {children.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="people-outline" size={32} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              Нет детей в семье
            </Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>
              Пригласите ребёнка во вкладке «Семья»
            </Text>
          </View>
        ) : (
          children.map((child) => {
            const h = heroes[child.id];
            return (
              <View
                key={child.id}
                style={[styles.heroCard, { backgroundColor: Palette.parent.primarySoft }]}
              >
                <Text style={styles.heroEmoji}>
                  {h ? heroEmojiForLevel(h.level) : '🥚'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroName, { color: Palette.parent.primaryDark }]}>
                    {child.displayName}
                  </Text>
                  <Text style={[styles.heroLvl, { color: Palette.parent.primaryDark }]}>
                    {h
                      ? `Уровень ${h.level} · ${h.xp} XP · 🔥 ${h.streakDays}`
                      : 'Ещё нет прогресса'}
                  </Text>
                </View>
                {h && (
                  <View style={styles.coinsRow}>
                    <Ionicons
                      name="logo-bitcoin"
                      size={20}
                      color={Palette.parent.primaryDark}
                    />
                    <Text style={[styles.coins, { color: Palette.parent.primaryDark }]}>
                      {h.coins}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {overdue.length > 0 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.alertText}>Просрочено заданий: {overdue.length}</Text>
          </View>
        )}

        <View style={styles.grid}>
          <StatCell
            label="Выполнено"
            value={stats.approved}
            icon="checkmark-circle"
            color={Palette.status.approved}
          />
          <StatCell
            label="На проверке"
            value={stats.submitted}
            icon="alert-circle"
            color={Palette.status.submitted}
          />
          <StatCell
            label="Активных"
            value={stats.active}
            icon="time"
            color={Palette.parent.primary}
          />
          <StatCell
            label="Минут учёбы"
            value={stats.totalMin}
            icon="hourglass"
            color={Palette.child.primary}
          />
        </View>

        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Активность за неделю</Text>
          <View style={styles.bars}>
            {weekData.map((v, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.barTrack, { backgroundColor: c.surface }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(v / maxCount) * 100}%`,
                        backgroundColor: Palette.parent.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: c.textMuted }]}>{DAY_NAMES[i]}</Text>
                <Text style={[styles.barVal, { color: c.text }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>По предметам</Text>
          {bySubject.length === 0 ? (
            <Text style={[styles.muted, { color: c.textMuted }]}>
              Пока нет выполненных заданий
            </Text>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {bySubject.map(([subj, n]) => (
                <View key={subj} style={styles.subjRow}>
                  <Text style={[styles.subjName, { color: c.text }]}>{subj}</Text>
                  <View style={[styles.subjBadge, { backgroundColor: Palette.child.primary }]}>
                    <Text style={styles.subjBadgeText}>{n}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatCellProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const StatCell: React.FC<StatCellProps> = ({ label, value, icon, color }) => {
  const { c } = useTheme();
  return (
    <View style={[styles.cell, { backgroundColor: c.card, borderColor: c.border }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.cellVal, { color: c.text }]}>{value}</Text>
      <Text style={[styles.cellLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  empty: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  heroEmoji: { fontSize: 44 },
  heroName: { fontSize: 18, fontWeight: '800' },
  heroLvl: { fontSize: 13, marginTop: 2 },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coins: { fontSize: 18, fontWeight: '700' },
  alert: {
    backgroundColor: Palette.status.rejected,
    padding: Spacing.md,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  cellVal: { fontSize: 24, fontWeight: '800' },
  cellLabel: { fontSize: 12 },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barWrap: { alignItems: 'center', gap: 4, flex: 1 },
  barTrack: {
    width: 22,
    height: 100,
    borderRadius: Radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: Radius.sm },
  barLabel: { fontSize: 11 },
  barVal: { fontSize: 12, fontWeight: '700' },
  subjRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjName: { fontSize: 14 },
  subjBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 28,
    alignItems: 'center',
  },
  subjBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  muted: { fontSize: 13 },
});
