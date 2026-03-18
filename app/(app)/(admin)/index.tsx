import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../../src/lib/supabase';
import {
  Text, Card, Button, TextInput, List, IconButton, Divider, Avatar, Chip, Switch,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useDataStore } from '../../../src/stores/data-store';
import { COLORS, ROLES } from '../../../src/lib/constants';
import { formatDate, calculateAge, asyncStorage, webAlert, webConfirm } from '../../../src/lib/utils';

type AdminSection = 'menu' | 'members' | 'classes' | 'addMember' | 'addClass' | 'editClass' | 'editMember' | 'newFamily' | 'accounts' | 'notifications';

export default function AdminScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const { members, classes, addMember, updateMember, deleteMember, addClass, deleteClass } = useDataStore();

  const [section, setSection] = useState<AdminSection>('menu');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all'); // 'all' or class_id
  const [titleFilter, setTitleFilter] = useState('all'); // 'all' or title

  // 회원 추가/수정 폼
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formLunar, setFormLunar] = useState(false);
  const [formClassId, setFormClassId] = useState('');

  // 제자반 추가/수정 폼
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassDesc, setEditClassDesc] = useState('');
  const [editClassInstructorId, setEditClassInstructorId] = useState('');

  // 강사 프로필 목록
  const [instructorProfiles, setInstructorProfiles] = useState<{ id: string; display_name: string; assigned_class_ids?: string[] }[]>([]);
  useEffect(() => {
    const loadInstructors = async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, assigned_class_ids').in('role', ['instructor', 'pastor', 'evangelist']);
      if (data) setInstructorProfiles(data);
    };
    loadInstructors();
  }, []);

  // 계정 관리 폼
  const createInstructorAccount = useAuthStore((s) => s.createInstructorAccount);
  const createOfficerAccount = useAuthStore((s) => s.createOfficerAccount);
  const [accountType, setAccountType] = useState<'instructor' | 'pastor' | 'evangelist' | 'officer'>('instructor');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountClassIds, setAccountClassIds] = useState<string[]>([]);

  // 알림 설정 폼
  const [notiTitle, setNotiTitle] = useState('');
  const [notiBody, setNotiBody] = useState('');

  // 비밀번호 변경
  const changePassword = useAuthStore((s) => s.changePassword);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [notiDay, setNotiDay] = useState('0'); // 0=일요일
  const [notiHour, setNotiHour] = useState('19');

  const resetForm = () => {
    setFormName(''); setFormDob(''); setFormPhone('');
    setFormAddress(''); setFormNotes(''); setFormTitle(''); setFormLunar(false); setFormClassId('');
    setEditingMemberId(null);
  };

  const openEditMember = (memberId: string) => {
    const m = members.find((mem) => mem.id === memberId);
    if (!m) return;
    setEditingMemberId(memberId);
    setFormName(m.name);
    setFormDob(m.date_of_birth || '');
    setFormPhone(m.phone || '');
    setFormAddress(m.address || '');
    setFormNotes(m.notes || '');
    setFormTitle(m.title || '');
    setFormLunar(m.is_lunar_birthday || false);
    setFormClassId(m.class_id || '');
    setSection('editMember');
  };

  const handleAddMember = () => {
    if (!formName.trim()) { webAlert('이름을 입력해주세요.'); return; }
    addMember({
      name: formName.trim(),
      date_of_birth: formDob ? `2000-${formDob}` : undefined,
      phone: formPhone || undefined,
      address: formAddress || undefined,
      notes: formNotes || undefined,
      title: formTitle || undefined,
      is_lunar_birthday: formLunar,
      class_id: formClassId || undefined,
    });
    webAlert(`${formName} 회원이 추가되었습니다.`);
    resetForm();
    setSection('members');
  };

  const handleUpdateMember = async () => {
    if (!editingMemberId || !formName.trim()) { webAlert('이름을 입력해주세요.'); return; }
    await updateMember(editingMemberId, {
      name: formName.trim(),
      date_of_birth: formDob ? (formDob.length <= 5 ? `2000-${formDob}` : formDob) : null,
      phone: formPhone || null,
      address: formAddress || null,
      notes: formNotes || null,
      title: formTitle || null,
      is_lunar_birthday: formLunar,
      class_id: formClassId || null,
    });
    webAlert('회원 정보가 수정되었습니다.');
    resetForm();
    setSection('members');
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (webConfirm(`${name} 회원을 삭제하시겠습니까?`)) deleteMember(id);
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) { webAlert('제자반 이름을 입력해주세요.'); return; }
    addClass({ name: newClassName.trim(), description: newClassDesc || undefined });
    webAlert(`${newClassName} 제자반이 추가되었습니다.`);
    setNewClassName(''); setNewClassDesc('');
    setSection('classes');
  };

  const openEditClass = (classId: string) => {
    const c = classes.find((cls) => cls.id === classId);
    if (!c) return;
    setEditingClassId(classId);
    setEditClassName(c.name);
    setEditClassDesc(c.description || '');
    // 담당 강사 찾기
    const instructor = instructorProfiles.find((p) => p.assigned_class_ids?.includes(classId));
    setEditClassInstructorId(instructor?.id || '');
    setSection('editClass');
  };

  const handleUpdateClass = async () => {
    if (!editingClassId || !editClassName.trim()) { webAlert('제자반 이름을 입력해주세요.'); return; }

    const { members: _, classes: __, ...store } = useDataStore.getState();
    await store.updateClass(editingClassId, {
      name: editClassName.trim(),
      description: editClassDesc || null,
    } as any);

    // 강사 배정 업데이트: 기존 강사에서 이 반 제거, 새 강사에 이 반 추가
    for (const inst of instructorProfiles) {
      const hasClass = inst.assigned_class_ids?.includes(editingClassId);
      if (inst.id === editClassInstructorId && !hasClass) {
        // 새 강사에 반 추가
        const newIds = [...(inst.assigned_class_ids || []), editingClassId];
        await supabase.from('profiles').update({ assigned_class_ids: newIds }).eq('id', inst.id);
      } else if (inst.id !== editClassInstructorId && hasClass) {
        // 이전 강사에서 반 제거
        const newIds = (inst.assigned_class_ids || []).filter((cid: string) => cid !== editingClassId);
        await supabase.from('profiles').update({ assigned_class_ids: newIds }).eq('id', inst.id);
      }
    }

    // 강사 목록 새로고침
    const { data } = await supabase.from('profiles').select('id, display_name, assigned_class_ids').in('role', ['instructor', 'pastor', 'evangelist']);
    if (data) setInstructorProfiles(data);

    webAlert('제자반 정보가 수정되었습니다.');
    setEditingClassId(null);
    setSection('classes');
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (webConfirm(`${name} 제자반을 삭제하시겠습니까?`)) deleteClass(id);
  };

  const handleLogout = async () => {
    if (!webConfirm('로그아웃 하시겠습니까?')) return;

    // 자동 로그인 정보 삭제
    await asyncStorage.removeItem('auto_login');
    await asyncStorage.removeItem('autoLogin_email');
    await asyncStorage.removeItem('autoLogin_password');
    await logout();
    router.replace('/sign-in');
  };

  const toggleAccountClass = (classId: string) => {
    setAccountClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };


  const handleCreateAccount = async () => {
    if (!accountEmail.trim() || !accountName.trim() || !accountPassword.trim()) {
      webAlert('이메일, 비밀번호, 이름을 모두 입력해주세요.');
      return;
    }
    if (!accountPhone.trim()) {
      webAlert('휴대폰 번호를 입력해주세요.');
      return;
    }

    if (accountType === 'instructor' || accountType === 'pastor' || accountType === 'evangelist') {
      if (accountClassIds.length === 0) {
        webAlert('담당 제자반을 1개 이상 선택해주세요.');
        return;
      }
      const classNames = accountClassIds.map((id) => classes.find((c) => c.id === id)?.name).join(', ');
      const result = await createInstructorAccount(
        accountEmail.trim(), accountPassword, accountName.trim(), accountPhone.trim(), accountClassIds,
      );
      if (!result.success) { webAlert(result.error || '계정 생성에 실패했습니다.'); return; }
      const roleLabel = accountType === 'pastor' ? '목사' : accountType === 'evangelist' ? '전도사' : '강사';
      webAlert(`${accountName} ${roleLabel} 계정이 생성되었습니다.\n\n이메일: ${accountEmail}\n휴대폰: ${accountPhone}\n담당반: ${classNames}\n\n* 최초 로그인 시 비밀번호 변경이 요청됩니다.`);
    } else {
      const result = await createOfficerAccount(
        accountEmail.trim(), accountPassword, accountName.trim(), accountPhone.trim(),
      );
      if (!result.success) { webAlert(result.error || '계정 생성에 실패했습니다.'); return; }
      webAlert(`${accountName} 임원 계정이 생성되었습니다.\n\n이메일: ${accountEmail}\n휴대폰: ${accountPhone}\n\n* 최초 로그인 시 비밀번호 변경이 요청됩니다.`);
    }
    setAccountEmail(''); setAccountPassword(''); setAccountName(''); setAccountPhone(''); setAccountClassIds([]);
  };

  const handleSaveNotification = () => {
    if (!notiTitle.trim() || !notiBody.trim()) {
      webAlert('제목과 내용을 입력해주세요.');
      return;
    }
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    webAlert(`알림이 설정되었습니다.\n\n매주 ${days[Number(notiDay)]}요일 ${notiHour}시\n제목: ${notiTitle}\n내용: ${notiBody}`);
    setNotiTitle(''); setNotiBody('');
  };

  // ============ 메인 메뉴 ============
  if (section === 'menu') {
    return (
      <ScrollView style={styles.container}>
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
          <Card style={styles.card}>
            <List.Item
              title="새가족 등록"
              description="새로운 청년 등록"
              right={() => <Button mode="outlined" compact onPress={() => { resetForm(); setSection('newFamily'); }} labelStyle={{ fontSize: 12 }} style={{ borderRadius: 4 }}>등록</Button>}
              onPress={() => { resetForm(); setSection('newFamily'); }}
            />
            <Divider />
            <List.Item
              title="회원 관리"
              description={`${members.filter((m) => m.is_active).length}명`}
              right={() => <Button mode="outlined" compact onPress={() => setSection('members')} labelStyle={{ fontSize: 12 }} style={{ borderRadius: 4 }}>수정</Button>}
              onPress={() => setSection('members')}
            />
            <Divider />
            <List.Item
              title="제자반 관리"
              description={`${classes.filter((c) => c.is_active).length}개`}
              right={() => <Button mode="outlined" compact onPress={() => setSection('classes')} labelStyle={{ fontSize: 12 }} style={{ borderRadius: 4 }}>수정</Button>}
              onPress={() => setSection('classes')}
            />
            <Divider />
            <List.Item
              title="계정 관리"
              description="사용자 계정 생성"
              right={() => <Button mode="outlined" compact onPress={() => setSection('accounts')} labelStyle={{ fontSize: 12 }} style={{ borderRadius: 4 }}>생성</Button>}
              onPress={() => setSection('accounts')}
            />
            <Divider />
            <List.Item
              title="알림 설정"
              description="예약 알림 관리"
              right={() => <Button mode="outlined" compact onPress={() => setSection('notifications')} labelStyle={{ fontSize: 12 }} style={{ borderRadius: 4 }}>설정</Button>}
              onPress={() => setSection('notifications')}
            />
          </Card>
        )}

        <Card style={styles.card}>
          <List.Item
            title="비밀번호 변경"
            onPress={() => setSection('changePassword' as any)}
          />
          <Divider />
          <List.Item
            title="로그아웃"
            titleStyle={{ color: COLORS.danger }}
            onPress={handleLogout}
          />
        </Card>

        <Text style={styles.version}>예닮드림 청년부 v1.0.0</Text>
      </ScrollView>
    );
  }

  // ============ 새가족 등록 ============
  if (section === 'newFamily') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => { resetForm(); setSection('menu'); }}>뒤로</Button>
          <Text style={styles.sectionTitle}>새가족 등록</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="이름 *" value={formName} onChangeText={setFormName} mode="outlined" style={styles.input} />
            <TextInput label="생일 (MM-DD)" value={formDob} onChangeText={setFormDob} mode="outlined" style={styles.input} placeholder="예: 03-17" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Switch value={formLunar} onValueChange={setFormLunar} color={COLORS.primary} />
              <Text style={{ fontSize: 14, color: COLORS.text, marginLeft: 8 }}>음력 생일</Text>
            </View>
            <TextInput label="연락처" value={formPhone} onChangeText={setFormPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" placeholder="예: 010-1234-5678" />
            <Text style={styles.fieldLabel}>직책</Text>
            <View style={styles.classSelector}>
              {['목사', '전도사', '강사', '청년', '기타'].map((t) => (
                <Button key={t} mode={formTitle === t ? 'contained' : 'outlined'} compact
                  onPress={() => setFormTitle(formTitle === t ? '' : t)}
                  style={styles.classButton} labelStyle={{ fontSize: 12 }}
                >{t}</Button>
              ))}
            </View>
            <TextInput label="주소" value={formAddress} onChangeText={setFormAddress} mode="outlined" style={styles.input} />
            <TextInput label="메모" value={formNotes} onChangeText={setFormNotes} mode="outlined" style={styles.input} multiline numberOfLines={3} placeholder="특이사항, 방문 경위 등" />

            <Text style={styles.fieldLabel}>소속 제자반 (나중에 배정 가능)</Text>
            <View style={styles.classSelector}>
              <Button
                mode={formClassId === '' ? 'contained' : 'outlined'}
                onPress={() => setFormClassId('')}
                compact style={styles.classButton}
              >
                미배정
              </Button>
              {classes.filter((c) => c.is_active).map((c) => (
                <Button
                  key={c.id}
                  mode={formClassId === c.id ? 'contained' : 'outlined'}
                  onPress={() => setFormClassId(c.id)}
                  compact style={styles.classButton}
                >
                  {c.name}
                </Button>
              ))}
            </View>

            <Button mode="contained" onPress={handleAddMember} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}
                         >
              새가족 등록
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // ============ 회원 관리 (목록) ============
  if (section === 'members') {
    const activeMembers = members.filter((m) => {
      if (!m.is_active) return false;
      if (memberFilter !== 'all') {
        if (memberFilter === 'unassigned') { if (m.class_id) return false; }
        else { if (m.class_id !== memberFilter) return false; }
      }
      if (titleFilter !== 'all') {
        if (titleFilter === 'none') { if (m.title) return false; }
        else { if (m.title !== titleFilter) return false; }
      }
      if (memberSearch) {
        const q = memberSearch.toLowerCase();
        const cls = classes.find((c) => c.id === m.class_id);
        if (!m.name.toLowerCase().includes(q) && !(cls?.name.toLowerCase().includes(q))) return false;
      }
      return true;
    });
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => setSection('menu')}>← 뒤로</Button>
          <Text style={styles.sectionTitle}>회원 관리</Text>
          <Button mode="contained" onPress={() => { resetForm(); setSection('addMember'); }} compact>추가</Button>
        </View>

        {/* 검색 */}
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <TextInput
            placeholder="이름 또는 제자반 검색"
            value={memberSearch}
            onChangeText={setMemberSearch}
            mode="outlined"
            dense
            style={{ backgroundColor: '#FFF' }}
          />
        </View>

        {/* 소속별 필터 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8, maxHeight: 40 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Button mode={memberFilter === 'all' ? 'contained' : 'outlined'} compact onPress={() => setMemberFilter('all')} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>전체</Button>
            {classes.filter((c) => c.is_active && !['군인', '졸업생'].includes(c.name)).map((c) => (
              <Button key={c.id} mode={memberFilter === c.id ? 'contained' : 'outlined'} compact onPress={() => setMemberFilter(c.id)} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>{c.name}</Button>
            ))}
            {classes.filter((c) => c.is_active && ['군인', '졸업생'].includes(c.name)).map((c) => (
              <Button key={c.id} mode={memberFilter === c.id ? 'contained' : 'outlined'} compact onPress={() => setMemberFilter(c.id)} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>{c.name}</Button>
            ))}
            <Button mode={memberFilter === 'unassigned' ? 'contained' : 'outlined'} compact onPress={() => setMemberFilter('unassigned')} labelStyle={{ fontSize: 11 }} style={{ borderRadius: 4 }}>기타</Button>
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

        <Text style={{ marginHorizontal: 20, marginBottom: 8, fontSize: 13, color: COLORS.textSecondary }}>{activeMembers.length}명</Text>

        {activeMembers.map((m) => {
          const cls = classes.find((c) => c.id === m.class_id);
          return (
            <Card key={m.id} style={styles.memberCard}>
              <Card.Content style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberDetail}>
                    {cls?.name || '기타'} {m.phone ? `| ${m.phone}` : ''} {m.title ? `| ${m.title}` : ''}
                  </Text>
                </View>
                <Button mode="text" compact onPress={() => openEditMember(m.id)} labelStyle={{ fontSize: 12 }}>수정</Button>
                <Button mode="text" compact onPress={() => handleDeleteMember(m.id, m.name)} labelStyle={{ fontSize: 12, color: COLORS.danger }}>삭제</Button>
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ============ 회원 추가 ============
  if (section === 'addMember') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => { resetForm(); setSection('members'); }}>뒤로</Button>
          <Text style={styles.sectionTitle}>회원 추가</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="이름 *" value={formName} onChangeText={setFormName} mode="outlined" style={styles.input} />
            <TextInput label="생일 (MM-DD)" value={formDob} onChangeText={setFormDob} mode="outlined" style={styles.input} placeholder="예: 03-17" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Switch value={formLunar} onValueChange={setFormLunar} color={COLORS.primary} />
              <Text style={{ fontSize: 14, color: COLORS.text, marginLeft: 8 }}>음력 생일</Text>
            </View>
            <TextInput label="연락처" value={formPhone} onChangeText={setFormPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>직책</Text>
            <View style={styles.classSelector}>
              {['목사', '전도사', '강사', '청년', '기타'].map((t) => (
                <Button key={t} mode={formTitle === t ? 'contained' : 'outlined'} compact
                  onPress={() => setFormTitle(formTitle === t ? '' : t)}
                  style={styles.classButton} labelStyle={{ fontSize: 12 }}
                >{t}</Button>
              ))}
            </View>
            <TextInput label="주소" value={formAddress} onChangeText={setFormAddress} mode="outlined" style={styles.input} />
            <TextInput label="메모" value={formNotes} onChangeText={setFormNotes} mode="outlined" style={styles.input} multiline />

            <Text style={styles.fieldLabel}>소속 제자반</Text>
            <View style={styles.classSelector}>
              {classes.filter((c) => c.is_active).map((c) => (
                <Button key={c.id} mode={formClassId === c.id ? 'contained' : 'outlined'}
                  onPress={() => setFormClassId(formClassId === c.id ? '' : c.id)} compact style={styles.classButton}
                >{c.name}</Button>
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

  // ============ 회원 정보 수정 ============
  if (section === 'editMember') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => { resetForm(); setSection('members'); }}>뒤로</Button>
          <Text style={styles.sectionTitle}>정보 수정</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="이름 *" value={formName} onChangeText={setFormName} mode="outlined" style={styles.input} />
            <TextInput label="생일 (MM-DD)" value={formDob} onChangeText={setFormDob} mode="outlined" style={styles.input} placeholder="예: 03-17" />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Switch value={formLunar} onValueChange={setFormLunar} color={COLORS.primary} />
              <Text style={{ fontSize: 14, color: COLORS.text, marginLeft: 8 }}>음력 생일</Text>
            </View>
            <TextInput label="연락처" value={formPhone} onChangeText={setFormPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>직책</Text>
            <View style={styles.classSelector}>
              {['목사', '전도사', '강사', '청년', '기타'].map((t) => (
                <Button key={t} mode={formTitle === t ? 'contained' : 'outlined'} compact
                  onPress={() => setFormTitle(formTitle === t ? '' : t)}
                  style={styles.classButton} labelStyle={{ fontSize: 12 }}
                >{t}</Button>
              ))}
            </View>
            <TextInput label="주소" value={formAddress} onChangeText={setFormAddress} mode="outlined" style={styles.input} />
            <TextInput label="메모" value={formNotes} onChangeText={setFormNotes} mode="outlined" style={styles.input} multiline numberOfLines={3} />

            <Text style={styles.fieldLabel}>소속 제자반</Text>
            <View style={styles.classSelector}>
              <Button mode={formClassId === '' ? 'contained' : 'outlined'}
                onPress={() => setFormClassId('')} compact style={styles.classButton}
              >미배정</Button>
              {classes.filter((c) => c.is_active).map((c) => (
                <Button key={c.id} mode={formClassId === c.id ? 'contained' : 'outlined'}
                  onPress={() => setFormClassId(c.id)} compact style={styles.classButton}
                >{c.name}</Button>
              ))}
            </View>

            <Button mode="contained" onPress={handleUpdateMember} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}
                         >
              저장
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // ============ 제자반 관리 ============
  if (section === 'classes') {
    const activeClasses = classes.filter((c) => c.is_active);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => setSection('menu')}>뒤로</Button>
          <Text style={styles.sectionTitle}>제자반 관리 ({activeClasses.length}개)</Text>
          <Button mode="contained" onPress={() => setSection('addClass')} compact>추가</Button>
        </View>
        {activeClasses.map((c) => {
          const memberCount = members.filter((m) => m.class_id === c.id && m.is_active).length;
          const instructor = instructorProfiles.find((p) => p.assigned_class_ids?.includes(c.id));
          return (
            <Card key={c.id} style={styles.memberCard}>
              <Card.Content style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{c.name}</Text>
                  <Text style={styles.memberDetail}>
                    {memberCount}명 | 강사: {instructor?.display_name || '미배정'} | {c.description || '설명 없음'}
                  </Text>
                </View>
                <Button mode="text" compact onPress={() => openEditClass(c.id)} labelStyle={{ fontSize: 12 }}>수정</Button>
                <Button mode="text" compact onPress={() => handleDeleteClass(c.id, c.name)} labelStyle={{ fontSize: 12, color: COLORS.danger }}>삭제</Button>
              </Card.Content>
            </Card>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ============ 제자반 추가 ============
  if (section === 'addClass') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => setSection('classes')}>뒤로</Button>
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

  // ============ 제자반 정보 수정 ============
  if (section === 'editClass') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => { setEditingClassId(null); setSection('classes'); }}>뒤로</Button>
          <Text style={styles.sectionTitle}>제자반 수정</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="제자반 이름 *" value={editClassName} onChangeText={setEditClassName} mode="outlined" style={styles.input} />
            <TextInput label="설명" value={editClassDesc} onChangeText={setEditClassDesc} mode="outlined" style={styles.input} />

            <Text style={styles.fieldLabel}>담당 강사</Text>
            <View style={styles.classSelector}>
              <Button
                mode={editClassInstructorId === '' ? 'contained' : 'outlined'}
                onPress={() => setEditClassInstructorId('')}
                compact style={styles.classButton}
              >
                미배정
              </Button>
              {instructorProfiles.map((inst) => (
                <Button
                  key={inst.id}
                  mode={editClassInstructorId === inst.id ? 'contained' : 'outlined'}
                  onPress={() => setEditClassInstructorId(inst.id)}
                  compact style={styles.classButton}
                >
                  {inst.display_name}
                </Button>
              ))}
            </View>
            {editClassInstructorId && (
              <Text style={{ fontSize: 12, color: COLORS.success, marginBottom: 8 }}>
                선택: {instructorProfiles.find((p) => p.id === editClassInstructorId)?.display_name}
              </Text>
            )}

            <Button mode="contained" onPress={handleUpdateClass} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}>
              저장
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // ============ 계정 관리 ============
  if (section === 'accounts') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => setSection('menu')}>뒤로</Button>
          <Text style={styles.sectionTitle}>강사 계정 생성</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.fieldLabel}>계정 유형</Text>
            <View style={styles.classSelector}>
              <Button mode={accountType === 'instructor' ? 'contained' : 'outlined'}
                onPress={() => setAccountType('instructor')} compact style={styles.classButton}
              >강사</Button>
              <Button mode={accountType === 'pastor' ? 'contained' : 'outlined'}
                onPress={() => setAccountType('pastor')} compact style={styles.classButton}
                buttonColor={accountType === 'pastor' ? '#2E6CB8' : undefined}
              >목사</Button>
              <Button mode={accountType === 'evangelist' ? 'contained' : 'outlined'}
                onPress={() => setAccountType('evangelist')} compact style={styles.classButton}
                buttonColor={accountType === 'evangelist' ? '#27AE60' : undefined}
              >전도사</Button>
              <Button mode={accountType === 'officer' ? 'contained' : 'outlined'}
                onPress={() => setAccountType('officer')} compact style={styles.classButton}
                buttonColor={accountType === 'officer' ? '#8E44AD' : undefined}
              >임원</Button>
            </View>

            <TextInput label="이메일 *" value={accountEmail} onChangeText={setAccountEmail} mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            <TextInput label="비밀번호 *" value={accountPassword} onChangeText={setAccountPassword} mode="outlined" style={styles.input} />
            <TextInput label="이름 *" value={accountName} onChangeText={setAccountName} mode="outlined" style={styles.input} />
            <TextInput label="휴대폰 번호 *" value={accountPhone} onChangeText={setAccountPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" placeholder="예: 010-1234-5678" />

            {(accountType === 'instructor' || accountType === 'pastor' || accountType === 'evangelist') && (
              <>
                <Text style={styles.fieldLabel}>담당 제자반 (복수 선택 가능)</Text>
                <View style={styles.classSelector}>
                  {classes.filter((c) => c.is_active).map((c) => (
                    <Button key={c.id} mode={accountClassIds.includes(c.id) ? 'contained' : 'outlined'}
                      onPress={() => toggleAccountClass(c.id)} compact style={styles.classButton}
                    >{c.name}</Button>
                  ))}
                </View>
                {accountClassIds.length > 0 && (
                  <Text style={{ fontSize: 12, color: COLORS.success, marginBottom: 8 }}>
                    선택됨: {accountClassIds.map((id) => classes.find((c) => c.id === id)?.name).join(', ')}
                  </Text>
                )}
              </>
            )}

            {accountType === 'officer' && (
              <Text style={{ fontSize: 12, color: '#8E44AD', marginBottom: 8 }}>
                임원 계정은 출석 체크 권한이 없습니다.
              </Text>
            )}

            <Button mode="contained" onPress={handleCreateAccount} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}
              buttonColor={accountType === 'officer' ? '#8E44AD' : undefined}
            >
              {accountType === 'instructor' ? '강사' : accountType === 'pastor' ? '목사' : accountType === 'evangelist' ? '전도사' : '임원'} 계정 생성
            </Button>

            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
              * 최초 로그인 시 비밀번호 변경이 요청됩니다{'\n'}* 휴대폰 번호는 비밀번호 재설정에 사용됩니다
            </Text>
          </Card.Content>
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ============ 알림 설정 ============
  if (section === 'notifications') {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => setSection('menu')}>뒤로</Button>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <View style={{ width: 80 }} />
        </View>

        <Card style={styles.card}>
          <Card.Title title="자동 알림 (기본 설정)" />
          <Card.Content>
            <View style={styles.notiRow}>
              <Chip compact>생일 알림</Chip>
              <Text style={styles.notiDesc}>매일 오전 9시 | 담당 강사에게</Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            <View style={styles.notiRow}>
              <Chip compact>출석 체크 알림</Chip>
              <Text style={styles.notiDesc}>매주 일요일 19시 | 전체 강사에게</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="커스텀 알림 추가" />
          <Card.Content>
            <TextInput label="알림 제목 *" value={notiTitle} onChangeText={setNotiTitle} mode="outlined" style={styles.input} />
            <TextInput label="알림 내용 *" value={notiBody} onChangeText={setNotiBody} mode="outlined" style={styles.input} multiline />

            <Text style={styles.fieldLabel}>요일</Text>
            <View style={styles.classSelector}>
              {days.map((d, i) => (
                <Button key={i} mode={notiDay === String(i) ? 'contained' : 'outlined'}
                  onPress={() => setNotiDay(String(i))} compact style={styles.classButton}
                >{d}</Button>
              ))}
            </View>

            <Text style={styles.fieldLabel}>시간</Text>
            <View style={styles.classSelector}>
              {['7', '9', '12', '18', '19', '20', '21'].map((h) => (
                <Button key={h} mode={notiHour === h ? 'contained' : 'outlined'}
                  onPress={() => setNotiHour(h)} compact style={styles.classButton}
                >{h}시</Button>
              ))}
            </View>

            <Button mode="contained" onPress={handleSaveNotification} style={styles.submitBtn}
              contentStyle={{ paddingVertical: 6 }}            >
              알림 저장
            </Button>
          </Card.Content>
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  // ============ 비밀번호 변경 ============
  if (section === ('changePassword' as any)) {
    const handleChangePassword = async () => {
      if (!cpNew || cpNew.length < 6) {
        webAlert('새 비밀번호를 6자 이상 입력해주세요.');
        return;
      }
      if (cpNew !== cpConfirm) {
        webAlert('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      const result = await changePassword(cpNew);
      if (result.success) {
        webAlert('비밀번호가 변경되었습니다.');
        setCpCurrent(''); setCpNew(''); setCpConfirm('');
        setSection('menu');
      } else {
        webAlert(result.error || '비밀번호 변경에 실패했습니다.');
      }
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.sectionHeader}>
          <Button onPress={() => { setCpCurrent(''); setCpNew(''); setCpConfirm(''); setSection('menu'); }}>← 뒤로</Button>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          <View style={{ width: 80 }} />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="새 비밀번호"
              value={cpNew}
              onChangeText={setCpNew}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="새 비밀번호 확인"
              value={cpConfirm}
              onChangeText={setCpConfirm}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <Button mode="contained" onPress={handleChangePassword} style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}>
              비밀번호 변경
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
  fieldLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, marginTop: 4 },
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  classButton: { borderRadius: 8 },
  submitBtn: { marginTop: 8, borderRadius: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 12 },
  notiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notiDesc: { fontSize: 12, color: COLORS.textSecondary },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
