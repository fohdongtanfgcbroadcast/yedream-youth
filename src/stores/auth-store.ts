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
  // 강사 계정 - 각 반에 배정
  instructor1: {
    id: 'instructor-001',
    role: 'instructor',
    display_name: '박강사',
    phone: '010-2345-6789',
    assigned_class_id: 'c1', // 1반 담당
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  instructor2: {
    id: 'instructor-002',
    role: 'instructor',
    display_name: '최강사',
    phone: '010-3456-7890',
    assigned_class_id: 'c2', // 2반 담당
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  instructor3: {
    id: 'instructor-003',
    role: 'instructor',
    display_name: '정강사',
    phone: '010-4567-8901',
    assigned_class_id: 'c3', // 3반 담당
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  member: {
    id: 'member-001',
    role: 'member',
    display_name: '이청년',
    phone: '010-5678-9012',
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
  getAssignedClassId: () => string | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (userId: string, _password: string) => {
    set({ isLoading: true });
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
  getAssignedClassId: () => (get().profile as any)?.assigned_class_id,
}));
