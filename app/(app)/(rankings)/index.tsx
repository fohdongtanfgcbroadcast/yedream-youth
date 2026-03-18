import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable, Button, Divider } from 'react-native-paper';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import * as XLSX from 'xlsx';

function getRankLabel(rank: number): string {
  return `${rank}`;
}

export default function RankingsScreen() {
  const [mode, setMode] = useState('individual');
  const isAdmin = useAuthStore((s) => s.isAdmin)();
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

  // 반별 상세 통계
  const classStats = useMemo(() => {
    return classRankings.map((cls) => {
      const cm = members.filter((m) => m.class_id === cls.class_id && m.is_active);
      const cr = attendanceRecords.filter((a) => cm.some((m) => m.id === a.member_id));
      return {
        ...cls,
        cholya: cr.filter((r) => r.attendance_type === '철야').length,
        jeja: cr.filter((r) => r.attendance_type === '제자교육').length,
        juil: cr.filter((r) => r.attendance_type === '주일예배').length,
      };
    });
  }, [classRankings, members, attendanceRecords]);

  // 전체 통계 요약
  const totalStats = useMemo(() => {
    const totalMembers = members.filter((m) => m.is_active).length;
    const cholya = attendanceRecords.filter((r) => r.attendance_type === '철야').length;
    const jeja = attendanceRecords.filter((r) => r.attendance_type === '제자교육').length;
    const juil = attendanceRecords.filter((r) => r.attendance_type === '주일예배').length;
    return { totalMembers, cholya, jeja, juil, total: cholya + jeja + juil };
  }, [members, attendanceRecords]);

  // 엑셀 저장 기능
  const exportToExcel = (type: 'individual' | 'class') => {
    try {
      let ws;
      let filename;

      if (type === 'individual') {
        const data = individualStats.map((item, idx) => ({
          '순위': idx + 1,
          '이름': item.name,
          '제자반': item.class_name,
          '철야': item.cholya,
          '제자교육': item.jeja,
          '주일예배': item.juil,
          '합계': item.total,
        }));
        ws = XLSX.utils.json_to_sheet(data);
        filename = `개인별_출석_상세_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        const data = classStats.map((item) => ({
          '등수': item.final_rank,
          '제자반': item.class_name,
          '인원': item.member_count,
          '철야': item.cholya,
          '제자교육': item.jeja,
          '주일예배': item.juil,
          '총점': item.total_points,
          '출석률': `${item.attendance_rate}%`,
        }));
        ws = XLSX.utils.json_to_sheet(data);
        filename = `반별_출석_상세_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // 웹에서 다운로드
      XLSX.writeFile(wb, filename);
      Alert.alert('완료', `${filename} 파일이 저장되었습니다.`);
    } catch (e: any) {
      Alert.alert('오류', '엑셀 저장에 실패했습니다: ' + e.message);
    }
  };

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

      {/* ============ 개인별 순위 (10등까지, 3등 강조) ============ */}
      {mode === 'individual' && (
        <Card style={styles.card}>
          <Card.Title title="개인별 출석 순위" subtitle="총 출석 점수 기준 (TOP 10)" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={{ flex: 0.4 }}>등수</DataTable.Title>
                <DataTable.Title style={{ flex: 1.2 }}>이름</DataTable.Title>
                <DataTable.Title style={{ flex: 1 }}>제자반</DataTable.Title>
                <DataTable.Title numeric style={{ flex: 0.6 }}>점수</DataTable.Title>
              </DataTable.Header>

              {individualRankings.slice(0, 10).map((item) => (
                <DataTable.Row
                  key={item.member_id}
                  style={item.point_rank <= 3 ? styles.highlightRow : undefined}
                >
                  <DataTable.Cell style={{ flex: 0.4 }}>
                    <Text style={[styles.rankText, item.point_rank <= 3 && styles.topRank3]}>
                      {item.point_rank <= 3 ? ['🥇', '🥈', '🥉'][item.point_rank - 1] : getRankLabel(item.point_rank)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={[styles.nameText, item.point_rank <= 3 && { fontWeight: 'bold' }]}>{item.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    <Text style={styles.classText}>{item.class_name || '-'}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 0.6 }}>
                    <Text style={[styles.scoreText, item.point_rank <= 3 && { fontSize: 17 }]}>{item.total_points}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* ============ 반별 순위 (모든 반, 2등 강조) ============ */}
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
                  <DataTable.Row
                    key={item.class_id}
                    style={item.final_rank <= 2 ? styles.highlightRow : undefined}
                  >
                    <DataTable.Cell style={{ flex: 0.4 }}>
                      <Text style={[styles.rankText, item.final_rank <= 2 && styles.topRank2]}>
                        {item.final_rank <= 2 ? ['🥇', '🥈'][item.final_rank - 1] : getRankLabel(item.final_rank)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1.2 }}>
                      <Text style={[styles.nameText, item.final_rank <= 2 && { fontWeight: 'bold' }]}>{item.class_name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}>
                      <Text>{item.member_count}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.6 }}>
                      <Text style={[styles.scoreText, item.final_rank <= 2 && { fontSize: 17 }]}>{item.total_points}</Text>
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

          {/* 반별 출석 점수 비교 (세로 막대 그래프) */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석 점수 비교" />
            <Card.Content>
              {(() => {
                const maxTotal = Math.max(...classStats.map((d) => d.total_points), 1);
                const barMaxHeight = 160;

                return (
                  <View>
                    {/* 범례 */}
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8E44AD' }]} /><Text style={styles.legendText}>철야</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2980B9' }]} /><Text style={styles.legendText}>제자교육</Text></View>
                      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#27AE60' }]} /><Text style={styles.legendText}>주일예배</Text></View>
                    </View>

                    {/* 세로 막대 */}
                    <View style={styles.verticalBarContainer}>
                      {classStats.map((cls) => {
                        const totalH = (cls.total_points / maxTotal) * barMaxHeight;
                        const cholyaH = cls.total_points > 0 ? (cls.cholya / cls.total_points) * totalH : 0;
                        const jejaH = cls.total_points > 0 ? (cls.jeja / cls.total_points) * totalH : 0;
                        const juilH = cls.total_points > 0 ? (cls.juil / cls.total_points) * totalH : 0;

                        return (
                          <View key={cls.class_id} style={styles.verticalBarItem}>
                            <Text style={styles.verticalBarValue}>{cls.total_points}</Text>
                            <View style={[styles.verticalBarTrack, { height: barMaxHeight }]}>
                              <View style={{ flex: 1 }} />
                              <View style={[styles.verticalBarSegment, { height: juilH, backgroundColor: '#27AE60' }]} />
                              <View style={[styles.verticalBarSegment, { height: jejaH, backgroundColor: '#2980B9' }]} />
                              <View style={[styles.verticalBarSegment, { height: cholyaH, backgroundColor: '#8E44AD', borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
                            </View>
                            <Text style={styles.verticalBarLabel}>{cls.class_name.replace('제자반 ', '')}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
            </Card.Content>
          </Card>

          {/* 반별 출석률 (세로 막대 그래프) */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석률" />
            <Card.Content>
              {(() => {
                const barMaxHeight = 140;
                return (
                  <View style={styles.verticalBarContainer}>
                    {classRankings.map((cls) => {
                      const h = (cls.attendance_rate / 100) * barMaxHeight;
                      const color = cls.attendance_rate >= 80 ? '#27AE60' : cls.attendance_rate >= 50 ? '#F5A623' : '#E74C3C';
                      return (
                        <View key={cls.class_id} style={styles.verticalBarItem}>
                          <Text style={[styles.verticalBarValue, { color }]}>{cls.attendance_rate}%</Text>
                          <View style={[styles.verticalBarTrack, { height: barMaxHeight }]}>
                            <View style={{ flex: 1 }} />
                            <View style={[styles.verticalBarSegment, { height: h, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
                          </View>
                          <Text style={styles.verticalBarLabel}>{cls.class_name.replace('제자반 ', '')}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </Card.Content>
          </Card>

          {/* 개인별 점수 상세 */}
          <Card style={styles.card}>
            <Card.Title title="개인별 점수 상세" />
            <Card.Content>
              {individualStats.map((item, idx) => (
                <View key={item.id}>
                  <View style={styles.individualDetailRow}>
                    <View style={styles.individualDetailHeader}>
                      <Text style={styles.individualDetailRank}>{idx + 1}</Text>
                      <Text style={styles.individualDetailName}>{item.name}</Text>
                      <Text style={styles.individualDetailClass}>{item.class_name}</Text>
                    </View>
                    <View style={styles.individualDetailScores}>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#8E44AD15' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#8E44AD' }]}>{item.cholya}</Text>
                        <Text style={styles.individualScoreLabel}>철야</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#2980B915' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#2980B9' }]}>{item.jeja}</Text>
                        <Text style={styles.individualScoreLabel}>제자교육</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#27AE6015' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#27AE60' }]}>{item.juil}</Text>
                        <Text style={styles.individualScoreLabel}>주일예배</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#F5A62315' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#F5A623', fontWeight: 'bold' }]}>{item.total}</Text>
                        <Text style={styles.individualScoreLabel}>합계</Text>
                      </View>
                    </View>
                  </View>
                  {idx < individualStats.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* 반별 상세 내역 */}
          <Card style={styles.card}>
            <Card.Title title="반별 점수 상세" />
            <Card.Content>
              {classStats.map((item, idx) => (
                <View key={item.class_id}>
                  <View style={styles.individualDetailRow}>
                    <View style={styles.individualDetailHeader}>
                      <Text style={styles.individualDetailRank}>{item.final_rank}</Text>
                      <Text style={styles.individualDetailName}>{item.class_name}</Text>
                      <Text style={styles.individualDetailClass}>{item.member_count}명 | 출석률 {item.attendance_rate}%</Text>
                    </View>
                    <View style={styles.individualDetailScores}>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#8E44AD15' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#8E44AD' }]}>{item.cholya}</Text>
                        <Text style={styles.individualScoreLabel}>철야</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#2980B915' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#2980B9' }]}>{item.jeja}</Text>
                        <Text style={styles.individualScoreLabel}>제자교육</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#27AE6015' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#27AE60' }]}>{item.juil}</Text>
                        <Text style={styles.individualScoreLabel}>주일예배</Text>
                      </View>
                      <View style={[styles.individualScoreBox, { backgroundColor: '#F5A62315' }]}>
                        <Text style={[styles.individualScoreValue, { color: '#F5A623', fontWeight: 'bold' }]}>{item.total_points}</Text>
                        <Text style={styles.individualScoreLabel}>합계</Text>
                      </View>
                    </View>
                  </View>
                  {idx < classStats.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* 엑셀 저장 (관리자만) */}
          {isAdmin && (
            <Card style={styles.card}>
              <Card.Title title="데이터 내보내기" subtitle="엑셀 파일로 저장" />
              <Card.Content>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    mode="contained"
                    icon="file-excel"
                    onPress={() => exportToExcel('individual')}
                    style={{ flex: 1, borderRadius: 8 }}
                    buttonColor="#27AE60"
                  >
                    개인별 저장
                  </Button>
                  <Button
                    mode="contained"
                    icon="file-excel"
                    onPress={() => exportToExcel('class')}
                    style={{ flex: 1, borderRadius: 8 }}
                    buttonColor="#2980B9"
                  >
                    반별 저장
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
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
  topRank3: { color: COLORS.secondary, fontSize: 20 },
  topRank2: { color: COLORS.secondary, fontSize: 20 },
  highlightRow: { backgroundColor: '#FEF3E215' },
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
  // 범례
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  // 세로 막대 그래프
  verticalBarContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: 8 },
  verticalBarItem: { alignItems: 'center', flex: 1 },
  verticalBarValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  verticalBarTrack: { width: 36, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  verticalBarSegment: { width: '100%' },
  verticalBarLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  // 개인별 상세
  individualDetailRow: { paddingVertical: 4 },
  individualDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  individualDetailRank: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, width: 28 },
  individualDetailName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  individualDetailClass: { fontSize: 12, color: COLORS.textSecondary },
  individualDetailScores: { flexDirection: 'row', gap: 6 },
  individualScoreBox: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  individualScoreValue: { fontSize: 18, fontWeight: '600' },
  individualScoreLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
});
