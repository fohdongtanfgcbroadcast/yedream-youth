import { create } from 'zustand';
import { Profile, UserRole } from '../types';

interface Account {
  email: string;
  password: string;
  profile: Profile & { assigned_class_ids?: string[] };
}

// 기본 계정 목록
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
    email: 'instructor@yedream.com',
    password: '1234',
    profile: {
      id: 'instructor-001', role: 'instructor', display_name: '박강사',
      phone: '010-2345-6789', assigned_class_ids: ['c1', 'c2'],
      created_at: '2024-01-01', updated_at: '2024-01-01',
    },
  },
];

interface AuthState {
  profile: (Profile & { assigned_class_ids?: string[] }) | null;
  accounts: Account[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  getAssignedClassIds: () => string[];
  createAccount: (email: string, password: string, displayName: string, role: UserRole, assignedClassIds?: string[]) => boolean;
  updateAccountClasses: (email: string, classIds: string[]) => void;
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
  getAssignedClassIds: () => (get().profile as any)?.assigned_class_ids || [],

  createAccount: (email, password, displayName, role, assignedClassIds) => {
    const exists = get().accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newAccount: Account = {
      email,
      password,
      profile: {
        id: `user-${accountNextId++}`,
        role,
        display_name: displayName,
        assigned_class_ids: role === 'instructor' ? (assignedClassIds || []) : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    set((s) => ({ accounts: [...s.accounts, newAccount] }));
    return true;
  },

  updateAccountClasses: (email, classIds) => {
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.email === email
          ? { ...a, profile: { ...a.profile, assigned_class_ids: classIds } }
          : a
      ),
    }));
    // 현재 로그인한 사용자의 반 배정도 갱신
    const current = get().profile;
    const account = get().accounts.find((a) => a.email === email);
    if (current && account && current.id === account.profile.id) {
      set({ profile: { ...current, assigned_class_ids: classIds } });
    }
  },

  getAccounts: () => get().accounts,

  deleteAccount: (email) => {
    set((s) => ({ accounts: s.accounts.filter((a) => a.email !== email) }));
  },
}));
