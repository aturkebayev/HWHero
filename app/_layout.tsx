import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useAppStore } from '@/store';
import { Palette } from '@/constants/theme';
import { AuthBoot } from '@/components/AuthBoot';

/**
 * Root layout: ONLY renders the navigator. All redirect logic must live in
 * leaf screens via <Redirect />, never via `router.replace()` from a useEffect
 * here — that fires before the Stack has mounted and crashes in expo-router v6
 * ("Attempted to navigate before mounting the Root Layout component").
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  const hydrated = useAppStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: scheme === 'dark' ? '#0B0F14' : '#FFFFFF',
        }}
      >
        <ActivityIndicator color={Palette.child.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AuthBoot />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="parent" />
        <Stack.Screen name="child" />
      </Stack>
    </GestureHandlerRootView>
  );
}
