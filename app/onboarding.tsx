import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/store';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import { Role } from '@/types';

export default function Onboarding() {
  const { c } = useTheme();
  const session = useAppStore((s) => s.session);
  const bootstrapAsParent = useAppStore((s) => s.bootstrapAsParent);
  const joinAsChild = useAppStore((s) => s.joinAsChild);

  const defaultName =
    (session?.user.user_metadata?.full_name as string | undefined) ??
    (session?.user.email?.split('@')[0] ?? '');

  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState(defaultName);
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!role) return;
    if (!displayName.trim()) {
      Alert.alert('Введите имя', 'Имя будет видно второму участнику семьи');
      return;
    }
    setBusy(true);
    try {
      if (role === 'parent') {
        const res = await bootstrapAsParent(displayName.trim());
        if (res?.inviteCode) {
          Alert.alert(
            'Семья создана!',
            `Код для приглашения ребёнка: ${res.inviteCode}\nПередай его ребёнку — он введёт код при первом входе.`,
          );
        }
        router.replace('/parent');
      } else {
        if (inviteCode.trim().length < 4) {
          Alert.alert('Нужен код', 'Попроси у родителя код приглашения');
          return;
        }
        await joinAsChild(inviteCode, displayName.trim());
        router.replace('/child');
      }
    } catch (e: unknown) {
      // Supabase PostgrestError is a plain object, not an Error instance —
      // surface message/code/hint whatever shape it arrives in.
      let msg = 'Проверь код или подключение';
      if (e instanceof Error) {
        msg = e.message;
      } else if (e && typeof e === 'object') {
        const o = e as Record<string, unknown>;
        msg = [o.message, o.code, o.hint, o.details]
          .filter(Boolean)
          .join(' · ') || JSON.stringify(e);
      }
      Alert.alert('Не получилось', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.head}>
          <Text style={[styles.title, { color: c.text }]}>Кто ты?</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Это нужно один раз — потом будем сразу попадать в нужный режим
          </Text>
        </View>

        <View style={styles.roleRow}>
          <RoleCard
            active={role === 'parent'}
            onPress={() => setRole('parent')}
            color={Palette.parent}
            icon="shield-checkmark"
            title="Родитель"
            description="Создам семью и приглашу ребёнка"
          />
          <RoleCard
            active={role === 'child'}
            onPress={() => setRole('child')}
            color={Palette.child}
            icon="game-controller"
            title="Ребёнок"
            description="У меня есть код от родителя"
          />
        </View>

        <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
          <Text style={[styles.label, { color: c.text }]}>Имя</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Как тебя называть"
            placeholderTextColor={c.textMuted}
            style={[
              styles.input,
              { backgroundColor: c.card, borderColor: c.border, color: c.text },
            ]}
          />

          {role === 'child' && (
            <>
              <Text style={[styles.label, { color: c.text }]}>Код приглашения</Text>
              <TextInput
                value={inviteCode}
                onChangeText={(v) =>
                  setInviteCode(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))
                }
                placeholder="ABC123"
                placeholderTextColor={c.textMuted}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  styles.code,
                  { backgroundColor: c.card, borderColor: c.border, color: c.text },
                ]}
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor: role
                ? role === 'parent'
                  ? Palette.parent.primary
                  : Palette.child.primary
                : c.border,
            },
          ]}
          onPress={submit}
          disabled={!role || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.ctaText}>
                {role === 'parent' ? 'Создать семью' : 'Присоединиться'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type RoleCardProps = {
  active: boolean;
  onPress: () => void;
  color: { primary: string; primarySoft: string; primaryDark: string };
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const RoleCard: React.FC<RoleCardProps> = ({
  active,
  onPress,
  color,
  icon,
  title,
  description,
}) => {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.roleCard,
        {
          backgroundColor: active ? color.primarySoft : c.card,
          borderColor: active ? color.primary : c.border,
          borderWidth: active ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={32} color={color.primary} />
      <Text style={[styles.roleTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.roleDesc, { color: c.textMuted }]} numberOfLines={2}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, padding: Spacing.lg },
  head: { marginTop: Spacing.lg, gap: 6 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  roleRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  roleCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleTitle: { fontSize: 15, fontWeight: '700' },
  roleDesc: { fontSize: 12, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
  code: { letterSpacing: 6, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: 'auto',
    marginBottom: Spacing.lg,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
