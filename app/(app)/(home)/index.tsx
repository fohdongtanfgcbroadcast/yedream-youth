import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Chip, Avatar, TextInput, Modal, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, toDateString, getSundayOfWeek, getWeekDates, webAlert, webConfirm } from '../../../src/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const assignedClassIds = useAuthStore((s) => s.getAssignedClassIds)();
  const loadAll = useDataStore((s) => s.loadAll);
  const isLoading = useDataStore((s) => s.isLoading);

  // 앱 진입 시 DB에서 전체 데이터 로드
  useEffect(() => { loadAll(); }, []);
  const todaySummary = useDataStore((s) => s.getTodayAttendanceSummary)();
  const birthdayMembers = useDataStore((s) => s.getBirthdayMembers)();
  const members = useDataStore((s) => s.members);
  const classes = useDataStore((s) => s.classes);
  const schedules = useDataStore((s) => s.schedules);
  const attendanceRecords = useDataStore((s) => s.attendanceRecords);
  const addSchedule = useDataStore((s) => s.addSchedule);
  const deleteSchedule = useDataStore((s) => s.deleteSchedule);

  // 일요일별 반별 출석 여부 맵: { sundayStr: { classId: boolean } }
  const sundayClassAttendanceMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    const activeClasses = classes.filter((c) => c.is_active);

    attendanceRecords.forEach((r) => {
      const d = new Date(r.attendance_date);
      const sun = getSundayOfWeek(d);
      const sunStr = toDateString(sun);
      if (!map[sunStr]) map[sunStr] = {};

      // 해당 출석 기록의 멤버가 속한 반 찾기
      const member = members.find((m) => m.id === r.member_id);
      if (member?.class_id) {
        map[sunStr][member.class_id] = true;
      }
    });
    return map;
  }, [attendanceRecords, members, classes]);

  // 내가 볼 반 목록 (강사: 담당반만, 관리자: 전체)
  const myClassIds = useMemo(() => {
    if (isAdmin) return classes.filter((c) => c.is_active).map((c) => c.id);
    if (assignedClassIds.length > 0) return assignedClassIds;
    return classes.filter((c) => c.is_active).map((c) => c.id);
  }, [isAdmin, assignedClassIds, classes]);

  // 일요일별 나의 출석 완료 여부 (담당 반 모두 입력되어야 true)
  const sundayAttendanceMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    // 모든 일요일에 대해 내 담당 반 모두 출석 기록 있는지 확인
    Object.keys(sundayClassAttendanceMap).forEach((sunStr) => {
      const classMap = sundayClassAttendanceMap[sunStr];
      map[sunStr] = myClassIds.length > 0 && myClassIds.every((cid) => classMap[cid]);
    });
    return map;
  }, [sundayClassAttendanceMap, myClassIds]);

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

  // 생일 축하 메시지
  const [birthdayTarget, setBirthdayTarget] = useState<typeof members[0] | null>(null);

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
      webAlert('일정 제목을 입력해주세요.');
      return;
    }
    if (!selectedDate) return;
    addSchedule({
      title: scheduleTitle.trim(),
      description: scheduleDesc || undefined,
      event_date: selectedDate,
      created_by: profile?.id,
    });
    webAlert('일정이 등록되었습니다.');
    setScheduleTitle('');
    setScheduleDesc('');
    setShowAddSchedule(false);
  };

  const handleDeleteSchedule = (id: string) => {
    if (webConfirm('이 일정을 삭제하시겠습니까?')) deleteSchedule(id);
  };

  // 캘린더 날짜 배열
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const todayStr = toDateString(today);

  // 생일 축하 메시지 생성
  const getBirthdayMessage = (member: typeof members[0]) => {
    // 날짜 파싱 (MM-DD 또는 YYYY-MM-DD)
    const parts = (member.date_of_birth || '').split('-');
    let month: number, day: number;
    if (parts.length === 3) { month = parseInt(parts[1]); day = parseInt(parts[2]); }
    else if (parts.length === 2) { month = parseInt(parts[0]); day = parseInt(parts[1]); }
    else { month = today.getMonth() + 1; day = today.getDate(); }

    const lunarPrefix = member.is_lunar_birthday ? '음력 ' : '';
    const dateStr = `${lunarPrefix}${month}월 ${day}일`;

    const cls = classes.find((c) => c.id === member.class_id);
    const classStr = cls ? `${cls.name} ` : '';
    const name = member.name;
    const rawTitle = member.title || '';
    const honorifics = ['강사', '목사', '전도사'];
    const title = honorifics.includes(rawTitle) ? `${rawTitle}님` : rawTitle;

    return `할렐루야 오늘 ${dateStr} ${classStr}${name} ${title}의 생일입니다~🎂
생일 축하드려요🎉🎉🎉

🎵당신은 사랑 받기 위해 태어난 사람
당신의 삶 속에서 그 사랑 받고 있지요
당신은 사랑 받기 위해 태어난 사람
당신의 삶 속에서 그 사랑 받고 있지요 🎉

🎵태초부터 시작된 하나님의 사랑은
우리의 만남을 통해 열매를 맺고
당신이 이 세상에 존재함으로 인해
우리에게 얼마나 큰 기쁨이 되는지 🎉

🎵당신은 사랑 받기 위해 태어난 사람
지금도 그 사랑 받고 있지요
당신은 사랑 받기위해 태어난 사람
지금도 그 사랑 받고있지요
지금도 그 사랑 받고있지요🎉`;
  };

  const copyBirthdayMessage = async (member: typeof members[0]) => {
    const msg = getBirthdayMessage(member);
    let copied = false;

    // 방법 1: Clipboard API (HTTPS 환경)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(msg);
        copied = true;
      } catch {}
    }

    // 방법 2: execCommand 폴백 (모바일 브라우저)
    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = msg;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {}
    }

    if (copied) {
      webAlert('생일 축하 메시지가 복사되었습니다.');
    } else {
      webAlert('자동 복사가 지원되지 않습니다.\n메시지를 길게 눌러 직접 복사해주세요.');
    }
  };

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
            <Text style={styles.summaryNumber}>{classes.filter((c) => c.is_active && !['군인', '졸업생'].includes(c.name)).length}</Text>
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
              const isSunday = dayOfWeek === 0;
              // 일요일 출석 상태: 담당반 전부 입력=green, 일부만=orange, 없음=red
              let sundayDotColor: string | null = null;
              if (isSunday && myClassIds.length > 0) {
                const classMap = sundayClassAttendanceMap[dateStr] || {};
                const doneCount = myClassIds.filter((cid) => classMap[cid]).length;
                if (doneCount === 0) sundayDotColor = COLORS.danger;
                else if (doneCount < myClassIds.length) sundayDotColor = COLORS.warning;
                else sundayDotColor = COLORS.success;
              }

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
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 1 }}>
                    {hasSchedule && <View style={styles.calDot} />}
                    {sundayDotColor && (
                      <View style={[styles.calDot, { backgroundColor: sundayDotColor }]} />
                    )}
                  </View>
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
                  <Button mode="contained" compact onPress={() => setShowAddSchedule(true)} labelStyle={{ fontSize: 12 }}>
                    추가
                  </Button>
                )}
              </View>

              {/* 일요일이면 출석 체크 상태 표시 */}
              {new Date(selectedDate).getDay() === 0 && (() => {
                const classMap = sundayClassAttendanceMap[selectedDate] || {};
                const activeClasses = classes.filter((c) => c.is_active);
                const relevantClasses = isAdmin
                  ? activeClasses
                  : activeClasses.filter((c) => assignedClassIds.includes(c.id));

                return (
                  <View style={{ marginBottom: 8 }}>
                    {relevantClasses.map((cls) => {
                      const hasRecord = classMap[cls.id] || false;
                      return (
                        <View key={cls.id} style={styles.sundayAttendanceRow}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hasRecord ? COLORS.success : COLORS.danger }} />
                          <Text style={{ flex: 1, fontSize: 14, color: COLORS.text }}>
                            {cls.name}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: hasRecord ? COLORS.success : COLORS.danger }}>
                            {hasRecord ? '입력 완료' : '미입력'}
                          </Text>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={{ alignItems: 'center', paddingVertical: 8, marginTop: 4, backgroundColor: COLORS.primary + '10', borderRadius: 8 }}
                      onPress={() => router.push('/(app)/(attendance)')}
                    >
                      <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>출석 체크 화면으로 이동 ›</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

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
                !((new Date(selectedDate)).getDay() === 0) && (
                  <Text style={styles.emptyText}>등록된 일정이 없습니다</Text>
                )
              )}
            </View>
          )}
        </Card.Content>
      </Card>


      {/* 생일자 */}
      <Card style={styles.card}>
        <Card.Title title="오늘의 생일자" />
        <Card.Content>
          {birthdayMembers.length > 0 ? (
            birthdayMembers.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => setBirthdayTarget(m)}>
                <View style={styles.birthdayRow}>
                  <Avatar.Text size={36} label={m.name.charAt(0)} style={{ backgroundColor: COLORS.secondary }} />
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName}>{m.name}</Text>
                    <Text style={styles.birthdayDate}>{(() => {
                      const p = m.date_of_birth!.split('-');
                      const mm = p.length === 3 ? parseInt(p[1]) : parseInt(p[0]);
                      const dd = p.length === 3 ? parseInt(p[2]) : parseInt(p[1]);
                      return `${m.is_lunar_birthday ? '음력 ' : ''}${mm}월 ${dd}일`;
                    })()}</Text>
                  </View>
                  <Text style={{ color: COLORS.primary, fontSize: 13 }}>축하 메시지 ›</Text>
                </View>
              </TouchableOpacity>
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
             
              onPress={() => router.push('/(app)/(attendance)')}
              style={styles.quickButton}
              compact
            >
              출석 체크
            </Button>
            <Button
              mode="contained"
             
              onPress={() => router.push('/(app)/(classes)')}
              style={[styles.quickButton, { backgroundColor: '#8E44AD' }]}
              compact
            >
              반별 조회
            </Button>
            <Button
              mode="contained"
             
              onPress={() => router.push('/(app)/(search)')}
              style={[styles.quickButton, { backgroundColor: COLORS.success }]}
              compact
            >
              회원 검색
            </Button>
            <Button
              mode="contained"
             
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

      {/* 생일 축하 메시지 모달 */}
      <Portal>
        <Modal visible={!!birthdayTarget} onDismiss={() => setBirthdayTarget(null)} contentContainerStyle={styles.birthdayModal}>
          {birthdayTarget && (
            <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.birthdayModalTitle}>🎂 생일 축하 메시지</Text>
              <View style={styles.birthdayMessageBox}>
                <Text style={styles.birthdayMessageText}>{getBirthdayMessage(birthdayTarget)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Button mode="outlined" onPress={() => setBirthdayTarget(null)} style={{ flex: 1 }}>닫기</Button>
                <Button mode="contained" onPress={() => copyBirthdayMessage(birthdayTarget)} style={{ flex: 1 }}>메시지 복사</Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>

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
  sundayAttendanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 10, marginBottom: 8, backgroundColor: '#F8F9FA', borderRadius: 8 },
  modal: { backgroundColor: '#FFF', margin: 24, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  // 생일 축하 모달
  birthdayModal: { backgroundColor: '#FFF', margin: 16, padding: 20, borderRadius: 16 },
  birthdayModalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  birthdayMessageBox: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F5A62340' },
  birthdayMessageText: { fontSize: 15, lineHeight: 24, color: COLORS.text, userSelect: 'text' } as any,
});
