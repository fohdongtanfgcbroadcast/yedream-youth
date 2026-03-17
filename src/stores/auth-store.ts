import { create } from 'zustand';
import { Profile, UserRole } from '../types';

interface Account {
  email: string;
  password: string;
  profile: Profile;
}

// 기본 계정 목록 (관리자가 추가 가능)
const DEFAULT_ACCOUNTS: Account[] = [
  {
    email: 'admin@yedream.com',
    password: 'admin123',
    profile: {
      id: 'admin-001', role: 'admin', display_name: '김관리',
      phone: '010-1234-5678', created_at: '2024-01-01', updated_at: '2024-01-01',
    },
  },
  {
    email: 'instructor1@yedream.com',
    password: '1234',
    profile: {
      id: 'instructor-001', role: 'instructor', display_name: '박강사 (1반)',
      phone: '010-2345-6789', assigned_class_id: 'c1',
      created_at: '2024-01-01', updated_at: '2024-01-01',
    },
  },
  {
    email: 'instructor2@yedream.com',
    password: '1234',
    profile: {
      id: 'instructor-002', role: 'instructor', display_name: '최강사 (2반)',
      phone: '010-3456-7890', assigned_class_id: 'c2',
      created_at: '2024-01-01', updated_at: '2024-01-01',
    },
  },
  {
    email: 'instructor3@yedream.com',
    password: '1234',
    profile: {
      id: 'instructor-003', role: 'instructor', display_name: '정강사 (3반)',
      phone: '010-4567-8901', assigned_class_id: 'c3',
      created_at: '2024-01-01', updated_at: '2024-01-01',
    },
  },
];

interface AuthState {
  profile: Profile | null;
  accounts: Account[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  getAssignedClassId: () => string | undefined;
  createAccount: (email: string, password: string, displayName: string, role: UserRole, assignedClassId?: string) => boolean;
  getAccounts: () => Account[];
  deleteAccount: (email: string) => void;
}

let accountNextId = 200;

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  accounts: [...DEFAULT_ACCOUNTS],
  isAuthenticated: false,
  isLoading: false,
  loginError: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null });
    await new Promise((r) => setTimeout(r, 300));

    const account = get().accounts.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (!account) {
      set({ isLoading: false, loginError: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return false;
    }

    set({ profile: account.profile, isAuthenticated: true, isLoading: false, loginError: null });
    return true;
  },

  logout: () => {
    set({ profile: null, isAuthenticated: false, loginError: null });
  },

  isAdmin: () => get().profile?.role === 'admin',
  isInstructor: () => get().profile?.role === 'instructor' || get().profile?.role === 'admin',
  getAssignedClassId: () => (get().profile as any)?.assigned_class_id,

  createAccount: (email, password, displayName, role, assignedClassId) => {
    const exists = get().accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newAccount: Account = {
      email,
      password,
      profile: {
        id: `user-${accountNextId++}`,
        role,
        display_name: displayName,
        assigned_class_id: role === 'instructor' ? assignedClassId : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any,
    };
    set((s) => ({ accounts: [...s.accounts, newAccount] }));
    return true;
  },

  getAccounts: () => get().accounts,

  deleteAccount: (email) => {
    set((s) => ({ accounts: s.accounts.filter((a) => a.email !== email) }));
  },
}));
