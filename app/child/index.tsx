import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAppStore,
  selectVisibleForChild,
  selectHeroForCurrentChild,
} from '@/store';
import { TaskCard } from '@/components/TaskCard';
import { FocusTimer } from '@/components/FocusTimer';
import { useTheme } from '@/components/useTheme';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { Task, heroEmojiForLevel } from '@/types';

export default function ChildQuests() {
  const { c } = useTheme();
  const tasks = useAppStore(selectVisibleForChild);
  const hero = useAppStore(selectHeroForCurrentChild);
  const profile = useAppStore((s) => s.profile);
  const submitTask = useAppStore((s) => s.submitTask);
  const [active, setActive] = useState<Task | null>(null);

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const order = { rejected: 0, active: 1, submitted: 2, approved: 3 } as const;
        if (order[a.status] !== order[b.status])
          return order[a.status] - order[b.status];
        return a.deadline.localeCompare(b.deadline);
      }),
    [tasks],
  );

  const heroLevel = hero?.level ?? 1;
  const heroName = profile?.displayName ?? hero?.name ?? 'Герой';

  const renderHeader = () => (
    <View style={[styles.banner, { backgroundColor: Palette.child.primarySoft }]}>
      <Text style={styles.heroEmoji}>{heroEmojiForLevel(heroLevel)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.heroName, { color: Palette.child.primaryDark }]}>
          Привет, {heroName}!
        </Text>
        <Text style={[styles.heroSub, { color: Palette.child.primaryDark }]}>
          Уровень {heroLevel} · {hero?.coins ?? 0} монет · {hero?.streakDays ?? 0}🔥
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Task }) => {
    const isPending = item.status === 'submitted';
    return (
      <View style={{ gap: Spacing.sm }}>
        <TaskCard task={item} variant="child" />
        {isPending ? (
          <View
            style={[
              styles.pending,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Ionicons name="hourglass-outline" size={16} color={c.textMuted} />
            <Text style={[styles.pendingText, { color: c.textMuted }]}>
              Ожидает проверки родителя
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: Palette.child.primary }]}
            onPress={() => setActive(item)}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.startText}>Начать квест</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 56 }}>🎉</Text>
      <Text style={[styles.emptyTitle, { color: c.text }]}>Все квесты пройдены!</Text>
      <Text style={[styles.emptySub, { color: c.textMuted }]}>
        Заглядывай позже — родитель добавит новые
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: Spacing.xxl,
          gap: Spacing.md,
        }}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ marginBottom: Spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
      />

      <FocusTimer
        task={active}
        visible={active !== null}
        onClose={() => setActive(null)}
        onComplete={(elapsed) => {
          if (active) void submitTask(active.id, elapsed);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  heroEmoji: { fontSize: 40 },
  heroName: { fontSize: 16, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  startText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pendingText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 8, marginTop: Spacing.xxl * 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
