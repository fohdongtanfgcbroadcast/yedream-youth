import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { COLORS } from '../../src/lib/constants';

const TabIcon = ({ label, color }: { label: string; color: string }) => (
  <Text style={{ fontSize: 22, color }}>{label}</Text>
);

export default function AppLayout() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const canCheckAttendance = useAuthStore((s) => s.canCheckAttendance)();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 11 },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          headerTitle: '예닮드림 청년부',
          tabBarIcon: ({ color }) => <TabIcon label="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(classes)"
        options={{
          title: '반별',
          headerTitle: '반별 조회',
          tabBarIcon: ({ color }) => <TabIcon label="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(attendance)"
        options={{
          title: '출석',
          headerTitle: '출석 관리',
          tabBarIcon: ({ color }) => <TabIcon label="✅" color={color} />,
          href: canCheckAttendance ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="(rankings)"
        options={{
          title: '순위',
          headerTitle: '출석 순위',
          tabBarIcon: ({ color }) => <TabIcon label="🏆" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: '검색',
          headerTitle: '검색',
          tabBarIcon: ({ color }) => <TabIcon label="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(admin)"
        options={{
          title: '더보기',
          headerTitle: isAdmin ? '관리 메뉴' : '설정',
          tabBarIcon: ({ color }) => <TabIcon label="⚙️" color={color} />,
        }}
      />
      <Tabs.Screen name="(members)" options={{ href: null }} />
    </Tabs>
  );
}
