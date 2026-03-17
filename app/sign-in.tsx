import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth-store';
import { COLORS } from '../src/lib/constants';

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 프로토타입: 역할 선택으로 로그인
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
            <Text style={styles.label}>로그인 유형 선택 (프로토타입)</Text>
            <SegmentedButtons
              value={selectedRole}
              onValueChange={setSelectedRole}
              buttons={[
                { value: 'admin', label: '관리자' },
                { value: 'instructor', label: '강사' },
                { value: 'member', label: '회원' },
              ]}
              style={styles.segmented}
            />

            <TextInput
              label="아이디"
              value={userId}
              onChangeText={setUserId}
              mode="outlined"
              style={styles.input}
              placeholder="이메일 또는 아이디"
            />

            <TextInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              placeholder="비밀번호"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              로그인
            </Button>

            <Text style={styles.hint}>
              * 프로토타입: 역할을 선택하고 로그인 버튼을 누르세요
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
  subtitle: { fontSize: 18, color: '#E0E0E0', textAlign: 'center', marginBottom: 32 },
  card: { borderRadius: 16, elevation: 4 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  segmented: { marginBottom: 20 },
  input: { marginBottom: 12 },
  button: { marginTop: 8, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  hint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 16 },
});
