import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable, Divider } from 'react-native-paper';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';

function getRankLabel(rank: number): string {
  return `${rank}`;
}

export default function RankingsScreen() {
  const [mode, setMode] = useState('individual');
  const { getIndividualRankings, getClassRankings, members, attendanceRecords, classes } = useDataStore();

  const individualRankings = useMemo(() => getIndividualRankings(), [attendanceRecords, members]);
  const classRankings = useMemo(() => getClassRankings(), [attendanceRecords, members, classes]);

  // 개인별 상세 통계
  const individualStats = useMemo(() => {
    return members
      .filter((m) => m.is_active)
      .map((m) => {
        const records = attendanceRecords.filter((a) => a.member_id === m.id);
        const cls = classes.find((c) => c.id === m.class_id);
        return {
          id: m.id,
          name: m.name,
          class_name: cls?.name || '미배정',
          cholya: records.filter((r) => r.attendance_type === '철야').length,
          jeja: records.filter((r) => r.attendance_type === '제자교육').length,
          juil: records.filter((r) => r.attendance_type === '주일예배').length,
          total: records.reduce((sum, r) => sum + r.points, 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [members, attendanceRecords, classes]);

  // 전체 통계 요약
  const totalStats = useMemo(() => {
    const totalMembers = members.filter((m) => m.is_active).length;
    const cholya = attendanceRecords.filter((r) => r.attendance_type === '철야').length;
    const jeja = attendanceRecords.filter((r) => r.attendance_type === '제자교육').length;
    const juil = attendanceRecords.filter((r) => r.attendance_type === '주일예배').length;
    return { totalMembers, cholya, jeja, juil, total: cholya + jeja + juil };
  }, [members, attendanceRecords]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'individual', label: '개인별' },
            { value: 'class', label: '반별' },
            { value: 'stats', label: '통계' },
          ]}
        />
      </View>

      {/* ============ 개인별 순위 ============ */}
      {mode === 'individual' && (
        <Card style={styles.card}>
          <Card.Title title="개인별 출석 순위" subtitle="총 출석 점수 기준" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={{ flex: 0.4 }}>등수</DataTable.Title>
                <DataTable.Title style={{ flex: 1.2 }}>이름</DataTable.Title>
                <DataTable.Title style={{ flex: 1 }}>제자반</DataTable.Title>
                <DataTable.Title numeric style={{ flex: 0.6 }}>점수</DataTable.Title>
              </DataTable.Header>

              {individualRankings.map((item) => (
                <DataTable.Row key={item.member_id}>
                  <DataTable.Cell style={{ flex: 0.4 }}>
                    <Text style={[styles.rankText, item.point_rank <= 3 && styles.topRank]}>
                      {getRankLabel(item.point_rank)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={styles.nameText}>{item.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    <Text style={styles.classText}>{item.class_name || '-'}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 0.6 }}>
                    <Text style={styles.scoreText}>{item.total_points}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* ============ 반별 순위 ============ */}
      {mode === 'class' && (
        <>
          <Card style={styles.card}>
            <Card.Title title="제자반별 출석 순위" subtitle="점수등수 + 출석률등수 합산" />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 0.4 }}>등수</DataTable.Title>
                  <DataTable.Title style={{ flex: 1.2 }}>제자반</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.5 }}>인원</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.6 }}>총점</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.7 }}>출석률</DataTable.Title>
                </DataTable.Header>

                {classRankings.map((item) => (
                  <DataTable.Row key={item.class_id}>
                    <DataTable.Cell style={{ flex: 0.4 }}>
                      <Text style={[styles.rankText, item.final_rank <= 3 && styles.topRank]}>
                        {getRankLabel(item.final_rank)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1.2 }}>
                      <Text style={styles.nameText}>{item.class_name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text>{item.member_count}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.6 }}>
                      <Text style={styles.scoreText}>{item.total_points}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.7 }}>
                      <Text>{item.attendance_rate}%</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="순위 산정 규칙" />
            <Card.Content>
              <Text style={styles.ruleText}>1. 총 출석 점수로 등수 산정 (A)</Text>
              <Text style={styles.ruleText}>2. 총 출석률로 등수 산정 (B)</Text>
              <Text style={styles.ruleText}>3. A + B 합산 점수가 작은 순서대로 최종 등수</Text>
              <View style={styles.ruleDetail}>
                {classRankings.map((item) => (
                  <View key={item.class_id} style={styles.ruleRow}>
                    <Text style={styles.ruleClassName}>{item.class_name}</Text>
                    <Text style={styles.ruleCalc}>
                      {item.points_rank} + {item.rate_rank} = {item.combined_score}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {/* ============ 통계 ============ */}
      {mode === 'stats' && (
        <>
          {/* 전체 요약 */}
          <Card style={styles.card}>
            <Card.Title title="전체 출석 통계" />
            <Card.Content>
              <View style={styles.statSummaryRow}>
                <View style={[styles.statBox, { backgroundColor: '#8E44AD15' }]}>
                  <Text style={[styles.statNumber, { color: '#8E44AD' }]}>{totalStats.cholya}</Text>
                  <Text style={styles.statLabel}>철야</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#2980B915' }]}>
                  <Text style={[styles.statNumber, { color: '#2980B9' }]}>{totalStats.jeja}</Text>
                  <Text style={styles.statLabel}>제자교육</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#27AE6015' }]}>
                  <Text style={[styles.statNumber, { color: '#27AE60' }]}>{totalStats.juil}</Text>
                  <Text style={styles.statLabel}>주일예배</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#F5A62315' }]}>
                  <Text style={[styles.statNumber, { color: '#F5A623' }]}>{totalStats.total}</Text>
                  <Text style={styles.statLabel}>합계</Text>
                </View>
              </View>
              <Text style={styles.statSubtext}>전체 인원: {totalStats.totalMembers}명</Text>
            </Card.Content>
          </Card>

          {/* 반별 통계 */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석 점수" />
            <Card.Content>
              {classRankings.map((cls) => {
                const classMembers = members.filter((m) => m.class_id === cls.class_id && m.is_active);
                const classRecords = attendanceRecords.filter((a) => classMembers.some((m) => m.id === a.member_id));
                const cholya = classRecords.filter((r) => r.attendance_type === '철야').length;
                const jeja = classRecords.filter((r) => r.attendance_type === '제자교육').length;
                const juil = classRecords.filter((r) => r.attendance_type === '주일예배').length;

                return (
                  <View key={cls.class_id} style={styles.classStatBlock}>
                    <Text style={styles.classStatName}>{cls.class_name} ({cls.member_count}명)</Text>
                    <View style={styles.classStatRow}>
                      <View style={styles.classStatItem}>
                        <Text style={[styles.classStatNum, { color: '#8E44AD' }]}>{cholya}</Text>
                        <Text style={styles.classStatLabel}>철야</Text>
                      </View>
                      <View style={styles.classStatItem}>
                        <Text style={[styles.classStatNum, { color: '#2980B9' }]}>{jeja}</Text>
                        <Text style={styles.classStatLabel}>제자교육</Text>
                      </View>
                      <View style={styles.classStatItem}>
                        <Text style={[styles.classStatNum, { color: '#27AE60' }]}>{juil}</Text>
                        <Text style={styles.classStatLabel}>주일예배</Text>
                      </View>
                      <View style={styles.classStatItem}>
                        <Text style={[styles.classStatNum, { color: COLORS.text }]}>{cls.total_points}</Text>
                        <Text style={styles.classStatLabel}>합계</Text>
                      </View>
                    </View>
                    <Divider style={{ marginTop: 8 }} />
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {/* 개인별 상세 통계 */}
          <Card style={styles.card}>
            <Card.Title title="개인별 점수 상세" />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 1 }}>이름</DataTable.Title>
                  <DataTable.Title style={{ flex: 0.8 }}>반</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.5 }}>철야</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.5 }}>제자</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.5 }}>주일</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.5 }}>합계</DataTable.Title>
                </DataTable.Header>

                {individualStats.map((item) => (
                  <DataTable.Row key={item.id}>
                    <DataTable.Cell style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13 }}>{item.name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{item.class_name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text style={{ color: '#8E44AD' }}>{item.cholya}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text style={{ color: '#2980B9' }}>{item.jeja}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text style={{ color: '#27AE60' }}>{item.juil}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text style={{ fontWeight: 'bold' }}>{item.total}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        </>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  toggleContainer: { padding: 16 },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  topRank: { color: COLORS.secondary, fontSize: 18 },
  nameText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  classText: { fontSize: 13, color: COLORS.textSecondary },
  scoreText: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  ruleText: { fontSize: 14, color: COLORS.text, marginBottom: 6, lineHeight: 22 },
  ruleDetail: { marginTop: 12, backgroundColor: COLORS.background, borderRadius: 8, padding: 12 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ruleClassName: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  ruleCalc: { fontSize: 12, color: COLORS.textSecondary },
  // 통계 스타일
  statSummaryRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  statSubtext: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 13, marginTop: 12 },
  classStatBlock: { marginBottom: 8 },
  classStatName: { fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 6 },
  classStatRow: { flexDirection: 'row', gap: 8 },
  classStatItem: { flex: 1, alignItems: 'center' },
  classStatNum: { fontSize: 18, fontWeight: 'bold' },
  classStatLabel: { fontSize: 10, color: COLORS.textSecondary },
});
