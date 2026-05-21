import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Palette } from '@/constants/theme';

/**
 * Routing trampoline. Returns a declarative <Redirect />, which expo-router
 * v6 picks up safely AFTER the navigator has mounted.
 *
 * If Supabase is not configured we just sit here with a spinner —
 * auth is mandatory in the new schema.
 */
export default function Index() {
  const session = useAppStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);

  if (!isSupabaseConfigured) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Palette.child.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/auth" />;
  if (!profile || !profile.familyId) return <Redirect href="/onboarding" />;
  return <Redirect href={profile.role === 'parent' ? '/parent' : '/child'} />;
}
