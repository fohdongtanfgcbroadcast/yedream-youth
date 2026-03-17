import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth-store';
import { COLORS } from '../src/lib/constants';

const LOGIN_OPTIONS = [
  { key: 'admin', label: '관리자', desc: '전체 관리 권한', color: '#E74C3C' },
  { key: 'instructor1', label: '1반 강사', desc: '제자반 1반 담당', color: '#3498DB' },
  { key: 'instructor2', label: '2반 강사', desc: '제자반 2반 담당', color: '#2980B9' },
  { key: 'instructor3', label: '3반 강사', desc: '제자반 3반 담당', color: '#1ABC9C' },
  { key: 'member', label: '일반 회원', desc: '조회만 가능', color: '#95A5A6' },
];

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const success = await login(selectedRole, 'demo');
    if (success) {
      router.replace('/(app)/(home)');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>예닮드림</Text>
        <Text style={styles.subtitle}>청년부 재적관리</Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>로그인 계정 선택 (프로토타입)</Text>

            {LOGIN_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setSelectedRole(opt.key)}
                style={[
                  styles.roleOption,
                  selectedRole === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '10' },
                ]}
              >
                <View style={[styles.roleIndicator, { backgroundColor: opt.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleName, selectedRole === opt.key && { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.roleDesc}>{opt.desc}</Text>
                </View>
                {selectedRole === opt.key && <Text style={{ color: opt.color, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TextInput label="아이디" value={userId} onChangeText={setUserId}
              mode="outlined" style={styles.input} placeholder="이메일 또는 아이디" />

            <TextInput label="비밀번호" value={password} onChangeText={setPassword}
              mode="outlined" secureTextEntry style={styles.input} placeholder="비밀번호" />

            <Button mode="contained" onPress={handleLogin} loading={isLoading}
              style={styles.button} contentStyle={styles.buttonContent}
            >
              로그인
            </Button>

            <Text style={styles.hint}>
              * 프로토타입: 계정을 선택하고 로그인 버튼을 누르세요
            </Text>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#E0E0E0', textAlign: 'center', marginBottom: 24 },
  card: { borderRadius: 16, elevation: 4 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 10, borderWidth: 2, borderColor: COLORS.border,
    marginBottom: 8,
  },
  roleIndicator: { width: 8, height: 36, borderRadius: 4, marginRight: 12 },
  roleName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  roleDesc: { fontSize: 12, color: COLORS.textSecondary },
  input: { marginBottom: 12 },
  button: { marginTop: 8, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  hint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 16 },
});
