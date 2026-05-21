import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import { signInWithGoogle } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store';

export default function AuthScreen() {
  const { c } = useTheme();
  const [busy, setBusy] = useState(false);
  const session = useAppStore((s) => s.session);

  // Once Supabase auth restores or completes login, bounce back to "/"
  // which decides between onboarding / parent / child via <Redirect>.
  useEffect(() => {
    if (session) router.replace('/');
  }, [session]);

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Supabase не настроен',
        'Положи EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в .env',
      );
      return;
    }
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      Alert.alert('Ошибка входа', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        <Text style={styles.emoji}>🧙‍♂️</Text>
        <Text style={[styles.brand, { color: c.text }]}>Герой домашки</Text>
        <Text style={[styles.tag, { color: c.textMuted }]}>
          Войди, чтобы создать или присоединиться к семье героев
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.googleBtn, { backgroundColor: c.card, borderColor: c.border }]}
          disabled={busy}
          onPress={handleGoogle}
        >
          {busy ? (
            <ActivityIndicator color={c.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleText, { color: c.text }]}>
                Войти через Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.hint, { color: c.textMuted }]}>
          Родитель регистрируется первым и получает код для приглашения ребёнка.
          Ребёнок входит через свой Google-аккаунт и вводит этот код.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: Spacing.xxl * 2, gap: Spacing.sm },
  emoji: { fontSize: 80 },
  brand: { fontSize: 28, fontWeight: '800' },
  tag: { fontSize: 14, textAlign: 'center', marginTop: Spacing.sm },
  bottom: { gap: Spacing.lg, paddingBottom: Spacing.xl },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  googleText: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
