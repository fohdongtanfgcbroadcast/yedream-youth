import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Checkbox, SegmentedButtons, Divider, Chip, Banner } from 'react-native-paper';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { AttendanceType } from '../../../src/types';

export default function AttendanceScreen() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const assignedClassId = useAuthStore((s) => s.getAssignedClassId)();
  const { members, classes, attendanceRecords, addAttendance, getAttendanceByDateAndType } = useDataStore();

  const [selectedType, setSelectedType] = useState<AttendanceType>('주일예배');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedMembers, setCheckedMembers] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const existingAttendance = useMemo(
    () => getAttendanceByDateAndType(selectedDate, selectedType),
    [selectedDate, selectedType, attendanceRecords]
  );

  const alreadyChecked = useMemo(
    () => new Set(existingAttendance.map((a) => a.member_id)),
    [existingAttendance]
  );

  // 강사는 담당 반만, 관리자는 전체
  const visibleClasses = useMemo(() => {
    const active = classes.filter((c) => c.is_active);
    if (isAdmin) return active;
    if (assignedClassId) return active.filter((c) => c.id === assignedClassId);
    return active;
  }, [classes, isAdmin, assignedClassId]);

  const toggleMember = (memberId: string) => {
    const next = new Set(checkedMembers);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    setCheckedMembers(next);
  };

  const toggleClassAll = (classId: string) => {
    const classMembers = members.filter((m) => m.class_id === classId && m.is_active);
    const allChecked = classMembers.every((m) => checkedMembers.has(m.id) || alreadyChecked.has(m.id));
    const next = new Set(checkedMembers);
    classMembers.forEach((m) => {
      if (!alreadyChecked.has(m.id)) {
        if (allChecked) {
          next.delete(m.id);
        } else {
          next.add(m.id);
        }
      }
    });
    setCheckedMembers(next);
  };

  const handleSubmit = () => {
    if (checkedMembers.size === 0) {
      Alert.alert('알림', '출석 체크할 인원을 선택해주세요.');
      return;
    }
    checkedMembers.forEach((memberId) => {
      addAttendance(memberId, selectedType, selectedDate, profile?.id);
    });
    Alert.alert('완료', `${checkedMembers.size}명의 출석이 등록되었습니다.`);
    setCheckedMembers(new Set());
  };

  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setCheckedMembers(new Set());
  };

  const recentRecords = useMemo(
    () => [...attendanceRecords]
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
      .slice(0, 20),
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
                  <Text style={styles.historyDate}>{record.attendance_date}</Text>
                </View>
                <Chip
                  style={{ backgroundColor: (typeInfo?.color || '#999') + '20' }}
                  textStyle={{ color: typeInfo?.color, fontSize: 12 }}
                  compact
                >
                  {record.attendance_type}
                </Chip>
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 강사 안내 배너 */}
      {!isAdmin && assignedClassId && (
        <Card style={[styles.card, { backgroundColor: '#E8F4FD' }]}>
          <Card.Content>
            <Text style={{ color: COLORS.primary, fontSize: 13 }}>
              담당 제자반의 출석만 관리할 수 있습니다.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* 출석 유형 선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>출석 유형</Text>
          <SegmentedButtons
            value={selectedType}
            onValueChange={(v) => { setSelectedType(v as AttendanceType); setCheckedMembers(new Set()); }}
            buttons={ATTENDANCE_TYPES.map((t) => ({ value: t.key, label: t.label }))}
          />
        </Card.Content>
      </Card>

      {/* 날짜 선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>날짜</Text>
          <View style={styles.dateRow}>
            <Button mode="outlined" onPress={() => adjustDate(-1)} compact>◀ 이전</Button>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Button mode="outlined" onPress={() => adjustDate(1)} compact>다음 ▶</Button>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="text"
        icon="history"
        onPress={() => setShowHistory(true)}
        style={{ marginHorizontal: 16 }}
      >
        출석 이력 보기
      </Button>

      {/* 제자반별 체크리스트 (강사는 담당 반만) */}
      {visibleClasses.map((cls) => {
        const classMembers = members.filter((m) => m.class_id === cls.id && m.is_active);
        if (classMembers.length === 0) return null;

        const allChecked = classMembers.every((m) => checkedMembers.has(m.id) || alreadyChecked.has(m.id));

        return (
          <Card key={cls.id} style={styles.card}>
            <Card.Content>
              <View style={styles.classHeader}>
                <Text style={styles.className}>{cls.name} ({classMembers.length}명)</Text>
                <Button mode="text" onPress={() => toggleClassAll(cls.id)} compact>
                  {allChecked ? '전체 해제' : '전체 선택'}
                </Button>
              </View>
              <Divider style={{ marginBottom: 8 }} />
              {classMembers.map((member) => {
                const isExisting = alreadyChecked.has(member.id);
                const isChecked = checkedMembers.has(member.id);
                return (
                  <View key={member.id} style={styles.memberRow}>
                    <Checkbox
                      status={isExisting ? 'checked' : isChecked ? 'checked' : 'unchecked'}
                      onPress={() => !isExisting && toggleMember(member.id)}
                      disabled={isExisting}
                    />
                    <Text style={[styles.memberName, isExisting && styles.disabledText]}>
                      {member.name}
                      {isExisting ? ' (출석완료)' : ''}
                    </Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        );
      })}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        contentStyle={styles.submitContent}
        disabled={checkedMembers.size === 0}
      >
        출석 등록 ({checkedMembers.size}명)
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  memberName: { fontSize: 15, color: COLORS.text },
  disabledText: { color: COLORS.disabled },
  submitButton: { margin: 16, borderRadius: 12 },
  submitContent: { paddingVertical: 8 },
  historyCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },
});
