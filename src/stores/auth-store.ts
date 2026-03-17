import { create } from 'zustand';
import { Profile, UserRole } from '../types';

// 프로토타입용 Mock 데이터
const MOCK_PROFILES: Record<string, Profile> = {
  admin: {
    id: 'admin-001',
    role: 'admin',
    display_name: '김관리',
    phone: '010-1234-5678',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  instructor: {
    id: 'instructor-001',
    role: 'instructor',
    display_name: '박강사',
    phone: '010-2345-6789',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  member: {
    id: 'member-001',
    role: 'member',
    display_name: '이청년',
    phone: '010-3456-7890',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
};

interface AuthState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (userId: string, _password: string) => {
    set({ isLoading: true });
    // 프로토타입: Mock 로그인
    await new Promise((r) => setTimeout(r, 500));
    const profile = MOCK_PROFILES[userId] || MOCK_PROFILES.admin;
    set({ profile, isAuthenticated: true, isLoading: false });
    return true;
  },

  logout: () => {
    set({ profile: null, isAuthenticated: false });
  },

  isAdmin: () => get().profile?.role === 'admin',
  isInstructor: () => get().profile?.role === 'instructor' || get().profile?.role === 'admin',
}));
