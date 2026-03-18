import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Chip, Divider, List } from 'react-native-paper';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { formatDate, calculateAge } from '../../../src/lib/utils';
import { supabase } from '../../../src/lib/supabase';
import { Profile } from '../../../src/types';

export default function ClassBrowseScreen() {
  const { members, classes, attendanceRecords } = useDataStore();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Record<string, string>>({});

  // 강사 이름 로드
  useEffect(() => {
    const loadInstructors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, assigned_class_ids')
        .eq('role', 'instructor');

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          if (p.assigned_class_ids) {
            p.assigned_class_ids.forEach((classId: string) => {
              map[classId] = p.display_name;
            });
          }
        });
        setInstructors(map);
      }
    };
    loadInstructors();
  }, []);

  const activeClasses = classes.filter((c) => c.is_active);

  const selectedClass = useMemo(
    () => activeClasses.find((c) => c.id === selectedClassId),
    [selectedClassId, activeClasses]
  );

  const classMembers = useMemo(
    () => selectedClassId ? members.filter((m) => m.class_id === selectedClassId && m.is_active) : [],
    [selectedClassId, members]
  );

  const selectedMember = useMemo(
    () => selectedMemberId ? members.find((m) => m.id === selectedMemberId) : null,
    [selectedMemberId, members]
  );

  const memberAttendance = useMemo(
    () => selectedMemberId
      ? attendanceRecords
          .filter((a) => a.member_id === selectedMemberId)
          .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
      : [],
    [selectedMemberId, attendanceRecords]
  );

  // 회원 상세 보기
  if (selectedMember) {
    const attendanceSummary = ATTENDANCE_TYPES.map((t) => ({
      ...t,
      count: memberAttendance.filter((a) => a.attendance_type === t.key).length,
    }));
    const totalPoints = memberAttendance.reduce((sum, a) => sum + a.points, 0);

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedMemberId(null)} style={styles.backButton}>
          <Text style={styles.backText}>← {selectedClass?.name} 목록으로</Text>
        </TouchableOpacity>

        <Card style={styles.card}>
          <Card.Content style={styles.profileSection}>
            <Avatar.Text size={64} label={selectedMember.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedMember.name}</Text>
              {selectedMember.date_of_birth && (
                <Text style={styles.profileDetail}>
                  {formatDate(selectedMember.date_of_birth)}
                </Text>
              )}
              {selectedMember.phone && <Text style={styles.profileDetail}>{selectedMember.phone}</Text>}
              {selectedClass && <Chip compact style={styles.classChip}>{selectedClass.name}</Chip>}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="출석 현황" subtitle={`총 ${totalPoints}점`} />
          <Card.Content>
            <View style={styles.statRow}>
              {attendanceSummary.map((item) => (
                <View key={item.key} style={[styles.statBox, { backgroundColor: item.color + '15' }]}>
                  <Text style={[styles.statNumber, { color: item.color }]}>{item.count}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="최근 출석 이력" />
          <Card.Content>
            {memberAttendance.slice(0, 15).map((record) => {
              const typeInfo = ATTENDANCE_TYPES.find((t) => t.key === record.attendance_type);
              return (
                <View key={record.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{record.attendance_date}</Text>
                  <Chip
                    compact
                    style={{ backgroundColor: (typeInfo?.color || '#999') + '20' }}
                    textStyle={{ color: typeInfo?.color, fontSize: 11 }}
                  >
                    {record.attendance_type}
                  </Chip>
                </View>
              );
            })}
            {memberAttendance.length === 0 && (
              <Text style={styles.emptyText}>출석 기록이 없습니다</Text>
            )}
          </Card.Content>
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // 반 멤버 목록
  if (selectedClass) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedClassId(null)} style={styles.backButton}>
          <Text style={styles.backText}>← 전체 제자반</Text>
        </TouchableOpacity>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.classTitle}>{selectedClass.name}</Text>
            {instructors[selectedClass.id] && (
              <Text style={styles.instructorName}>강사: {instructors[selectedClass.id]}</Text>
            )}
            <Text style={styles.classDesc}>{selectedClass.description || ''}</Text>
            <Text style={styles.classMemberCount}>{classMembers.length}명</Text>
          </Card.Content>
        </Card>

        {classMembers.map((member) => {
          const memberRecords = attendanceRecords.filter((a) => a.member_id === member.id);
          const totalPoints = memberRecords.reduce((sum, r) => sum + r.points, 0);
          return (
            <TouchableOpacity key={member.id} onPress={() => setSelectedMemberId(member.id)}>
              <Card style={styles.memberCard}>
                <Card.Content style={styles.memberRow}>
                  <Avatar.Text size={40} label={member.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberDetail}>
                      {member.phone || '연락처 없음'}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{totalPoints}점</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })}

        {classMembers.length === 0 && (
          <Text style={styles.emptyText}>배정된 회원이 없습니다</Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // 제자반 목록 (제자반 이름, 인원수, 강사 이름 3가지 항목)
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>제자반 목록</Text>

      {activeClasses.map((cls) => {
        const count = members.filter((m) => m.class_id === cls.id && m.is_active).length;
        const instructorName = instructors[cls.id] || '미배정';

        return (
          <TouchableOpacity key={cls.id} onPress={() => setSelectedClassId(cls.id)}>
            <Card style={styles.classCard}>
              <Card.Content>
                <Text style={styles.classCardTitle}>{cls.name}</Text>
                <Text style={styles.classCardDesc}>{count}명 | 강사: {instructorName}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* 미배정 회원 */}
      {(() => {
        const unassigned = members.filter((m) => !m.class_id && m.is_active);
        if (unassigned.length === 0) return null;
        return (
          <TouchableOpacity onPress={() => setSelectedClassId('unassigned')}>
            <Card style={[styles.classCard, { borderLeftColor: COLORS.warning, borderLeftWidth: 3 }]}>
              <Card.Content>
                <Text style={styles.classCardTitle}>미배정</Text>
                <Text style={styles.classCardDesc}>{unassigned.length}명</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })()}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, padding: 16, paddingBottom: 8 },
  backButton: { padding: 16, paddingBottom: 4 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  classCard: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, elevation: 2 },
  classRow: { flexDirection: 'row', alignItems: 'center' },
  classInfo: { flex: 1, marginLeft: 12 },
  classCardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  classCardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  classMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  classMetaItem: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  classMetaDivider: { fontSize: 14, color: COLORS.border, marginHorizontal: 8 },
  classMetaInstructor: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  classTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  instructorName: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  classDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  classMemberCount: { fontSize: 14, color: COLORS.text, marginTop: 4, fontWeight: '600' },
  memberCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  memberDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  pointsBadge: { backgroundColor: COLORS.primary + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pointsText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  profileDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  classChip: { marginTop: 6, alignSelf: 'flex-start' },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  historyDate: { fontSize: 14, color: COLORS.text },
});
