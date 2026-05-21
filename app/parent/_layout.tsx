import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Palette } from '@/constants/theme';
import { useTheme } from '@/components/useTheme';
import { useAppStore } from '@/store';
import { signOut } from '@/lib/auth';
import { PinModal } from '@/components/PinModal';

const HeaderRight = () => {
  const { c } = useTheme();
  const signOutLocal = useAppStore((s) => s.signOutLocal);

  const handle = () => {
    Alert.alert('Выйти из аккаунта?', '', [
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
      <Ionicons name="log-out-outline" size={20} color={c.textMuted} />
      <Text style={{ color: c.textMuted, fontSize: 13 }}>Выйти</Text>
    </TouchableOpacity>
  );
};

/**
 * Gate: enforce PIN once per app launch so kids can't open parent UI by accident.
 */
const PinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parentPin = useAppStore((s) => s.parentPin);
  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(true);

  if (unlocked) return <>{children}</>;
  return (
    <PinModal
      visible={showPin}
      expectedPin={parentPin}
      onSuccess={() => {
        setShowPin(false);
        setUnlocked(true);
      }}
      onClose={() => {
        setShowPin(false);
        router.replace('/');
      }}
    />
  );
};

export default function ParentLayout() {
  const { c } = useTheme();
  return (
    <PinGate>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Palette.parent.primary,
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
            title: 'Задания',
            tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Добавить',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Прогресс',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="family"
          options={{
            title: 'Семья',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
          }}
        />
      </Tabs>
    </PinGate>
  );
}
