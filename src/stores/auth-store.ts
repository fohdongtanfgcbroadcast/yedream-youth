import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

interface ExtendedProfile extends Profile {
  assigned_class_ids?: string[];
}

interface AuthState {
  profile: ExtendedProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  getAssignedClassIds: () => string[];
  loadProfile: () => Promise<void>;
  createInstructorAccount: (email: string, password: string, displayName: string, assignedClassIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  loginError: null,

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

    set({
      profile: profileData as ExtendedProfile,
      isAuthenticated: true,
      isLoading: false,
      loginError: null,
    });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ profile: null, isAuthenticated: false, loginError: null });
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
      });
    }
  },

  // 강사 계정 생성 (관리자 전용) - Supabase Auth로 가입 후 profiles에 등록
  createInstructorAccount: async (email, password, displayName, assignedClassIds) => {
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
        assigned_class_ids: assignedClassIds,
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  },
}));
