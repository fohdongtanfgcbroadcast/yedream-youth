import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { storage } from '../lib/utils';

interface ExtendedProfile extends Profile {
  assigned_class_ids?: string[];
}

interface AuthState {
  profile: ExtendedProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  getAssignedClassIds: () => string[];
  loadProfile: () => Promise<void>;
  createInstructorAccount: (email: string, password: string, displayName: string, phone: string, assignedClassIds: string[]) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordByPhone: (email: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  autoLogin: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  loginError: null,
  mustChangePassword: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      set({ isLoading: false, loginError: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return false;
    }

    // profiles 테이블에서 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profileData) {
      set({ isLoading: false, loginError: '프로필 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' });
      return false;
    }

    const mustChange = profileData.must_change_password === true;

    set({
      profile: profileData as ExtendedProfile,
      isAuthenticated: true,
      isLoading: false,
      loginError: null,
      mustChangePassword: mustChange,
    });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ profile: null, isAuthenticated: false, loginError: null, mustChangePassword: false });
  },

  isAdmin: () => get().profile?.role === 'admin',
  isInstructor: () => get().profile?.role === 'instructor' || get().profile?.role === 'admin',
  getAssignedClassIds: () => get().profile?.assigned_class_ids || [],

  loadProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      set({
        profile: profileData as ExtendedProfile,
        isAuthenticated: true,
        mustChangePassword: profileData.must_change_password === true,
      });
    }
  },

  // 자동 로그인
  autoLogin: async () => {
    const savedEmail = storage.getItem('autoLogin_email');
    const savedPassword = storage.getItem('autoLogin_password');
    if (!savedEmail || !savedPassword) return false;
    return await get().login(savedEmail, savedPassword);
  },

  // 비밀번호 변경
  changePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };

    // must_change_password 플래그 해제
    const profile = get().profile;
    if (profile) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile.id);
      set({ mustChangePassword: false, profile: { ...profile, must_change_password: false } });
    }
    return { success: true };
  },

  // 휴대폰 번호로 비밀번호 재설정
  resetPasswordByPhone: async (email: string, phone: string) => {
    // RPC로 이메일+휴대폰 일치 확인
    const { data, error } = await supabase.rpc('verify_phone_for_reset', {
      p_email: email,
      p_phone: phone,
    });

    if (error || !data) {
      return { success: false, error: '이메일과 휴대폰 번호가 일치하지 않습니다.' };
    }

    // 비밀번호 재설정 이메일 발송
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      return { success: false, error: resetError.message };
    }

    return { success: true };
  },

  // 강사 계정 생성 (관리자 전용) - 휴대폰 번호 포함
  createInstructorAccount: async (email, password, displayName, phone, assignedClassIds) => {
    // 새 사용자 가입
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: '계정 생성에 실패했습니다.' };
    }

    // profiles 테이블에 등록
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        role: 'instructor',
        display_name: displayName,
        phone: phone || null,
        assigned_class_ids: assignedClassIds,
        must_change_password: true,
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  },
}));
