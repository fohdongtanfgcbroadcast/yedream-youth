import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth-store';
import { COLORS } from '../src/lib/constants';

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loginError = useAuthStore((s) => s.loginError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }
    const success = await login(email.trim(), password);
    if (success) {
      router.replace('/(app)/(home)');
    } else {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>예닮드림</Text>
        <Text style={styles.subtitle}>청년부 재적관리</Text>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="이메일"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="example@yedream.com"
            />

            <TextInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            {loginError && (
              <Text style={styles.errorText}>{loginError}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              로그인
            </Button>

            <Divider style={{ marginVertical: 20 }} />

            <Text style={styles.accountTitle}>테스트 계정 안내</Text>

            <View style={styles.accountRow}>
              <View style={[styles.roleBadge, { backgroundColor: '#E74C3C' }]}>
                <Text style={styles.roleBadgeText}>관리자</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountEmail}>admin@yedream.com / admin123</Text>
              </View>
            </View>

            <View style={styles.accountRow}>
              <View style={[styles.roleBadge, { backgroundColor: '#3498DB' }]}>
                <Text style={styles.roleBadgeText}>강사</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountEmail}>instructor@yedream.com / 1234</Text>
                <Text style={styles.accountPw}>담당: 1반, 2반</Text>
              </View>
            </View>

            <Text style={styles.hint}>
              * 관리자가 계정 관리에서 새 강사 계정을 생성할 수 있습니다{'\n'}
              * 강사 계정 생성 시 담당 제자반을 여러 개 선택 가능합니다
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#E0E0E0', textAlign: 'center', marginBottom: 24 },
  card: { borderRadius: 16, elevation: 4 },
  input: { marginBottom: 12 },
  errorText: { color: COLORS.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  button: { marginTop: 4, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  accountTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 },
  accountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 56, alignItems: 'center' },
  roleBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  accountInfo: { marginLeft: 10 },
  accountEmail: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  accountPw: { fontSize: 11, color: COLORS.textSecondary },
  hint: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
