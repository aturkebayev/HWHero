import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, selectHeroForCurrentChild } from '@/store';
import { useTheme } from '@/components/useTheme';
import { XPBar } from '@/components/XPBar';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { heroEmojiForLevel } from '@/types';

export default function HeroScreen() {
  const { c } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const hero = useAppStore(selectHeroForCurrentChild);
  const tasks = useAppStore((s) => s.tasks);
  const setHeroName = useAppStore((s) => s.setHeroName);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(hero?.name ?? profile?.displayName ?? 'Герой');

  if (!profile || !hero) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg, padding: Spacing.lg }]}>
        <Text style={{ color: c.text }}>Загрузка профиля…</Text>
      </SafeAreaView>
    );
  }

  const myTasks = tasks.filter((t) => t.childId === profile.id);
  const recent = myTasks
    .filter((t) => t.status === 'approved' && t.approvedAt)
    .sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? ''))
    .slice(0, 5);

  const totalMin = Math.round(
    myTasks.reduce((sum, t) => sum + t.timeSpentSec, 0) / 60,
  );
  const questsDone = myTasks.filter((t) => t.status === 'approved').length;

  const saveName = () => {
    const trimmed = name.trim();
    void setHeroName(profile.id, trimmed.length > 0 ? trimmed : 'Герой');
    setEditing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg }}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.emoji}>{heroEmojiForLevel(hero.level)}</Text>
          {editing ? (
            <View style={styles.nameEdit}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[
                  styles.nameInput,
                  { color: c.text, borderColor: c.border, backgroundColor: c.card },
                ]}
                maxLength={20}
                autoFocus
                onSubmitEditing={saveName}
              />
              <TouchableOpacity onPress={saveName} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={32} color={Palette.child.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setName(hero.name);
                setEditing(true);
              }}
              style={styles.nameRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.name, { color: c.text }]}>{hero.name}</Text>
              <Ionicons name="pencil" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <XPBar xp={hero.xp} level={hero.level} />
        </View>

        <View style={styles.grid}>
          <Cell icon="logo-bitcoin" value={hero.coins} label="Монет" color="#F59E0B" />
          <Cell icon="flame" value={hero.streakDays} label="Дней подряд" color="#EF4444" />
          <Cell icon="trophy" value={questsDone} label="Квестов" color={Palette.child.primary} />
          <Cell icon="hourglass" value={totalMin} label="Минут учёбы" color={Palette.parent.primary} />
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Последние победы</Text>
          {recent.length === 0 ? (
            <Text style={[styles.muted, { color: c.textMuted }]}>
              Ещё нет одобренных квестов. Вперёд за приключениями!
            </Text>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {recent.map((t) => (
                <View key={t.id} style={[styles.recentRow, { borderColor: c.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentSubj, { color: c.text }]}>{t.subject}</Text>
                    <Text style={[styles.recentDesc, { color: c.textMuted }]} numberOfLines={1}>
                      {t.description}
                    </Text>
                  </View>
                  <View style={[styles.xpBadge, { backgroundColor: Palette.child.primary }]}>
                    <Text style={styles.xpBadgeText}>+{t.xpReward}</Text>
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

type CellProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
};

const Cell: React.FC<CellProps> = ({ icon, value, label, color }) => {
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
  heroBlock: { alignItems: 'center', gap: 8, paddingVertical: Spacing.md },
  emoji: { fontSize: 96 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '800' },
  nameEdit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 18,
    minWidth: 160,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  cellVal: { fontSize: 22, fontWeight: '800' },
  cellLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  muted: { fontSize: 13 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  recentSubj: { fontSize: 14, fontWeight: '700' },
  recentDesc: { fontSize: 12, marginTop: 2 },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  xpBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
