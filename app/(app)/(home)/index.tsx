import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Chip, Avatar, TextInput, Modal, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, toDateString } from '../../../src/lib/utils';

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
  const schedules = useDataStore((s) => s.schedules);
  const addSchedule = useDataStore((s) => s.addSchedule);
  const deleteSchedule = useDataStore((s) => s.deleteSchedule);

  const today = new Date();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  // 캘린더 상태
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 일정 추가 모달
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  // 해당 월의 일정 맵
  const monthSchedules = useMemo(() => {
    const map: Record<string, typeof schedules> = {};
    schedules.forEach((s) => {
      const d = s.event_date;
      if (d.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`)) {
        if (!map[d]) map[d] = [];
        map[d].push(s);
      }
    });
    return map;
  }, [schedules, calYear, calMonth]);

  const selectedSchedules = selectedDate ? (monthSchedules[selectedDate] || []) : [];

  const goMonth = (dir: number) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDate(null);
  };

  const handleAddSchedule = () => {
    if (!scheduleTitle.trim()) {
      Alert.alert('알림', '일정 제목을 입력해주세요.');
      return;
    }
    if (!selectedDate) return;
    addSchedule({
      title: scheduleTitle.trim(),
      description: scheduleDesc || undefined,
      event_date: selectedDate,
      created_by: profile?.id,
    });
    Alert.alert('완료', '일정이 등록되었습니다.');
    setScheduleTitle('');
    setScheduleDesc('');
    setShowAddSchedule(false);
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert('삭제', '이 일정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteSchedule(id) },
    ]);
  };

  // 캘린더 날짜 배열
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const todayStr = toDateString(today);

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

      {/* 캘린더 */}
      <Card style={styles.card}>
        <Card.Content>
          {/* 캘린더 헤더 */}
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => goMonth(-1)}>
              <Text style={styles.calNav}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.calTitle}>{calYear}년 {calMonth + 1}월</Text>
            <TouchableOpacity onPress={() => goMonth(1)}>
              <Text style={styles.calNav}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.calWeekRow}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <Text key={d} style={[styles.calWeekDay, i === 0 && { color: COLORS.danger }, i === 6 && { color: COLORS.primary }]}>{d}</Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.calGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.calCell} />;
              }
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasSchedule = monthSchedules[dateStr] && monthSchedules[dateStr].length > 0;
              const dayOfWeek = (firstDay + day - 1) % 7;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    isToday && styles.calCellToday,
                    isSelected && styles.calCellSelected,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[
                    styles.calDay,
                    isToday && styles.calDayToday,
                    isSelected && styles.calDaySelected,
                    dayOfWeek === 0 && { color: COLORS.danger },
                    dayOfWeek === 6 && { color: COLORS.primary },
                    (isToday || isSelected) && { color: '#FFF' },
                  ]}>
                    {day}
                  </Text>
                  {hasSchedule && <View style={styles.calDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 선택된 날짜의 일정 */}
          {selectedDate && (
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleSectionHeader}>
                <Text style={styles.scheduleDate}>
                  {parseInt(selectedDate.split('-')[1])}월 {parseInt(selectedDate.split('-')[2])}일 일정
                </Text>
                {isAdmin && (
                  <Button mode="contained" compact onPress={() => setShowAddSchedule(true)} icon="plus" labelStyle={{ fontSize: 12 }}>
                    추가
                  </Button>
                )}
              </View>
              {selectedSchedules.length > 0 ? (
                selectedSchedules.map((s) => (
                  <View key={s.id} style={styles.scheduleItem}>
                    <View style={styles.scheduleItemDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scheduleItemTitle}>{s.title}</Text>
                      {s.description && <Text style={styles.scheduleItemDesc}>{s.description}</Text>}
                    </View>
                    {isAdmin && (
                      <TouchableOpacity onPress={() => handleDeleteSchedule(s.id)}>
                        <Text style={{ color: COLORS.danger, fontSize: 18 }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

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

      {/* 일정 추가 모달 */}
      <Portal>
        <Modal visible={showAddSchedule} onDismiss={() => setShowAddSchedule(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>일정 추가</Text>
          <Text style={styles.modalDesc}>{selectedDate}</Text>
          <TextInput
            label="일정 제목 *"
            value={scheduleTitle}
            onChangeText={setScheduleTitle}
            mode="outlined"
            style={{ marginBottom: 12 }}
          />
          <TextInput
            label="설명 (선택)"
            value={scheduleDesc}
            onChangeText={setScheduleDesc}
            mode="outlined"
            style={{ marginBottom: 12 }}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button mode="outlined" onPress={() => setShowAddSchedule(false)} style={{ flex: 1 }}>취소</Button>
            <Button mode="contained" onPress={handleAddSchedule} style={{ flex: 1 }}>등록</Button>
          </View>
        </Modal>
      </Portal>
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
  // 캘린더
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  calNav: { fontSize: 18, color: COLORS.primary, padding: 8 },
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  calCellToday: { backgroundColor: COLORS.primary },
  calCellSelected: { backgroundColor: COLORS.secondary },
  calDay: { fontSize: 14, color: COLORS.text },
  calDayToday: { color: '#FFF', fontWeight: 'bold' },
  calDaySelected: { color: '#FFF', fontWeight: 'bold' },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.secondary, marginTop: 2 },
  // 일정
  scheduleSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  scheduleSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scheduleDate: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  scheduleItemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  scheduleItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  scheduleItemDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  modal: { backgroundColor: '#FFF', margin: 24, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
});
