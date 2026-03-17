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

          {/* 전체 유형별 비율 그래프 */}
          <Card style={styles.card}>
            <Card.Title title="출석 유형별 비율" />
            <Card.Content>
              <View style={styles.pieChart}>
                {[
                  { label: '철야', value: totalStats.cholya, color: '#8E44AD' },
                  { label: '제자교육', value: totalStats.jeja, color: '#2980B9' },
                  { label: '주일예배', value: totalStats.juil, color: '#27AE60' },
                ].map((item) => {
                  const pct = totalStats.total > 0 ? Math.round((item.value / totalStats.total) * 100) : 0;
                  return (
                    <View key={item.label} style={styles.pieRow}>
                      <View style={styles.pieLabelRow}>
                        <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                        <Text style={styles.pieLabel}>{item.label}</Text>
                        <Text style={styles.pieValue}>{item.value}건 ({pct}%)</Text>
                      </View>
                      <View style={styles.pieBarBg}>
                        <View style={[styles.pieBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* 반별 막대 그래프 */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석 점수 비교" />
            <Card.Content>
              {(() => {
                const classData = classRankings.map((cls) => {
                  const cm = members.filter((m) => m.class_id === cls.class_id && m.is_active);
                  const cr = attendanceRecords.filter((a) => cm.some((m) => m.id === a.member_id));
                  return {
                    name: cls.class_name,
                    cholya: cr.filter((r) => r.attendance_type === '철야').length,
                    jeja: cr.filter((r) => r.attendance_type === '제자교육').length,
                    juil: cr.filter((r) => r.attendance_type === '주일예배').length,
                    total: cls.total_points,
                  };
                });
                const maxTotal = Math.max(...classData.map((d) => d.total), 1);

                return (
                  <View>
                    {/* 범례 */}
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8E44AD' }]} /><Text style={styles.legendText}>철야</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2980B9' }]} /><Text style={styles.legendText}>제자교육</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#27AE60' }]} /><Text style={styles.legendText}>주일예배</Text></View>
                    </View>

                    {classData.map((cls) => (
                      <View key={cls.name} style={styles.barGroup}>
                        <Text style={styles.barLabel}>{cls.name}</Text>
                        {/* 스택 바 */}
                        <View style={styles.stackBarBg}>
                          <View style={[styles.stackBarSegment, { width: `${(cls.cholya / maxTotal) * 100}%`, backgroundColor: '#8E44AD' }]} />
                          <View style={[styles.stackBarSegment, { width: `${(cls.jeja / maxTotal) * 100}%`, backgroundColor: '#2980B9' }]} />
                          <View style={[styles.stackBarSegment, { width: `${(cls.juil / maxTotal) * 100}%`, backgroundColor: '#27AE60' }]} />
                        </View>
                        <Text style={styles.barTotal}>{cls.total}점</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </Card.Content>
          </Card>

          {/* 개인별 TOP 10 막대 그래프 */}
          <Card style={styles.card}>
            <Card.Title title="개인별 출석 TOP 10" />
            <Card.Content>
              {(() => {
                const top10 = individualStats.slice(0, 10);
                const maxPts = Math.max(...top10.map((d) => d.total), 1);

                return top10.map((item, idx) => (
                  <View key={item.id} style={styles.barGroup}>
                    <View style={styles.barLabelRow}>
                      <Text style={[styles.barRank, idx < 3 && { color: COLORS.secondary, fontWeight: 'bold' }]}>{idx + 1}</Text>
                      <Text style={styles.barName}>{item.name}</Text>
                      <Text style={styles.barClassName}>{item.class_name}</Text>
                    </View>
                    <View style={styles.stackBarBg}>
                      <View style={[styles.stackBarSegment, { width: `${(item.cholya / maxPts) * 100}%`, backgroundColor: '#8E44AD' }]} />
                      <View style={[styles.stackBarSegment, { width: `${(item.jeja / maxPts) * 100}%`, backgroundColor: '#2980B9' }]} />
                      <View style={[styles.stackBarSegment, { width: `${(item.juil / maxPts) * 100}%`, backgroundColor: '#27AE60' }]} />
                    </View>
                    <Text style={styles.barTotal}>{item.total}점</Text>
                  </View>
                ));
              })()}
            </Card.Content>
          </Card>

          {/* 반별 출석률 비교 */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석률" />
            <Card.Content>
              {classRankings.map((cls) => (
                <View key={cls.class_id} style={styles.barGroup}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barName}>{cls.class_name}</Text>
                    <Text style={styles.barClassName}>{cls.attendance_rate}%</Text>
                  </View>
                  <View style={styles.stackBarBg}>
                    <View style={[styles.stackBarSegment, {
                      width: `${cls.attendance_rate}%`,
                      backgroundColor: cls.attendance_rate >= 80 ? '#27AE60' : cls.attendance_rate >= 50 ? '#F5A623' : '#E74C3C',
                      borderRadius: 6,
                    }]} />
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* 개인별 상세 표 */}
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
  // 비율 바 차트
  pieChart: { gap: 12 },
  pieRow: {},
  pieLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pieDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  pieLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  pieValue: { fontSize: 13, color: COLORS.textSecondary },
  pieBarBg: { height: 20, backgroundColor: '#F0F0F0', borderRadius: 10, overflow: 'hidden' },
  pieBarFill: { height: 20, borderRadius: 10 },
  // 범례
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  // 막대 그래프
  barGroup: { marginBottom: 12 },
  barLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  barRank: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, width: 20 },
  barName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  barClassName: { fontSize: 11, color: COLORS.textSecondary },
  barTotal: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginTop: 2, textAlign: 'right' },
  stackBarBg: { height: 24, backgroundColor: '#F0F0F0', borderRadius: 12, overflow: 'hidden', flexDirection: 'row' },
  stackBarSegment: { height: 24 },
});
