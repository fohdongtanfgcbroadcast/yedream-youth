import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Chip, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { formatDate } from '../../../src/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const loadAll = useDataStore((s) => s.loadAll);
  const isLoading = useDataStore((s) => s.isLoading);

  // 앱 진입 시 DB에서 전체 데이터 로드
  useEffect(() => { loadAll(); }, []);
  const todaySummary = useDataStore((s) => s.getTodayAttendanceSummary)();
  const birthdayMembers = useDataStore((s) => s.getBirthdayMembers)();
  const members = useDataStore((s) => s.members);
  const classes = useDataStore((s) => s.classes);

  const today = new Date();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  return (
    <ScrollView style={styles.container}>
      {/* 인사말 */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          안녕하세요, {profile?.display_name}님
        </Text>
        <Text style={styles.dateText}>
          {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일 {dayNames[today.getDay()]}
        </Text>
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: '#E8F4FD' }]}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryNumber}>{members.filter((m) => m.is_active).length}</Text>
            <Text style={styles.summaryLabel}>전체 인원</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: '#FEF3E2' }]}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryNumber}>{classes.filter((c) => c.is_active).length}</Text>
            <Text style={styles.summaryLabel}>제자반</Text>
          </Card.Content>
        </Card>
      </View>

      {/* 오늘의 출석 */}
      <Card style={styles.card}>
        <Card.Title title="오늘의 출석 현황" />
        <Card.Content>
          {todaySummary.map((item) => {
            const typeInfo = ATTENDANCE_TYPES.find((t) => t.key === item.type);
            return (
              <View key={item.type} style={styles.attendanceRow}>
                <Chip
                  icon={typeInfo?.icon}
                  style={[styles.attendanceChip, { backgroundColor: typeInfo?.color + '20' }]}
                  textStyle={{ color: typeInfo?.color }}
                >
                  {item.type}
                </Chip>
                <Text style={styles.attendanceCount}>{item.count}명</Text>
              </View>
            );
          })}
          {todaySummary.every((s) => s.count === 0) && (
            <Text style={styles.emptyText}>오늘 출석 기록이 없습니다</Text>
          )}
        </Card.Content>
      </Card>

      {/* 생일자 */}
      <Card style={styles.card}>
        <Card.Title title="오늘의 생일자" />
        <Card.Content>
          {birthdayMembers.length > 0 ? (
            birthdayMembers.map((m) => (
              <View key={m.id} style={styles.birthdayRow}>
                <Avatar.Text size={36} label={m.name.charAt(0)} style={{ backgroundColor: COLORS.secondary }} />
                <View style={styles.birthdayInfo}>
                  <Text style={styles.birthdayName}>{m.name}</Text>
                  <Text style={styles.birthdayDate}>{formatDate(m.date_of_birth!)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>오늘 생일인 청년이 없습니다</Text>
          )}
        </Card.Content>
      </Card>

      {/* 빠른 액션 */}
      <Card style={styles.card}>
        <Card.Title title="빠른 메뉴" />
        <Card.Content>
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              icon="checkbox-marked-outline"
              onPress={() => router.push('/(app)/(attendance)')}
              style={styles.quickButton}
              compact
            >
              출석 체크
            </Button>
            <Button
              mode="contained"
              icon="account-group"
              onPress={() => router.push('/(app)/(classes)')}
              style={[styles.quickButton, { backgroundColor: '#8E44AD' }]}
              compact
            >
              반별 조회
            </Button>
            <Button
              mode="contained"
              icon="account-search"
              onPress={() => router.push('/(app)/(search)')}
              style={[styles.quickButton, { backgroundColor: COLORS.success }]}
              compact
            >
              회원 검색
            </Button>
            <Button
              mode="contained"
              icon="trophy"
              onPress={() => router.push('/(app)/(rankings)')}
              style={[styles.quickButton, { backgroundColor: COLORS.secondary }]}
              compact
            >
              순위 보기
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  greeting: { padding: 20, paddingTop: 12 },
  greetingText: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  dateText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 12 },
  summaryContent: { alignItems: 'center', paddingVertical: 8 },
  summaryNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  attendanceChip: { borderRadius: 8 },
  attendanceCount: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 12 },
  birthdayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  birthdayInfo: { marginLeft: 12 },
  birthdayName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  birthdayDate: { fontSize: 13, color: COLORS.textSecondary },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickButton: { borderRadius: 8 },
});
