import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable, Button, Divider } from 'react-native-paper';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ATTENDANCE_TYPES } from '../../../src/lib/constants';
import { getSundayOfWeek, getWeekDates, toDateString, shiftWeek, webAlert } from '../../../src/lib/utils';
import * as XLSX from 'xlsx';

function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return '#FFD700'; // 금
    case 2: return '#C0C0C0'; // 은
    case 3: return '#CD7F32'; // 동
    case 4: return '#4A90D9';
    case 5: return '#8E44AD';
    default: return '#7F8C8D';
  }
}

// 기간 내 전체 주차 수 계산 (오늘까지의 모든 일요일)
function countWeeksInPeriod(startDate: string, endDate: string): number {
  const today = new Date();
  const pStart = new Date(startDate);
  const pEnd = new Date(endDate);
  const limit = pEnd < today ? pEnd : today;

  let sun = getSundayOfWeek(pStart);
  if (sun < pStart) sun = shiftWeek(sun, 1);

  let count = 0;
  while (sun <= limit) {
    count++;
    sun = shiftWeek(sun, 1);
  }
  return Math.max(count, 1);
}

export default function RankingsScreen() {
  const [mode, setMode] = useState('individual');
  const [showAllIndividual, setShowAllIndividual] = useState(false);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const { members, attendanceRecords, classes } = useDataStore();

  // 기간 선택: 년도 + 상반기/하반기
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = now.getMonth() < 6 ? 1 : 2;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedHalf, setSelectedHalf] = useState(currentHalf);

  const periodStart = `${selectedYear}-${selectedHalf === 1 ? '01' : '07'}-01`;
  const periodEnd = `${selectedYear}-${selectedHalf === 1 ? '06' : '12'}-31`;
  const periodLabel = `${selectedYear}년 ${selectedHalf === 1 ? '상반기 (1~6월)' : '하반기 (7~12월)'}`;

  // 기간 필터링된 출석 기록
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.attendance_date >= periodStart && r.attendance_date <= periodEnd
    );
  }, [attendanceRecords, periodStart, periodEnd]);

  // 기간 내 전체 주차 수 (오늘까지)
  const weeksInPeriod = useMemo(
    () => countWeeksInPeriod(periodStart, periodEnd),
    [periodStart, periodEnd]
  );

  // 기간 필터된 개인별 순위
  const individualRankings = useMemo(() => {
    const stats = members
      .filter((m) => m.is_active)
      .map((m) => {
        const records = filteredRecords.filter((a) => a.member_id === m.id);
        const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
        const daysAttended = new Set(records.map((r) => r.attendance_date)).size;
        const cls = classes.find((c) => c.id === m.class_id);
        return {
          member_id: m.id, name: m.name, class_id: m.class_id,
          class_name: cls?.name, total_points: totalPoints,
          days_attended: daysAttended, point_rank: 0,
        };
      })
      .sort((a, b) => b.total_points - a.total_points);

    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) rank = i + 1;
      stats[i].point_rank = rank;
    }
    return stats;
  }, [filteredRecords, members, classes]);

  // 기간 필터된 반별 순위 (출석률 = 총점 / (인원*3*주차) * 100)
  const classRankings = useMemo(() => {
    const stats = classes
      .filter((c) => c.is_active)
      .map((c) => {
        const classMembers = members.filter((m) => m.class_id === c.id && m.is_active);
        const memberCount = classMembers.length;
        const classRecords = filteredRecords.filter((a) => classMembers.some((m) => m.id === a.member_id));
        const totalPoints = classRecords.reduce((sum, r) => sum + r.points, 0);
        const maxPossible = memberCount * 3 * weeksInPeriod;
        const attendanceRate = maxPossible > 0 ? Math.round((totalPoints / maxPossible) * 100) : 0;

        return {
          class_id: c.id, class_name: c.name, member_count: memberCount,
          total_points: totalPoints, attendance_rate: Math.min(attendanceRate, 100),
          points_rank: 0, rate_rank: 0, combined_score: 0, final_rank: 0,
        };
      });

    stats.sort((a, b) => b.total_points - a.total_points);
    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) rank = i + 1;
      stats[i].points_rank = rank;
    }
    stats.sort((a, b) => b.attendance_rate - a.attendance_rate);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].attendance_rate < stats[i - 1].attendance_rate) rank = i + 1;
      stats[i].rate_rank = rank;
    }
    stats.forEach((s) => (s.combined_score = s.points_rank + s.rate_rank));
    stats.sort((a, b) => a.combined_score - b.combined_score);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].combined_score > stats[i - 1].combined_score) rank = i + 1;
      stats[i].final_rank = rank;
    }
    return stats;
  }, [filteredRecords, members, classes, weeksInPeriod]);

  // 개인별 상세 통계
  const individualStats = useMemo(() => {
    return members
      .filter((m) => m.is_active)
      .map((m) => {
        const records = filteredRecords.filter((a) => a.member_id === m.id);
        const cls = classes.find((c) => c.id === m.class_id);
        return {
          id: m.id, name: m.name, class_name: cls?.name || '미배정',
          cholya: records.filter((r) => r.attendance_type === '철야').length,
          jeja: records.filter((r) => r.attendance_type === '제자교육').length,
          juil: records.filter((r) => r.attendance_type === '주일예배').length,
          total: records.reduce((sum, r) => sum + r.points, 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [members, filteredRecords, classes]);

  // 전체 통계 요약
  const totalStats = useMemo(() => {
    const totalMembers = members.filter((m) => m.is_active).length;
    const cholya = filteredRecords.filter((r) => r.attendance_type === '철야').length;
    const jeja = filteredRecords.filter((r) => r.attendance_type === '제자교육').length;
    const juil = filteredRecords.filter((r) => r.attendance_type === '주일예배').length;
    return { totalMembers, cholya, jeja, juil, total: cholya + jeja + juil };
  }, [members, filteredRecords]);

  // 엑셀 저장
  const exportToExcel = (type: 'individual' | 'class') => {
    try {
      let ws;
      let filename;
      if (type === 'individual') {
        const data = individualStats.map((item, idx) => ({
          '순위': idx + 1, '이름': item.name, '제자반': item.class_name,
          '철야': item.cholya, '제자교육': item.jeja, '주일예배': item.juil, '합계': item.total,
        }));
        ws = XLSX.utils.json_to_sheet(data);
        filename = `개인별_출석_${periodLabel.replace(/ /g, '_')}.xlsx`;
      } else {
        const data = classRankings.map((item) => ({
          '등수': item.final_rank, '제자반': item.class_name, '인원': item.member_count,
          '총점': item.total_points, '출석률': `${item.attendance_rate}%`,
        }));
        ws = XLSX.utils.json_to_sheet(data);
        filename = `반별_출석_${periodLabel.replace(/ /g, '_')}.xlsx`;
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, filename);
      webAlert( `${filename} 파일이 저장되었습니다.`);
    } catch (e: any) {
      webAlert( '엑셀 저장에 실패했습니다: ' + e.message);
    }
  };

  // 년도 선택 옵션
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
              style={[styles.periodBtn, styles.periodBtnWide, selectedHalf === 1 && styles.periodBtnActive]}
              onPress={() => setSelectedHalf(1)}
            >
              <Text style={[styles.periodBtnText, selectedHalf === 1 && styles.periodBtnTextActive]}>상반기 (1~6월)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, styles.periodBtnWide, selectedHalf === 2 && styles.periodBtnActive]}
              onPress={() => setSelectedHalf(2)}
            >
              <Text style={[styles.periodBtnText, selectedHalf === 2 && styles.periodBtnTextActive]}>하반기 (7~12월)</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.periodInfo}>{periodLabel} | 출석 {weeksInPeriod}주</Text>
        </Card.Content>
      </Card>

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
                <DataTable.Row key={item.member_id} style={item.point_rank <= 3 ? styles.highlightRow : undefined}>
                  <DataTable.Cell style={{ flex: 0.4 }}>
                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.point_rank) + '20', borderColor: getRankColor(item.point_rank) }]}>
                      <Text style={[styles.rankText, { color: getRankColor(item.point_rank) }]}>{item.point_rank}</Text>
                    </View>
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
                  <DataTable.Row key={item.class_id} style={item.final_rank <= 2 ? styles.highlightRow : undefined}>
                    <DataTable.Cell style={{ flex: 0.4 }}>
                      <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.final_rank) + '20', borderColor: getRankColor(item.final_rank) }]}>
                        <Text style={[styles.rankText, { color: getRankColor(item.final_rank) }]}>{item.final_rank}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1.2 }}>
                      <Text style={[styles.nameText, item.final_rank <= 2 && { fontWeight: 'bold' }]}>{item.class_name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.5 }}><Text>{item.member_count}</Text></DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.6 }}>
                      <Text style={[styles.scoreText, item.final_rank <= 2 && { fontSize: 17 }]}>{item.total_points}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.7 }}><Text>{item.attendance_rate}%</Text></DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Title title="순위 산정 규칙" />
            <Card.Content>
              <Text style={styles.ruleText}>1. 총 출석 점수로 등수 산정 (A)</Text>
              <Text style={styles.ruleText}>2. 출석률로 등수 산정 (B)</Text>
              <Text style={styles.ruleText}>  출석률 = 총점 / (인원 x 3항목 x 주차수) x 100</Text>
              <Text style={styles.ruleText}>3. A + B 합산 점수가 작은 순서대로 최종 등수</Text>
              <View style={styles.ruleDetail}>
                {classRankings.map((item) => (
                  <View key={item.class_id} style={styles.ruleRow}>
                    <Text style={styles.ruleClassName}>{item.class_name}</Text>
                    <Text style={styles.ruleCalc}>{item.points_rank} + {item.rate_rank} = {item.combined_score}</Text>
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
              <Text style={styles.statSubtext}>전체 인원: {totalStats.totalMembers}명 | {weeksInPeriod}주간</Text>
            </Card.Content>
          </Card>

          {/* 반별 출석 총점 비교 (세로 막대 - 총점만) */}
          <Card style={styles.card}>
            <Card.Title title="반별 출석 점수 비교" />
            <Card.Content>
              {(() => {
                const maxTotal = Math.max(...classRankings.map((d) => d.total_points), 1);
                const barMaxHeight = 160;
                return (
                  <View style={styles.verticalBarContainer}>
                    {classRankings.map((cls) => {
                      const h = (cls.total_points / maxTotal) * barMaxHeight;
                      return (
                        <View key={cls.class_id} style={styles.verticalBarItem}>
                          <Text style={styles.verticalBarValue}>{cls.total_points}</Text>
                          <View style={[styles.verticalBarTrack, { height: barMaxHeight }]}>
                            <View style={{ flex: 1 }} />
                            <View style={[styles.verticalBarSegment, { height: h, backgroundColor: COLORS.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
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

          {/* 반별 출석률 */}
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
            <Card.Title title="개인별 점수 상세" subtitle={`총 ${individualStats.length}명`} />
            <Card.Content>
              {(showAllIndividual ? individualStats : individualStats.slice(0, 5)).map((item, idx) => (
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
                  {idx < (showAllIndividual ? individualStats.length : Math.min(individualStats.length, 5)) - 1 && <Divider style={{ marginVertical: 8 }} />}
                </View>
              ))}
              {individualStats.length > 5 && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setShowAllIndividual(!showAllIndividual)}
                >
                  <Text style={styles.expandButtonText}>
                    {showAllIndividual ? '접기 ▲' : `전체 보기 (${individualStats.length}명) ▼`}
                  </Text>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>

          {/* 반별 상세 */}
          <Card style={styles.card}>
            <Card.Title title="반별 점수 상세" />
            <Card.Content>
              {classRankings.map((item, idx) => {
                const cm = members.filter((m) => m.class_id === item.class_id && m.is_active);
                const cr = filteredRecords.filter((a) => cm.some((m) => m.id === a.member_id));
                return (
                  <View key={item.class_id}>
                    <View style={styles.individualDetailRow}>
                      <View style={styles.individualDetailHeader}>
                        <Text style={styles.individualDetailRank}>{item.final_rank}</Text>
                        <Text style={styles.individualDetailName}>{item.class_name}</Text>
                        <Text style={styles.individualDetailClass}>{item.member_count}명 | 출석률 {item.attendance_rate}%</Text>
                      </View>
                      <View style={styles.individualDetailScores}>
                        <View style={[styles.individualScoreBox, { backgroundColor: '#8E44AD15' }]}>
                          <Text style={[styles.individualScoreValue, { color: '#8E44AD' }]}>{cr.filter((r) => r.attendance_type === '철야').length}</Text>
                          <Text style={styles.individualScoreLabel}>철야</Text>
                        </View>
                        <View style={[styles.individualScoreBox, { backgroundColor: '#2980B915' }]}>
                          <Text style={[styles.individualScoreValue, { color: '#2980B9' }]}>{cr.filter((r) => r.attendance_type === '제자교육').length}</Text>
                          <Text style={styles.individualScoreLabel}>제자교육</Text>
                        </View>
                        <View style={[styles.individualScoreBox, { backgroundColor: '#27AE6015' }]}>
                          <Text style={[styles.individualScoreValue, { color: '#27AE60' }]}>{cr.filter((r) => r.attendance_type === '주일예배').length}</Text>
                          <Text style={styles.individualScoreLabel}>주일예배</Text>
                        </View>
                        <View style={[styles.individualScoreBox, { backgroundColor: '#F5A62315' }]}>
                          <Text style={[styles.individualScoreValue, { color: '#F5A623', fontWeight: 'bold' }]}>{item.total_points}</Text>
                          <Text style={styles.individualScoreLabel}>합계</Text>
                        </View>
                      </View>
                    </View>
                    {idx < classRankings.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                  </View>
                );
              })}
            </Card.Content>
          </Card>

          {isAdmin && (
            <Card style={styles.card}>
              <Card.Title title="데이터 내보내기" subtitle="엑셀 파일로 저장" />
              <Card.Content>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button mode="contained" onPress={() => exportToExcel('individual')} style={{ flex: 1, borderRadius: 8 }} buttonColor="#27AE60">개인별 저장</Button>
                  <Button mode="contained" onPress={() => exportToExcel('class')} style={{ flex: 1, borderRadius: 8 }} buttonColor="#2980B9">반별 저장</Button>
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
  toggleContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  // 기간 선택
  periodTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  periodBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  periodBtnWide: { flex: 1 },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  periodBtnTextActive: { color: '#FFF' },
  periodInfo: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  // 순위
  rankBadge: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: 'bold' },
  highlightRow: { backgroundColor: '#FEF3E215' },
  nameText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  classText: { fontSize: 13, color: COLORS.textSecondary },
  scoreText: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  ruleText: { fontSize: 14, color: COLORS.text, marginBottom: 6, lineHeight: 22 },
  ruleDetail: { marginTop: 12, backgroundColor: COLORS.background, borderRadius: 8, padding: 12 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ruleClassName: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  ruleCalc: { fontSize: 12, color: COLORS.textSecondary },
  statSummaryRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  statSubtext: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 13, marginTop: 12 },
  verticalBarContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: 8 },
  verticalBarItem: { alignItems: 'center', flex: 1 },
  verticalBarValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  verticalBarTrack: { width: 36, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  verticalBarSegment: { width: '100%' },
  verticalBarLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  individualDetailRow: { paddingVertical: 4 },
  individualDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  individualDetailRank: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary, width: 28 },
  individualDetailName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  individualDetailClass: { fontSize: 12, color: COLORS.textSecondary },
  individualDetailScores: { flexDirection: 'row', gap: 6 },
  individualScoreBox: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  individualScoreValue: { fontSize: 18, fontWeight: '600' },
  individualScoreLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  expandButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8, backgroundColor: COLORS.background, borderRadius: 8 },
  expandButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
