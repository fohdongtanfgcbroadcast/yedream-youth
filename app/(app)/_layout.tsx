import React from 'react';
import { Text, View, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { COLORS } from '../../src/lib/constants';

const TabIcon = ({ label, color }: { label: string; color: string }) => (
  <Text style={{ fontSize: 18, color, marginBottom: -4 }}>{label}</Text>
);

const HeaderTitle = ({ title }: { title: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image source={require('../../assets/logo.png')} style={{ width: 32, height: 32, marginRight: 8 }} resizeMode="contain" />
    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 0.5, height: 0.5 }, textShadowRadius: 1 }}>{title}</Text>
  </View>
);

export default function AppLayout() {
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const canCheckAttendance = useAuthStore((s) => s.canCheckAttendance)();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { height: 56, paddingBottom: 6, paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          headerTitle: () => <HeaderTitle title="예닮드림 청년부" />,
          tabBarIcon: ({ color }) => <TabIcon label="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(classes)"
        options={{
          title: '반별',
          headerTitle: () => <HeaderTitle title="반별 조회" />,
          tabBarIcon: ({ color }) => <TabIcon label="≡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(attendance)"
        options={{
          title: '출석',
          headerTitle: () => <HeaderTitle title="출석 관리" />,
          tabBarIcon: ({ color }) => <TabIcon label="✓" color={color} />,
          href: canCheckAttendance ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="(rankings)"
        options={{
          title: '순위',
          headerTitle: () => <HeaderTitle title="출석 순위" />,
          tabBarIcon: ({ color }) => <TabIcon label="▲" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: '검색',
          headerTitle: () => <HeaderTitle title="검색" />,
          tabBarIcon: ({ color }) => <TabIcon label="⌕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(admin)"
        options={{
          title: '더보기',
          headerTitle: () => <HeaderTitle title={isAdmin ? '관리 메뉴' : '설정'} />,
          tabBarIcon: ({ color }) => <TabIcon label="⋯" color={color} />,
        }}
      />
      <Tabs.Screen name="(members)" options={{ href: null }} />
    </Tabs>
  );
}
