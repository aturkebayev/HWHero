import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { setSessionFromUrl } from '@/lib/auth';
import { useTheme } from '@/components/useTheme';
import { Palette, Spacing } from '@/constants/theme';

/**
 * OAuth landing route. On Android the provider redirect deep-links straight
 * into the app at exp://.../--/auth-callback#access_token=... — expo-router
 * routes it here. We parse the tokens, set the Supabase session, then bounce
 * to "/" which decides onboarding / parent / child.
 */
export default function AuthCallback() {
  const { c } = useTheme();
  const incomingUrl = Linking.useURL();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const finish = async () => {
      try {
        const url = incomingUrl ?? (await Linking.getInitialURL());
        if (!url) {
          // Nothing to parse — just leave.
          if (!cancelled) router.replace('/');
          return;
        }
        await setSessionFromUrl(url);
        if (!cancelled) router.replace('/');
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    void finish();
    return () => {
      cancelled = true;
    };
  }, [incomingUrl]);

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      {error ? (
        <>
          <Text style={[styles.title, { color: c.text }]}>Не удалось войти</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{error}</Text>
          <Text
            style={[styles.link, { color: Palette.parent.primary }]}
            onPress={() => router.replace('/auth')}
          >
            Вернуться ко входу
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={Palette.child.primary} size="large" />
          <Text style={[styles.sub, { color: c.textMuted }]}>Завершаем вход…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  title: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 14, textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '600', marginTop: Spacing.sm },
});
