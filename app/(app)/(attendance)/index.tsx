import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Checkbox, Divider, Chip, IconButton } from 'react-native-paper';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { AttendanceType, Member } from '../../../src/types';
import { supabase } from '../../../src/lib/supabase';
import {
  getSundayOfWeek, getWeekDates, shiftWeek, formatWeekRange,
  formatShortDate, toDateString, getDayOfWeek, webAlert, webConfirm,
} from '../../../src/lib/utils';

export default function AttendanceScreen() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const isInstructor = useAuthStore((s) => s.isInstructor)();
  const assignedClassIds = useAuthStore((s) => s.getAssignedClassIds)();
  const { members, classes, attendanceRecords, addAttendance, removeAttendance, getAttendanceByDateAndType, addMember, loadMembers } = useDataStore();

  // 강사 프로필 로드 + 멤버 레코드 보장
  const [instructorMembers, setInstructorMembers] = useState<Record<string, string>>({}); // classId -> memberId[]
  useEffect(() => {
    const ensureInstructorMembers = async () => {
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, display_name, phone, assigned_class_ids')
        .eq('role', 'instructor');
      if (!instructors) return;

      let needsReload = false;
      for (const inst of instructors) {
        // 이미 멤버 레코드가 있는지 확인
        const existing = members.find((m) => m.profile_id === inst.id);
        if (!existing) {
          // 멤버 레코드 생성
          const firstClassId = inst.assigned_class_ids?.[0] || null;
          const { data } = await supabase.from('members').insert({
            name: inst.display_name + ' (강사)',
            phone: inst.phone || null,
            class_id: firstClassId,
            profile_id: inst.id,
            is_active: true,
          }).select().single();
          if (data) needsReload = true;
        }
      }
      if (needsReload) await loadMembers();
    };
    ensureInstructorMembers();
  }, []);

  // 기간 선택: 년도 + 상반기/하반기
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedHalf, setSelectedHalf] = useState(currentHalf);

  const periodStart = `${selectedYear}-${selectedHalf === 1 ? '01' : '07'}-01`;
  const periodEnd = `${selectedYear}-${selectedHalf === 1 ? '06' : '12'}-31`;
  const periodLabel = `${selectedYear}년 ${selectedHalf === 1 ? '상반기' : '하반기'}`;

  // 주간 기준 일요일
  const [currentSunday, setCurrentSunday] = useState(() => getSundayOfWeek(new Date()));
  const [showHistory, setShowHistory] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  // 이번 주 금요일/일요일 날짜
  const weekDates = useMemo(() => getWeekDates(currentSunday), [currentSunday]);

  // 각 유형별 체크 상태
  const [checkedCholya, setCheckedCholya] = useState<Set<string>>(new Set());
  const [checkedJeja, setCheckedJeja] = useState<Set<string>>(new Set());
  const [checkedJuil, setCheckedJuil] = useState<Set<string>>(new Set());

  // 기존 출석 기록
  const existingCholya = useMemo(
    () => new Set(getAttendanceByDateAndType(weekDates.friday, '철야').map((a) => a.member_id)),
    [weekDates.friday, attendanceRecords]
  );
  const existingJeja = useMemo(
    () => new Set(getAttendanceByDateAndType(weekDates.sunday, '제자교육').map((a) => a.member_id)),
    [weekDates.sunday, attendanceRecords]
  );
  const existingJuil = useMemo(
    () => new Set(getAttendanceByDateAndType(weekDates.sunday, '주일예배').map((a) => a.member_id)),
    [weekDates.sunday, attendanceRecords]
  );

  // 강사는 담당 반만, 관리자는 전체
  const visibleClasses = useMemo(() => {
    const active = classes.filter((c) => c.is_active);
    if (isAdmin) return active;
    if (assignedClassIds.length > 0) return active.filter((c) => assignedClassIds.includes(c.id));
    return active;
  }, [classes, isAdmin, assignedClassIds]);

  // ============ 출석 기록 미입력 주차 계산 (담당 반 + 기간 기준) ============
  const missingWeeks = useMemo(() => {
    const missing: { sunday: Date; fridayStr: string; sundayStr: string; label: string }[] = [];

    // 내가 볼 반의 멤버 ID 목록
    const myMemberIds = new Set(
      members
        .filter((m) => m.is_active && visibleClasses.some((c) => c.id === m.class_id))
        .map((m) => m.id)
    );

    // 기간 내 모든 일요일 순회
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);
    const todayDate = new Date();
    // 기간 시작일의 일요일부터
    let sun = getSundayOfWeek(pStart);
    // 시작일보다 이전이면 다음 주로
    if (sun < pStart) sun = shiftWeek(sun, 1);

    while (sun <= pEnd && sun <= todayDate) {
      const dates = getWeekDates(sun);

      const hasAny = attendanceRecords.some((a) => {
        return myMemberIds.has(a.member_id) &&
          (a.attendance_date === dates.friday || a.attendance_date === dates.sunday);
      });

      if (!hasAny) {
        missing.push({
          sunday: new Date(sun),
          fridayStr: dates.friday,
          sundayStr: dates.sunday,
          label: formatWeekRange(sun),
        });
      }
      sun = shiftWeek(sun, 1);
    }
    return missing.reverse(); // 최신순
  }, [attendanceRecords, members, visibleClasses, periodStart, periodEnd]);

  const toggleCheck = (
    memberId: string,
    checked: Set<string>,
    setChecked: React.Dispatch<React.SetStateAction<Set<string>>>,
    existing: Set<string>,
  ) => {
    if (existing.has(memberId) && (isAdmin || isInstructor)) {
      if (webConfirm('이미 출석 처리된 항목을 취소하시겠습니까?')) {
        const type: AttendanceType = checked === checkedCholya ? '철야' : checked === checkedJeja ? '제자교육' : '주일예배';
        const date = type === '철야' ? weekDates.friday : weekDates.sunday;
        const record = attendanceRecords.find(
          (a) => a.member_id === memberId && a.attendance_type === type && a.attendance_date === date
        );
        if (record) removeAttendance(record.id);
      }
      return;
    }
    if (existing.has(memberId)) return;

    const next = new Set(checked);
    if (next.has(memberId)) next.delete(memberId);
    else next.add(memberId);
    setChecked(next);
  };

  const handleSubmit = () => {
    let count = 0;

    checkedCholya.forEach((id) => {
      addAttendance(id, '철야', weekDates.friday, profile?.id);
      count++;
    });
    checkedJeja.forEach((id) => {
      addAttendance(id, '제자교육', weekDates.sunday, profile?.id);
      count++;
    });
    checkedJuil.forEach((id) => {
      addAttendance(id, '주일예배', weekDates.sunday, profile?.id);
      count++;
    });

    if (count === 0) {
      webAlert('출석 체크할 인원을 선택해주세요.');
      return;
    }

    webAlert(`${count}건의 출석이 등록되었습니다.`);
    setCheckedCholya(new Set());
    setCheckedJeja(new Set());
    setCheckedJuil(new Set());
  };

  // 주간 이동
  const goWeek = (dir: number) => {
    setCurrentSunday((prev) => shiftWeek(prev, dir));
    setCheckedCholya(new Set());
    setCheckedJeja(new Set());
    setCheckedJuil(new Set());
  };

  const goToWeek = (sunday: Date) => {
    setCurrentSunday(sunday);
    setCheckedCholya(new Set());
    setCheckedJeja(new Set());
    setCheckedJuil(new Set());
    setShowMissing(false);
  };

  const totalNewChecks = checkedCholya.size + checkedJeja.size + checkedJuil.size;

  // 출석 이력 (선택된 기간 내)
  const recentRecords = useMemo(
    () => attendanceRecords
      .filter((r) => r.attendance_date >= periodStart && r.attendance_date <= periodEnd)
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
      .slice(0, 50),
    [attendanceRecords, periodStart, periodEnd]
  );

  if (showHistory) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => setShowHistory(false)}>출석 입력</Button>
          <Text style={styles.headerTitle}>출석 이력</Text>
        </View>
        {recentRecords.map((record) => {
          const member = members.find((m) => m.id === record.member_id);
          const typeInfo = ATTENDANCE_TYPES.find((t) => t.key === record.attendance_type);
          return (
            <Card key={record.id} style={styles.historyCard}>
              <Card.Content style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyName}>{member?.name || '알 수 없음'}</Text>
                  <Text style={styles.historyDate}>{record.attendance_date} ({getDayOfWeek(record.attendance_date)})</Text>
                </View>
                <Chip
                  style={{ backgroundColor: (typeInfo?.color || '#999') + '20' }}
                  textStyle={{ color: typeInfo?.color, fontSize: 12 }}
                  compact
                >
                  {record.attendance_type}
                </Chip>
                {(isAdmin || isInstructor) && (
                  <IconButton
                    icon="close-circle" size={18} iconColor={COLORS.danger}
                    onPress={() => {
                      if (webConfirm('이 출석 기록을 삭제하시겠습니까?')) {
                        removeAttendance(record.id);
                      }
                    }}
                  />
                )}
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ============ 출석 기록 미입력 화면 ============
  if (showMissing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Button icon="arrow-left" onPress={() => setShowMissing(false)}>출석 입력</Button>
          <Text style={styles.headerTitle}>출석 기록 미입력</Text>
        </View>

        {missingWeeks.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>최근 8주 내 미입력 주차가 없습니다.</Text>
            </Card.Content>
          </Card>
        ) : (
          missingWeeks.map((week) => (
            <TouchableOpacity key={week.sundayStr} onPress={() => goToWeek(week.sunday)}>
              <Card style={[styles.missingCard]}>
                <Card.Content style={styles.missingRow}>
                  <View style={styles.missingDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missingLabel}>{week.label}</Text>
                    <Text style={styles.missingDesc}>출석 기록이 없습니다</Text>
                  </View>
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>입력하기 ›</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // 멤버 체크리스트 렌더링 함수
  const renderMemberChecklist = (
    title: string,
    date: string,
    dayLabel: string,
    color: string,
    checked: Set<string>,
    setChecked: React.Dispatch<React.SetStateAction<Set<string>>>,
    existing: Set<string>,
  ) => (
    <>
      <View style={[styles.typeHeader, { backgroundColor: color + '15' }]}>
        <Text style={[styles.typeTitle, { color }]}>{title}</Text>
        <Text style={styles.typeDate}>{date} ({dayLabel})</Text>
      </View>

      {visibleClasses.map((cls) => {
        const classMembers = members.filter((m) => m.class_id === cls.id && m.is_active);
        if (classMembers.length === 0) return null;

        const checkedCount = classMembers.filter((m) => checked.has(m.id) || existing.has(m.id)).length;

        return (
          <View key={`${title}-${cls.id}`}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.classCount}>{checkedCount}/{classMembers.length}</Text>
            </View>
            {classMembers.map((member) => {
              const isExisting = existing.has(member.id);
              const isChecked = checked.has(member.id);
              return (
                <View key={member.id} style={styles.memberRow}>
                  <Checkbox
                    status={isExisting || isChecked ? 'checked' : 'unchecked'}
                    onPress={() => toggleCheck(member.id, checked, setChecked, existing)}
                    color={isExisting ? COLORS.success : color}
                  />
                  <Text style={[styles.memberName, isExisting && { color: COLORS.success }]}>
                    {member.name}
                    {isExisting ? ' ✓' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );

  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 2; y--) yearOptions.push(y);

  return (
    <ScrollView style={styles.container}>
      {/* 기간 선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.periodTitle}>기간 선택</Text>
          <View style={styles.periodRow}>
            {yearOptions.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.periodBtn, selectedYear === y && styles.periodBtnActive]}
                onPress={() => setSelectedYear(y)}
              >
                <Text style={[styles.periodBtnText, selectedYear === y && styles.periodBtnTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[styles.periodBtn, { flex: 1 }, selectedHalf === 1 && styles.periodBtnActive]}
              onPress={() => setSelectedHalf(1)}
            >
              <Text style={[styles.periodBtnText, selectedHalf === 1 && styles.periodBtnTextActive]}>상반기 (1~6월)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, { flex: 1 }, selectedHalf === 2 && styles.periodBtnActive]}
              onPress={() => setSelectedHalf(2)}
            >
              <Text style={[styles.periodBtnText, selectedHalf === 2 && styles.periodBtnTextActive]}>하반기 (7~12월)</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* 강사 안내 */}
      {!isAdmin && assignedClassIds.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#E8F4FD' }]}>
          <Card.Content>
            <Text style={{ color: COLORS.primary, fontSize: 13 }}>
              담당 제자반의 출석만 관리할 수 있습니다.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* 주간 선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.weekRow}>
            <Button mode="outlined" onPress={() => goWeek(-1)} compact>◀ 이전주</Button>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.weekTitle}>주간 출석</Text>
              <Text style={styles.weekRange}>{formatWeekRange(currentSunday)}</Text>
            </View>
            <Button mode="outlined" onPress={() => goWeek(1)} compact>다음주 ▶</Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionRow}>
        <Button mode="text" icon="history" onPress={() => setShowHistory(true)} compact>
          출석 이력
        </Button>
        <Button
          mode="text"
          icon="alert-circle-outline"
          onPress={() => setShowMissing(true)}
          compact
          textColor={missingWeeks.length > 0 ? COLORS.danger : COLORS.textSecondary}
        >
          미입력 {missingWeeks.length > 0 ? `(${missingWeeks.length})` : ''}
        </Button>
      </View>

      {/* 철야 - 금요일 */}
      <Card style={styles.card}>
        <Card.Content>
          {renderMemberChecklist('철야', weekDates.friday, '금', '#8E44AD', checkedCholya, setCheckedCholya, existingCholya)}
        </Card.Content>
      </Card>

      {/* 제자교육 - 일요일 */}
      <Card style={styles.card}>
        <Card.Content>
          {renderMemberChecklist('제자교육', weekDates.sunday, '일', '#2980B9', checkedJeja, setCheckedJeja, existingJeja)}
        </Card.Content>
      </Card>

      {/* 주일예배 - 일요일 */}
      <Card style={styles.card}>
        <Card.Content>
          {renderMemberChecklist('주일예배', weekDates.sunday, '일', '#27AE60', checkedJuil, setCheckedJuil, existingJuil)}
        </Card.Content>
      </Card>

      {/* 제출 */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        contentStyle={styles.submitContent}
        disabled={totalNewChecks === 0}
      >
        출석 등록 ({totalNewChecks}건)
      </Button>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  weekRange: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 8 },
  typeHeader: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  typeTitle: { fontSize: 16, fontWeight: 'bold' },
  typeDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  className: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  classCount: { fontSize: 12, color: COLORS.textSecondary },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  memberName: { fontSize: 14, color: COLORS.text },
  submitButton: { margin: 16, borderRadius: 12 },
  submitContent: { paddingVertical: 8 },
  historyCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  // 기간 선택
  periodTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  periodBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  periodBtnTextActive: { color: '#FFF' },
  // 미입력 스타일
  missingCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: COLORS.danger },
  missingRow: { flexDirection: 'row', alignItems: 'center' },
  missingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, marginRight: 12 },
  missingLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  missingDesc: { fontSize: 12, color: COLORS.danger, marginTop: 2 },
});
