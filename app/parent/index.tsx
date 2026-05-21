import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, selectSubmittedTasks } from '@/store';
import { TaskCard } from '@/components/TaskCard';
import { ReviewSheet } from '@/components/ReviewSheet';
import { useTheme } from '@/components/useTheme';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { Task } from '@/types';

export default function ParentTaskList() {
  const { c } = useTheme();
  const tasks = useAppStore((s) => s.tasks);
  const submitted = useAppStore(selectSubmittedTasks);
  const children = useAppStore((s) => s.children);
  const approveTask = useAppStore((s) => s.approveTask);
  const rejectTask = useAppStore((s) => s.rejectTask);
  const [reviewing, setReviewing] = useState<Task | null>(null);

  const childName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const ch of children) m[ch.id] = ch.displayName;
    return m;
  }, [children]);

  const others = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'submitted')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tasks],
  );

  const renderTaskWithChild = (t: Task, highlight = false) => (
    <View key={t.id} style={{ gap: 4 }}>
      {children.length > 1 && (
        <View style={styles.childTag}>
          <Ionicons name="person-circle" size={14} color={c.textMuted} />
          <Text style={[styles.childTagText, { color: c.textMuted }]}>
            {childName[t.childId] ?? 'Ребёнок'}
          </Text>
        </View>
      )}
      <TaskCard
        task={t}
        variant="parent"
        highlight={highlight}
        onPress={t.status === 'submitted' ? () => setReviewing(t) : undefined}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
      {submitted.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="alert-circle" size={18} color={Palette.status.submitted} />
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              На проверке · {submitted.length}
            </Text>
          </View>
          <View style={{ gap: Spacing.sm }}>
            {submitted.map((t) => renderTaskWithChild(t, true))}
          </View>
        </View>
      )}

      <View
        style={[styles.sectionHead, { marginTop: submitted.length > 0 ? Spacing.md : 0 }]}
      >
        <Ionicons name="folder-open" size={18} color={c.textMuted} />
        <Text style={[styles.sectionTitle, { color: c.text }]}>Все задания</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="book-outline" size={48} color={c.textMuted} />
      <Text style={[styles.emptyTitle, { color: c.text }]}>Пока нет заданий</Text>
      <Text style={[styles.emptySub, { color: c.textMuted }]}>
        Добавьте первое во вкладке «Добавить»
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <FlatList
        data={others}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => renderTaskWithChild(item)}
        ListEmptyComponent={others.length === 0 && submitted.length === 0 ? renderEmpty : null}
      />

      <ReviewSheet
        task={reviewing}
        onClose={() => setReviewing(null)}
        onApprove={async (bonus) => {
          if (!reviewing) return;
          await approveTask(reviewing.id, bonus);
          setReviewing(null);
        }}
        onReject={async (comment) => {
          if (!reviewing) return;
          await rejectTask(reviewing.id, comment);
          setReviewing(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  section: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  childTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  childTagText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 8, marginTop: Spacing.xxl * 2 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13 },
});
