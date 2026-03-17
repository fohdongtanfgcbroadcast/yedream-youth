import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text, Card, Button, TextInput, List, IconButton, Portal, Modal, Divider, Avatar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ROLES } from '../../../src/lib/constants';

type AdminSection = 'menu' | 'members' | 'classes' | 'addMember' | 'addClass';

export default function AdminScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const { members, classes, addMember, deleteMember, addClass, deleteClass } = useDataStore();

  const [section, setSection] = useState<AdminSection>('menu');

  // 회원 추가 폼
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newClassId, setNewClassId] = useState('');

  // 제자반 추가 폼
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  const handleAddMember = () => {
    if (!newName.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    addMember({
      name: newName.trim(),
      date_of_birth: newDob || undefined,
      phone: newPhone || undefined,
      class_id: newClassId || undefined,
    });
    Alert.alert('완료', `${newName} 회원이 추가되었습니다.`);
    setNewName('');
    setNewDob('');
    setNewPhone('');
    setNewClassId('');
    setSection('members');
  };

  const handleDeleteMember = (id: string, name: string) => {
    Alert.alert('삭제 확인', `${name} 회원을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMember(id) },
    ]);
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) {
      Alert.alert('알림', '제자반 이름을 입력해주세요.');
      return;
    }
    addClass({ name: newClassName.trim(), description: newClassDesc || undefined });
    Alert.alert('완료', `${newClassName} 제자반이 추가되었습니다.`);
    setNewClassName('');
    setNewClassDesc('');
    setSection('classes');
  };

  const handleDeleteClass = (id: string, name: string) => {
    Alert.alert('삭제 확인', `${name} 제자반을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteClass(id) },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', onPress: () => { logout(); router.replace('/sign-in'); } },
    ]);
  };

  // 메인 메뉴
  if (section === 'menu') {
    return (
      <ScrollView style={styles.container}>
        {/* 프로필 카드 */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileRow}>
            <Avatar.Text size={48} label={profile?.display_name?.charAt(0) || '?'} style={{ backgroundColor: COLORS.primary }} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.display_name}</Text>
              <Text style={styles.profileRole}>{ROLES[profile?.role || 'member'].label}</Text>
            </View>
          </Card.Content>
        </Card>

        {isAdmin && (
          <>
            <Card style={styles.card}>
              <List.Item
                title="회원 관리"
                description={`${members.filter((m) => m.is_active).length}명`}
                left={(props) => <List.Icon {...props} icon="account-group" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setSection('members')}
              />
              <Divider />
              <List.Item
                title="제자반 관리"
                description={`${classes.filter((c) => c.is_active).length}개`}
                left={(props) => <List.Icon {...props} icon="school" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setSection('classes')}
              />
              <Divider />
              <List.Item
                title="알림 설정"
                description="예약 알림 관리"
                left={(props) => <List.Icon {...props} icon="bell-ring" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('알림', '프로토타입에서는 지원하지 않는 기능입니다.')}
              />
              <Divider />
              <List.Item
                title="계정 관리"
                description="사용자 계정 생성/삭제"
                left={(props) => <List.Icon {...props} icon="account-cog" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('알림', '프로토타입에서는 지원하지 않는 기능입니다.')}
              />
            </Card>
          </>
        )}

        <Card style={styles.card}>
          <List.Item
            title="로그아웃"
            left={(props) => <List.Icon {...props} icon="logout" color={COLORS.danger} />}
            titleStyle={{ color: COLORS.danger }}
            onPress={handleLogout}
          />
        </Card>

        <Text style={styles.version}>예닮드림 청년부 v0.1.0 (프로토타입)</Text>
      </ScrollView>
    );
  }

  // 회원 관리
  if (section === 'members') {
    const activeMembers = members.filter((m) => m.is_active);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button icon="arrow-left" onPress={() => setSection('menu')}>뒤로</Button>
          <Text style={styles.sectionTitle}>회원 관리 ({activeMembers.length}명)</Text>
          <Button icon="plus" mode="contained" onPress={() => setSection('addMember')} compact>추가</Button>
        </View>
        {activeMembers.map((m) => {
          const cls = classes.find((c) => c.id === m.class_id);
          return (
            <Card key={m.id} style={styles.memberCard}>
              <Card.Content style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberDetail}>
                    {cls?.name || '미배정'} {m.phone ? `| ${m.phone}` : ''}
                  </Text>
                </View>
                <IconButton icon="delete" iconColor={COLORS.danger} onPress={() => handleDeleteMember(m.id, m.name)} />
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // 회원 추가
  if (section === 'addMember') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button icon="arrow-left" onPress={() => setSection('members')}>뒤로</Button>
          <Text style={styles.sectionTitle}>회원 추가</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="이름 *" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
            <TextInput label="생년월일 (YYYY-MM-DD)" value={newDob} onChangeText={setNewDob} mode="outlined" style={styles.input} />
            <TextInput label="연락처" value={newPhone} onChangeText={setNewPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />

            <Text style={styles.fieldLabel}>소속 제자반</Text>
            <View style={styles.classSelector}>
              {classes.filter((c) => c.is_active).map((c) => (
                <Button
                  key={c.id}
                  mode={newClassId === c.id ? 'contained' : 'outlined'}
                  onPress={() => setNewClassId(newClassId === c.id ? '' : c.id)}
                  compact
                  style={styles.classButton}
                >
                  {c.name}
                </Button>
              ))}
            </View>

            <Button mode="contained" onPress={handleAddMember} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}>
              회원 추가
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // 제자반 관리
  if (section === 'classes') {
    const activeClasses = classes.filter((c) => c.is_active);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button icon="arrow-left" onPress={() => setSection('menu')}>뒤로</Button>
          <Text style={styles.sectionTitle}>제자반 관리 ({activeClasses.length}개)</Text>
          <Button icon="plus" mode="contained" onPress={() => setSection('addClass')} compact>추가</Button>
        </View>
        {activeClasses.map((c) => {
          const memberCount = members.filter((m) => m.class_id === c.id && m.is_active).length;
          return (
            <Card key={c.id} style={styles.memberCard}>
              <Card.Content style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{c.name}</Text>
                  <Text style={styles.memberDetail}>{memberCount}명 | {c.description || '설명 없음'}</Text>
                </View>
                <IconButton icon="delete" iconColor={COLORS.danger} onPress={() => handleDeleteClass(c.id, c.name)} />
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // 제자반 추가
  if (section === 'addClass') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button icon="arrow-left" onPress={() => setSection('classes')}>뒤로</Button>
          <Text style={styles.sectionTitle}>제자반 추가</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="제자반 이름 *" value={newClassName} onChangeText={setNewClassName} mode="outlined" style={styles.input} />
            <TextInput label="설명" value={newClassDesc} onChangeText={setNewClassDesc} mode="outlined" style={styles.input} />
            <Button mode="contained" onPress={handleAddClass} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}>
              제자반 추가
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { margin: 16, marginBottom: 0, borderRadius: 12, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  profileRole: { fontSize: 14, color: COLORS.textSecondary },
  version: { textAlign: 'center', color: COLORS.disabled, fontSize: 12, marginTop: 24, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  memberCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  memberDetail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  classButton: { borderRadius: 8 },
  submitBtn: { marginTop: 8, borderRadius: 12 },
});
