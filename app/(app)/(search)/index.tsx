import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Text, Card, Avatar, Chip, Divider, Button } from 'react-native-paper';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { supabase } from '../../../src/lib/supabase';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [titleFilter, setTitleFilter] = useState('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, searchMembers, getAttendanceByMember, getMembersByFamily, classes, familyGroups } = useDataStore();

  // 강사 정보 로드
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, assigned_class_ids').in('role', ['instructor', 'pastor', 'evangelist']);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          if (p.assigned_class_ids) {
            p.assigned_class_ids.forEach((cid: string) => { map[cid] = p.display_name; });
          }
        });
        setInstructors(map);
      }
    };
    load();
  }, []);

  // 필터링된 결과
  const results = useMemo(() => {
    let list = query.length > 0 ? searchMembers(query) : members.filter((m) => m.is_active);
    if (classFilter !== 'all') {
      if (classFilter === 'unassigned') list = list.filter((m) => !m.class_id);
      else list = list.filter((m) => m.class_id === classFilter);
    }
    if (titleFilter !== 'all') {
      list = list.filter((m) => m.title === titleFilter);
    }
    return list;
  }, [query, classFilter, titleFilter, members]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return useDataStore.getState().getMemberById(selectedMemberId);
  }, [selectedMemberId]);

  const memberAttendance = useMemo(
    () => (selectedMemberId ? getAttendanceByMember(selectedMemberId) : []),
    [selectedMemberId]
  );

  const familyMembers = useMemo(() => {
    if (!selectedMember?.family_group_id) return [];
    return getMembersByFamily(selectedMember.family_group_id).filter((m) => m.id !== selectedMemberId);
  }, [selectedMember]);

  const memberClass = useMemo(
    () => classes.find((c) => c.id === selectedMember?.class_id),
    [selectedMember]
  );

  const familyGroup = useMemo(
    () => familyGroups.find((f) => f.id === selectedMember?.family_group_id),
    [selectedMember]
  );

  if (selectedMember) {
    const attendanceSummary = ATTENDANCE_TYPES.map((t) => ({
      ...t,
      count: memberAttendance.filter((a) => a.attendance_type === t.key).length,
    }));
    const totalPoints = memberAttendance.reduce((sum, a) => sum + a.points, 0);
    const instructorName = memberClass ? instructors[memberClass.id] : null;

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedMemberId(null)} style={styles.backButton}>
          <Text style={styles.backText}>← 검색으로 돌아가기</Text>
        </TouchableOpacity>

        <Card style={styles.card}>
          <Card.Content style={styles.profileSection}>
            <Avatar.Text size={64} label={selectedMember.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedMember.name}</Text>
              {selectedMember.title && (
                <Text style={styles.profileDetail}>{selectedMember.title}</Text>
              )}
              {selectedMember.date_of_birth && (
                <Text style={styles.profileDetail}>
                  {(() => {
                    const p = selectedMember.date_of_birth!.split('-');
                    const mm = p.length === 3 ? parseInt(p[1]) : parseInt(p[0]);
                    const dd = p.length === 3 ? parseInt(p[2]) : parseInt(p[1]);
                    return `${selectedMember.is_lunar_birthday ? '음력 ' : ''}${mm}월 ${dd}일`;
                  })()}
                </Text>
              )}
              {selectedMember.phone && <Text style={styles.profileDetail}>{selectedMember.phone}</Text>}
              {memberClass && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <Chip compact>{memberClass.name}</Chip>
                  {instructorName && (
                    <Text style={{ fontSize: 13, color: COLORS.primary }}>담당: {instructorName}</Text>
                  )}
                </View>
              )}
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

        {familyGroup && (
          <Card style={styles.card}>
            <Card.Title title={`가족: ${familyGroup.family_name}`} />
            <Card.Content>
              {familyMembers.length > 0 ? (
                familyMembers.map((fm) => (
                  <TouchableOpacity key={fm.id} onPress={() => setSelectedMemberId(fm.id)} style={styles.familyRow}>
                    <Avatar.Text size={32} label={fm.name.charAt(0)} style={{ backgroundColor: COLORS.secondary }} />
                    <Text style={styles.familyName}>{fm.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>같은 가족 그룹 멤버가 없습니다</Text>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Title title="최근 출석 이력" />
          <Card.Content>
            {memberAttendance.slice(0, 10).map((record) => {
              const typeInfo = ATTENDANCE_TYPES.find((t) => t.key === record.attendance_type);
              return (
                <View key={record.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{record.attendance_date}</Text>
                  <Chip compact style={{ backgroundColor: (typeInfo?.color || '#999') + '20' }} textStyle={{ color: typeInfo?.color, fontSize: 11 }}>
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="이름 또는 제자반으로 검색"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        <Text style={styles.searchIcon}>⌕</Text>
      </View>

      {/* 소속별 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 6, maxHeight: 40 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Button mode={classFilter === 'all' ? 'contained' : 'outlined'} compact onPress={() => setClassFilter('all')} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>전체</Button>
          {classes.filter((c) => c.is_active).map((c) => (
            <Button key={c.id} mode={classFilter === c.id ? 'contained' : 'outlined'} compact onPress={() => setClassFilter(c.id)} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>{c.name}</Button>
          ))}
          <Button mode={classFilter === 'unassigned' ? 'contained' : 'outlined'} compact onPress={() => setClassFilter('unassigned')} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>미배정</Button>
        </View>
      </ScrollView>

      {/* 직책별 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8, maxHeight: 40 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Button mode={titleFilter === 'all' ? 'contained' : 'outlined'} compact onPress={() => setTitleFilter('all')} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>전체</Button>
          {['목사', '전도사', '강사', '청년', '기타'].map((t) => (
            <Button key={t} mode={titleFilter === t ? 'contained' : 'outlined'} compact onPress={() => setTitleFilter(t)} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>{t}</Button>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.resultCount}>{results.length}명</Text>

      {results.map((member) => {
        const cls = classes.find((c) => c.id === member.class_id);
        const instName = cls ? instructors[cls.id] : null;
        return (
          <TouchableOpacity key={member.id} onPress={() => setSelectedMemberId(member.id)}>
            <Card style={styles.resultCard}>
              <Card.Content style={styles.resultRow}>
                <Avatar.Text size={40} label={member.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{member.name} {member.title ? `(${member.title})` : ''}</Text>
                  <Text style={styles.resultDetail}>
                    {cls?.name || '기타'}{instName ? ` | 담당: ${instName}` : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}

      {results.length === 0 && (
        <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 10, backgroundColor: '#FFF', borderRadius: 12, elevation: 2, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, height: 48, outlineStyle: 'none' } as any,
  searchIcon: { fontSize: 20, marginLeft: 8, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingLeft: 12 },
  resultCount: { marginHorizontal: 20, marginBottom: 8, fontSize: 13, color: COLORS.textSecondary },
  resultCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultInfo: { marginLeft: 12, flex: 1 },
  resultName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  resultDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
  backButton: { padding: 16 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  profileDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  familyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  familyName: { marginLeft: 12, fontSize: 15, color: COLORS.text },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  historyDate: { fontSize: 14, color: COLORS.text },
});
