import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '@/store';
import { useTheme } from '@/components/useTheme';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { heroEmojiForLevel } from '@/types';

export default function FamilyScreen() {
  const { c } = useTheme();
  const family = useAppStore((s) => s.family);
  const children = useAppStore((s) => s.children);
  const heroes = useAppStore((s) => s.heroByChildId);
  const regenerate = useAppStore((s) => s.regenerateInviteCode);
  const refreshFromRemote = useAppStore((s) => s.refreshFromRemote);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pull fresh family/children whenever the tab gains focus — a safety net
  // in case the realtime profiles subscription misses an event.
  useFocusEffect(
    useCallback(() => {
      void refreshFromRemote();
    }, [refreshFromRemote]),
  );

  const onPullRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFromRemote();
    } finally {
      setRefreshing(false);
    }
  };

  const code = family?.inviteCode ?? '——————';

  const copyCode = async () => {
    if (!family) return;
    try {
      await Clipboard.setStringAsync(family.inviteCode);
      Alert.alert('Скопировано', `Код ${family.inviteCode} в буфере обмена`);
    } catch {
      Alert.alert('Код', family.inviteCode);
    }
  };

  const shareCode = async () => {
    if (!family) return;
    try {
      await Share.share({
        message: `Я тебя добавляю в «Герой домашки» 🧙\nКод приглашения: ${family.inviteCode}\nЗайди через Google и введи этот код при первом запуске.`,
      });
    } catch (e: unknown) {
      Alert.alert('Не удалось поделиться', e instanceof Error ? e.message : '');
    }
  };

  const regen = () => {
    Alert.alert(
      'Сменить код?',
      'Старый код перестанет работать. Уже привязанные дети останутся в семье.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сменить',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const newCode = await regenerate();
              if (newCode) Alert.alert('Новый код', newCode);
            } catch (e: unknown) {
              Alert.alert('Ошибка', e instanceof Error ? e.message : '');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />
        }
      >
        <View style={[styles.card, { backgroundColor: Palette.parent.primarySoft }]}>
          <Text style={[styles.label, { color: Palette.parent.primaryDark }]}>
            Код приглашения
          </Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={[styles.hint, { color: Palette.parent.primaryDark }]}>
            Передай этот код ребёнку — он введёт его при первом входе через Google
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.miniBtn} onPress={copyCode}>
              <Ionicons name="copy-outline" size={18} color={Palette.parent.primaryDark} />
              <Text style={[styles.miniText, { color: Palette.parent.primaryDark }]}>
                Скопировать
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniBtn} onPress={shareCode}>
              <Ionicons
                name="share-social-outline"
                size={18}
                color={Palette.parent.primaryDark}
              />
              <Text style={[styles.miniText, { color: Palette.parent.primaryDark }]}>
                Поделиться
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniBtn} onPress={regen} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={Palette.parent.primaryDark} />
              ) : (
                <Ionicons name="refresh" size={18} color={Palette.parent.primaryDark} />
              )}
              <Text style={[styles.miniText, { color: Palette.parent.primaryDark }]}>
                Сменить
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.section, { color: c.text }]}>
          Дети в семье · {children.length}
        </Text>

        {children.length === 0 ? (
          <View style={[styles.empty, { borderColor: c.border, backgroundColor: c.card }]}>
            <Ionicons name="person-add-outline" size={32} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              Ещё никто не присоединился
            </Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>
              Поделись кодом выше — ребёнок появится здесь автоматически
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {children.map((child) => {
              const h = heroes[child.id];
              return (
                <View
                  key={child.id}
                  style={[styles.childCard, { backgroundColor: c.card, borderColor: c.border }]}
                >
                  <Text style={styles.childEmoji}>
                    {h ? heroEmojiForLevel(h.level) : '🥚'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.childName, { color: c.text }]}>
                      {child.displayName}
                    </Text>
                    <Text style={[styles.childMeta, { color: c.textMuted }]}>
                      {h
                        ? `Ур. ${h.level} · ${h.xp} XP · 🔥 ${h.streakDays}`
                        : 'Только присоединился'}
                    </Text>
                  </View>
                  {h && (
                    <View style={styles.coins}>
                      <Ionicons name="logo-bitcoin" size={16} color="#F59E0B" />
                      <Text style={[styles.coinsText, { color: c.text }]}>{h.coins}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  code: { fontSize: 40, fontWeight: '800', letterSpacing: 6, color: '#1F6BB8' },
  hint: { fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  miniText: { fontSize: 13, fontWeight: '700' },
  section: { fontSize: 16, fontWeight: '700' },
  empty: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  childEmoji: { fontSize: 32 },
  childName: { fontSize: 15, fontWeight: '700' },
  childMeta: { fontSize: 12, marginTop: 2 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinsText: { fontSize: 14, fontWeight: '700' },
});
