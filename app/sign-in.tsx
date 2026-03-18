import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Card, Switch, Modal, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth-store';
import { COLORS } from '../src/lib/constants';
import { storage, webAlert } from '../src/lib/utils';

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loginError = useAuthStore((s) => s.loginError);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const changePassword = useAuthStore((s) => s.changePassword);
  const resetPasswordWithVerification = useAuthStore((s) => s.resetPasswordWithVerification);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  // 비밀번호 변경 모달
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 비밀번호 찾기
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetBirthday, setResetBirthday] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [foundPassword, setFoundPassword] = useState('');

  // 저장된 정보 불러오기
  useEffect(() => {
    const savedEmail = storage.getItem('saved_email');
    const savedPassword = storage.getItem('saved_password');
    const savedAutoLogin = storage.getItem('auto_login') === 'true';
    const savedSave = storage.getItem('save_credentials') === 'true';

    if (savedSave && savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setSaveCredentials(true);
    }
    if (savedAutoLogin) {
      setAutoLogin(true);
    }

    // 자동 로그인
    if (savedAutoLogin && savedEmail && savedPassword) {
      handleAutoLogin(savedEmail, savedPassword);
    }
  }, []);

  const handleAutoLogin = async (e: string, p: string) => {
    const success = await login(e, p);
    if (success) {
      // mustChangePassword 체크는 login 후 상태에서
      const state = useAuthStore.getState();
      if (state.mustChangePassword) {
        setShowPasswordChange(true);
      } else {
        router.replace('/(app)/(home)');
      }
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      webAlert('이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      webAlert('비밀번호를 입력해주세요.');
      return;
    }

    // 자격 정보 저장
    if (saveCredentials) {
      storage.setItem('saved_email', email.trim());
      storage.setItem('saved_password', password);
      storage.setItem('save_credentials', 'true');
    } else {
      storage.removeItem('saved_email');
      storage.removeItem('saved_password');
      storage.removeItem('save_credentials');
    }

    if (autoLogin) {
      storage.setItem('auto_login', 'true');
      storage.setItem('autoLogin_email', email.trim());
      storage.setItem('autoLogin_password', password);
    } else {
      storage.removeItem('auto_login');
      storage.removeItem('autoLogin_email');
      storage.removeItem('autoLogin_password');
    }

    const success = await login(email.trim(), password);
    if (success) {
      const state = useAuthStore.getState();
      if (state.mustChangePassword) {
        setShowPasswordChange(true);
      } else {
        router.replace('/(app)/(home)');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      webAlert('새 비밀번호를 6자 이상 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      webAlert('비밀번호가 일치하지 않습니다.');
      return;
    }
    const result = await changePassword(newPassword);
    if (result.success) {
      // 저장된 비밀번호도 업데이트
      if (saveCredentials) {
        storage.setItem('saved_password', newPassword);
      }
      if (autoLogin) {
        storage.setItem('autoLogin_password', newPassword);
      }
      webAlert('비밀번호가 변경되었습니다.');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      router.replace('/(app)/(home)');
    } else {
      webAlert(result.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim() || !resetPhone.trim() || !resetBirthday.trim()) {
      webAlert('이메일, 전화번호, 생일을 모두 입력해주세요.');
      return;
    }
    setResetLoading(true);
    const result = await resetPasswordWithVerification(
      resetEmail.trim(), resetPhone.trim(), resetBirthday.trim()
    );
    setResetLoading(false);

    if (result.success && result.newPassword) {
      setFoundPassword(result.newPassword);
    } else {
      webAlert(result.error || '정보가 일치하지 않습니다.');
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetPhone('');
    setResetBirthday('');
    setFoundPassword('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
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

            {/* 로그인 옵션 */}
            <View style={styles.checkboxRow}>
              <View style={styles.checkboxItem}>
                <Switch
                  value={saveCredentials}
                  onValueChange={(next) => {
                    setSaveCredentials(next);
                    if (!next) {
                      setAutoLogin(false);
                      storage.removeItem('saved_email');
                      storage.removeItem('saved_password');
                      storage.removeItem('save_credentials');
                      storage.removeItem('auto_login');
                      storage.removeItem('autoLogin_email');
                      storage.removeItem('autoLogin_password');
                    }
                  }}
                  color={COLORS.primary}
                />
                <Text style={styles.checkboxLabel}>ID/PW 저장</Text>
              </View>
              <View style={styles.checkboxItem}>
                <Switch
                  value={autoLogin}
                  onValueChange={(next) => {
                    setAutoLogin(next);
                    if (next) setSaveCredentials(true);
                    if (!next) {
                      storage.removeItem('auto_login');
                      storage.removeItem('autoLogin_email');
                      storage.removeItem('autoLogin_password');
                    }
                  }}
                  color={COLORS.primary}
                />
                <Text style={styles.checkboxLabel}>자동 로그인</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              로그인
            </Button>

            <Button
              mode="text"
              onPress={() => setShowForgotPassword(true)}
              style={{ marginTop: 8 }}
              labelStyle={{ fontSize: 13, color: COLORS.textSecondary }}
            >
              비밀번호를 잊으셨나요?
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 비밀번호 변경 모달 (강사 최초 로그인) */}
      <Portal>
        <Modal visible={showPasswordChange} dismissable={false} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>비밀번호 변경 필요</Text>
          <Text style={styles.modalDesc}>최초 로그인입니다. 보안을 위해 비밀번호를 변경해주세요.</Text>
          <TextInput
            label="새 비밀번호"
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <Button mode="contained" onPress={handleChangePassword} style={styles.button} contentStyle={styles.buttonContent}>
            비밀번호 변경
          </Button>
        </Modal>
      </Portal>

      {/* 비밀번호 찾기 모달 */}
      <Portal>
        <Modal visible={showForgotPassword} onDismiss={closeForgotPassword} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>비밀번호 찾기</Text>

          {foundPassword ? (
            <>
              <Text style={styles.modalDesc}>비밀번호가 초기화되었습니다.</Text>
              <View style={styles.passwordResultBox}>
                <Text style={styles.passwordResultLabel}>새 비밀번호</Text>
                <Text style={styles.passwordResultValue}>{foundPassword}</Text>
              </View>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                로그인 후 비밀번호 변경이 요청됩니다.
              </Text>
              <Button mode="contained" onPress={closeForgotPassword}>
                확인
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.modalDesc}>계정 정보를 입력해주세요.</Text>
              <TextInput
                label="이메일 (계정)"
                value={resetEmail}
                onChangeText={setResetEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="생일 (YYYY-MM-DD)"
                value={resetBirthday}
                onChangeText={setResetBirthday}
                mode="outlined"
                style={styles.input}
                placeholder="예: 1998-03-17"
              />
              <TextInput
                label="전화번호"
                value={resetPhone}
                onChangeText={setResetPhone}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="예: 010-1234-5678"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button mode="outlined" onPress={closeForgotPassword} style={{ flex: 1 }}>
                  취소
                </Button>
                <Button mode="contained" onPress={handleResetPassword} loading={resetLoading} style={{ flex: 1 }}>
                  비밀번호 찾기
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFF', textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  subtitle: { fontSize: 18, color: '#E0E0E0', textAlign: 'center', marginBottom: 24, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  card: { borderRadius: 16, elevation: 4 },
  input: { marginBottom: 12 },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  button: { marginTop: 4, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  checkboxRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  checkboxItem: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 14, color: COLORS.text },
  modal: {
    backgroundColor: '#FFF',
    margin: 24,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  passwordResultBox: { backgroundColor: '#E8F4FD', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12 },
  passwordResultLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  passwordResultValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 8 },
});
