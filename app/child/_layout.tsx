import React from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import { useAppStore } from '@/store';
import { signOut } from '@/lib/auth';

const HeaderRight = () => {
  const { c } = useTheme();
  const signOutLocal = useAppStore((s) => s.signOutLocal);
  const handle = () => {
    Alert.alert('Выйти?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          signOutLocal();
          router.replace('/auth');
        },
      },
    ]);
  };
  return (
    <TouchableOpacity
      onPress={handle}
      style={{
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
      hitSlop={8}
    >
      <Ionicons name="exit-outline" size={20} color={c.textMuted} />
      <Text style={{ color: c.textMuted, fontSize: 13 }}>Выйти</Text>
    </TouchableOpacity>
  );
};

export default function ChildLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.child.primary,
        tabBarInactiveTintColor: c.textMuted,
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text, fontWeight: '700' },
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Квесты',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="hero"
        options={{
          title: 'Герой',
          tabBarIcon: ({ color, size }) => <Ionicons name="ribbon" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
