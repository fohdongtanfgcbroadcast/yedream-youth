import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable } from 'react-native-paper';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS } from '../../../src/lib/constants';

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '1';
  if (rank === 2) return '2';
  if (rank === 3) return '3';
  return `${rank}`;
}

export default function RankingsScreen() {
  const [mode, setMode] = useState('individual');
  const getIndividualRankings = useDataStore((s) => s.getIndividualRankings);
  const getClassRankings = useDataStore((s) => s.getClassRankings);

  const individualRankings = useMemo(() => getIndividualRankings(), []);
  const classRankings = useMemo(() => getClassRankings(), []);

  return (
    <ScrollView style={styles.container}>
      {/* 모드 선택 */}
      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'individual', label: '개인별 순위' },
            { value: 'class', label: '반별 순위' },
          ]}
        />
      </View>

      {mode === 'individual' ? (
        <Card style={styles.card}>
          <Card.Title title="개인별 출석 순위" subtitle="총 출석 점수 기준" />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={{ flex: 0.5 }}>등수</DataTable.Title>
                <DataTable.Title style={{ flex: 1.5 }}>이름</DataTable.Title>
                <DataTable.Title style={{ flex: 1 }}>제자반</DataTable.Title>
                <DataTable.Title numeric style={{ flex: 0.8 }}>점수</DataTable.Title>
              </DataTable.Header>

              {individualRankings.map((item) => (
                <DataTable.Row key={item.member_id}>
                  <DataTable.Cell style={{ flex: 0.5 }}>
                    <Text style={[styles.rankText, item.point_rank <= 3 && styles.topRank]}>
                      {getMedalEmoji(item.point_rank)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.5 }}>
                    <Text style={styles.nameText}>{item.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    <Text style={styles.classText}>{item.class_name || '-'}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 0.8 }}>
                    <Text style={styles.scoreText}>{item.total_points}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Title title="제자반별 출석 순위" subtitle="점수등수 + 출석률등수 합산 기준" />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 0.5 }}>등수</DataTable.Title>
                  <DataTable.Title style={{ flex: 1.2 }}>제자반</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.6 }}>인원</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.7 }}>총점</DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 0.8 }}>출석률</DataTable.Title>
                </DataTable.Header>

                {classRankings.map((item) => (
                  <DataTable.Row key={item.class_id}>
                    <DataTable.Cell style={{ flex: 0.5 }}>
                      <Text style={[styles.rankText, item.final_rank <= 3 && styles.topRank]}>
                        {getMedalEmoji(item.final_rank)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1.2 }}>
                      <Text style={styles.nameText}>{item.class_name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.6 }}>
                      <Text>{item.member_count}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.7 }}>
                      <Text style={styles.scoreText}>{item.total_points}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 0.8 }}>
                      <Text>{item.attendance_rate}%</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>

          {/* 순위 산정 규칙 */}
          <Card style={styles.card}>
            <Card.Title title="제자반 출결 규칙" />
            <Card.Content>
              <Text style={styles.ruleText}>1. 총 출석 점수로 등수 산정 (점수등수 A)</Text>
              <Text style={styles.ruleText}>2. 총 출석률로 등수 산정 (출석률등수 B)</Text>
              <Text style={styles.ruleText}>3. A + B = 합산 점수</Text>
              <Text style={styles.ruleText}>4. 합산 점수가 작은 순서대로 최종 등수 결정</Text>

              <View style={styles.ruleDetail}>
                {classRankings.map((item) => (
                  <View key={item.class_id} style={styles.ruleRow}>
                    <Text style={styles.ruleClassName}>{item.class_name}</Text>
                    <Text style={styles.ruleCalc}>
                      점수등수({item.points_rank}) + 출석률등수({item.rate_rank}) = {item.combined_score}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* 개인 출결 규칙 */}
          <Card style={styles.card}>
            <Card.Title title="개인 출결 규칙" />
            <Card.Content>
              <Text style={styles.ruleText}>- 총 출석 점수가 높은 순서대로 등수 산정</Text>
              <Text style={styles.ruleText}>- 동점 시 동일 등수 부여</Text>
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
});
