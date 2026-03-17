import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Checkbox, Divider, Chip, IconButton } from 'react-native-paper';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { AttendanceType } from '../../../src/types';
import {
  getSundayOfWeek, getWeekDates, shiftWeek, formatWeekRange,
  formatShortDate, toDateString, getDayOfWeek,
} from '../../../src/lib/utils';

export default function AttendanceScreen() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const isInstructor = useAuthStore((s) => s.isInstructor)();
  const assignedClassId = useAuthStore((s) => s.getAssignedClassId)();
  const { members, classes, attendanceRecords, addAttendance, removeAttendance, getAttendanceByDateAndType } = useDataStore();

  // 주간 기준 일요일
  const [currentSunday, setCurrentSunday] = useState(() => getSundayOfWeek(new Date()));
  const [showHistory, setShowHistory] = useState(false);

  // 이번 주 금요일/일요일 날짜
  const weekDates = useMemo(() => getWeekDates(currentSunday), [currentSunday]);

  // 각 유형별 체크 상태
  const [checkedCholya, setCheckedCholya] = useState<Set<string>>(new Set());     // 철야
  const [checkedJeja, setCheckedJeja] = useState<Set<string>>(new Set());         // 제자교육
  const [checkedJuil, setCheckedJuil] = useState<Set<string>>(new Set());         // 주일예배

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
    if (assignedClassId) return active.filter((c) => c.id === assignedClassId);
    return active;
  }, [classes, isAdmin, assignedClassId]);

  const toggleCheck = (
    memberId: string,
    checked: Set<string>,
    setChecked: React.Dispatch<React.SetStateAction<Set<string>>>,
    existing: Set<string>,
  ) => {
    // 관리자/강사는 기존 출석도 해제 가능 (수정)
    if (existing.has(memberId) && (isAdmin || isInstructor)) {
      Alert.alert('출석 수정', '이미 출석 처리된 항목을 취소하시겠습니까?', [
        { text: '아니오', style: 'cancel' },
        {
          text: '출석 취소', style: 'destructive',
          onPress: () => {
            // 해당 출석 기록 삭제
            const type: AttendanceType = checked === checkedCholya ? '철야' : checked === checkedJeja ? '제자교육' : '주일예배';
            const date = type === '철야' ? weekDates.friday : weekDates.sunday;
            const record = attendanceRecords.find(
              (a) => a.member_id === memberId && a.attendance_type === type && a.attendance_date === date
            );
            if (record) removeAttendance(record.id);
          },
        },
      ]);
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
      Alert.alert('알림', '출석 체크할 인원을 선택해주세요.');
      return;
    }

    Alert.alert('완료', `${count}건의 출석이 등록되었습니다.`);
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

  const totalNewChecks = checkedCholya.size + checkedJeja.size + checkedJuil.size;

  // 출석 이력
  const recentRecords = useMemo(
    () => [...attendanceRecords]
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
      .slice(0, 30),
    [attendanceRecords]
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
                      Alert.alert('삭제', '이 출석 기록을 삭제하시겠습니까?', [
                        { text: '취소', style: 'cancel' },
                        { text: '삭제', style: 'destructive', onPress: () => removeAttendance(record.id) },
                      ]);
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

  return (
    <ScrollView style={styles.container}>
      {/* 강사 안내 */}
      {!isAdmin && assignedClassId && (
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

      <Button mode="text" icon="history" onPress={() => setShowHistory(true)} style={{ marginHorizontal: 16 }}>
        출석 이력 보기 / 수정
      </Button>

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
});
