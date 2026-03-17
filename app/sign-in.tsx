import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
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
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  button: { marginTop: 4, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
});
