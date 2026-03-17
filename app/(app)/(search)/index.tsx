import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar, Avatar, Chip, Divider } from 'react-native-paper';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { formatDate, calculateAge } from '../../../src/lib/utils';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { searchMembers, getAttendanceByMember, getMembersByFamily, classes, familyGroups } = useDataStore();

  const results = useMemo(() => (query.length > 0 ? searchMembers(query) : []), [query]);

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
    // 상세 보기
    const attendanceSummary = ATTENDANCE_TYPES.map((t) => ({
      ...t,
      count: memberAttendance.filter((a) => a.attendance_type === t.key).length,
    }));
    const totalPoints = memberAttendance.reduce((sum, a) => sum + a.points, 0);

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedMemberId(null)} style={styles.backButton}>
          <Text style={styles.backText}>← 검색으로 돌아가기</Text>
        </TouchableOpacity>

        {/* 기본 정보 */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileSection}>
            <Avatar.Text size={64} label={selectedMember.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedMember.name}</Text>
              {selectedMember.date_of_birth && (
                <Text style={styles.profileDetail}>
                  {formatDate(selectedMember.date_of_birth)} ({calculateAge(selectedMember.date_of_birth)}세)
                </Text>
              )}
              {selectedMember.phone && <Text style={styles.profileDetail}>{selectedMember.phone}</Text>}
              {memberClass && (
                <Chip compact style={styles.classChip}>{memberClass.name}</Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 출석 요약 */}
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

        {/* 가족 정보 */}
        {familyGroup && (
          <Card style={styles.card}>
            <Card.Title title={`가족: ${familyGroup.family_name}`} />
            <Card.Content>
              {familyMembers.length > 0 ? (
                familyMembers.map((fm) => (
                  <TouchableOpacity
                    key={fm.id}
                    onPress={() => setSelectedMemberId(fm.id)}
                    style={styles.familyRow}
                  >
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

        {/* 출석 이력 */}
        <Card style={styles.card}>
          <Card.Title title="최근 출석 이력" />
          <Card.Content>
            {memberAttendance.slice(0, 10).map((record) => {
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

  return (
    <ScrollView style={styles.container}>
      <Searchbar
        placeholder="이름 또는 연락처로 검색"
        value={query}
        onChangeText={setQuery}
        style={styles.searchBar}
      />

      {query.length > 0 && (
        <Text style={styles.resultCount}>검색 결과: {results.length}명</Text>
      )}

      {results.map((member) => {
        const cls = classes.find((c) => c.id === member.class_id);
        return (
          <TouchableOpacity key={member.id} onPress={() => setSelectedMemberId(member.id)}>
            <Card style={styles.resultCard}>
              <Card.Content style={styles.resultRow}>
                <Avatar.Text size={40} label={member.name.charAt(0)} style={{ backgroundColor: COLORS.primary }} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{member.name}</Text>
                  <Text style={styles.resultDetail}>
                    {cls?.name || '미배정'} {member.phone ? `| ${member.phone}` : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}

      {query.length > 0 && results.length === 0 && (
        <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
      )}

      {query.length === 0 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>이름 또는 연락처를 입력하여</Text>
          <Text style={styles.hintText}>회원 정보를 검색하세요</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { margin: 16, borderRadius: 12, elevation: 2 },
  resultCount: { marginHorizontal: 20, marginBottom: 8, fontSize: 13, color: COLORS.textSecondary },
  resultCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultInfo: { marginLeft: 12, flex: 1 },
  resultName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  resultDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
  hintContainer: { alignItems: 'center', paddingTop: 60 },
  hintText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  backButton: { padding: 16 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  profileDetail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  classChip: { marginTop: 6, alignSelf: 'flex-start' },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  familyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  familyName: { marginLeft: 12, fontSize: 15, color: COLORS.text },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  historyDate: { fontSize: 14, color: COLORS.text },
});
