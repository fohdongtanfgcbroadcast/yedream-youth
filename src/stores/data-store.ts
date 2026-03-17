import { create } from 'zustand';
import {
  Member,
  DiscipleshipClass,
  AttendanceRecord,
  FamilyGroup,
  AttendanceType,
  IndividualRanking,
  ClassRanking,
} from '../types';

// ============ Mock 데이터 ============

const MOCK_CLASSES: DiscipleshipClass[] = [
  { id: 'c1', name: '제자반 1반', instructor_id: 'instructor-001', description: '신입 제자반', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'c2', name: '제자반 2반', instructor_id: 'instructor-002', description: '중급 제자반', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'c3', name: '제자반 3반', instructor_id: 'instructor-003', description: '고급 제자반', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const MOCK_FAMILY_GROUPS: FamilyGroup[] = [
  { id: 'f1', family_name: '김씨 가족', created_at: '2024-01-01' },
  { id: 'f2', family_name: '이씨 가족', created_at: '2024-01-01' },
  { id: 'f3', family_name: '박씨 가족', created_at: '2024-01-01' },
];

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '김철수', date_of_birth: '1998-03-17', phone: '010-1111-1111', class_id: 'c1', family_group_id: 'f1', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm2', name: '김영희', date_of_birth: '1999-07-22', phone: '010-1111-2222', class_id: 'c1', family_group_id: 'f1', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm3', name: '이민수', date_of_birth: '1997-11-05', phone: '010-2222-1111', class_id: 'c1', family_group_id: 'f2', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm4', name: '이수진', date_of_birth: '2000-01-15', phone: '010-2222-2222', class_id: 'c2', family_group_id: 'f2', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm5', name: '박지훈', date_of_birth: '1998-05-30', phone: '010-3333-1111', class_id: 'c2', family_group_id: 'f3', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm6', name: '박서연', date_of_birth: '1999-09-12', phone: '010-3333-2222', class_id: 'c2', family_group_id: 'f3', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm7', name: '정우성', date_of_birth: '1997-12-25', phone: '010-4444-1111', class_id: 'c3', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm8', name: '최예린', date_of_birth: '2001-04-08', phone: '010-5555-1111', class_id: 'c3', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm9', name: '한소희', date_of_birth: '2000-06-20', phone: '010-6666-1111', class_id: 'c3', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'm10', name: '송민호', date_of_birth: '1998-08-14', phone: '010-7777-1111', class_id: 'c1', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // 최근 출석 데이터
  { id: 'a1', member_id: 'm1', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a2', member_id: 'm2', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a3', member_id: 'm3', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a4', member_id: 'm4', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a5', member_id: 'm5', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a6', member_id: 'm7', attendance_type: '주일예배', attendance_date: '2026-03-15', points: 1, created_at: '2026-03-15' },
  { id: 'a7', member_id: 'm1', attendance_type: '제자교육', attendance_date: '2026-03-14', points: 1, created_at: '2026-03-14' },
  { id: 'a8', member_id: 'm2', attendance_type: '제자교육', attendance_date: '2026-03-14', points: 1, created_at: '2026-03-14' },
  { id: 'a9', member_id: 'm4', attendance_type: '제자교육', attendance_date: '2026-03-14', points: 1, created_at: '2026-03-14' },
  { id: 'a10', member_id: 'm7', attendance_type: '제자교육', attendance_date: '2026-03-14', points: 1, created_at: '2026-03-14' },
  { id: 'a11', member_id: 'm8', attendance_type: '제자교육', attendance_date: '2026-03-14', points: 1, created_at: '2026-03-14' },
  { id: 'a12', member_id: 'm1', attendance_type: '철야', attendance_date: '2026-03-13', points: 1, created_at: '2026-03-13' },
  { id: 'a13', member_id: 'm3', attendance_type: '철야', attendance_date: '2026-03-13', points: 1, created_at: '2026-03-13' },
  { id: 'a14', member_id: 'm7', attendance_type: '철야', attendance_date: '2026-03-13', points: 1, created_at: '2026-03-13' },
  { id: 'a15', member_id: 'm5', attendance_type: '주일예배', attendance_date: '2026-03-08', points: 1, created_at: '2026-03-08' },
  { id: 'a16', member_id: 'm6', attendance_type: '주일예배', attendance_date: '2026-03-08', points: 1, created_at: '2026-03-08' },
  { id: 'a17', member_id: 'm1', attendance_type: '주일예배', attendance_date: '2026-03-08', points: 1, created_at: '2026-03-08' },
  { id: 'a18', member_id: 'm9', attendance_type: '주일예배', attendance_date: '2026-03-08', points: 1, created_at: '2026-03-08' },
  { id: 'a19', member_id: 'm10', attendance_type: '주일예배', attendance_date: '2026-03-08', points: 1, created_at: '2026-03-08' },
  { id: 'a20', member_id: 'm10', attendance_type: '제자교육', attendance_date: '2026-03-07', points: 1, created_at: '2026-03-07' },
];

// ============ Store ============

interface DataState {
  members: Member[];
  classes: DiscipleshipClass[];
  familyGroups: FamilyGroup[];
  attendanceRecords: AttendanceRecord[];

  // 회원 관리
  addMember: (member: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getMembersByClass: (classId: string) => Member[];
  getMembersByFamily: (familyGroupId: string) => Member[];

  // 제자반 관리
  addClass: (cls: Omit<DiscipleshipClass, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  updateClass: (id: string, updates: Partial<DiscipleshipClass>) => void;
  deleteClass: (id: string) => void;

  // 출석 관리
  addAttendance: (memberId: string, type: AttendanceType, date: string, recordedBy?: string) => void;
  removeAttendance: (id: string) => void;
  getAttendanceByMember: (memberId: string) => AttendanceRecord[];
  getAttendanceByDate: (date: string) => AttendanceRecord[];
  getAttendanceByDateAndType: (date: string, type: AttendanceType) => AttendanceRecord[];

  // 순위
  getIndividualRankings: () => IndividualRanking[];
  getClassRankings: () => ClassRanking[];

  // 검색
  searchMembers: (query: string) => Member[];

  // 통계
  getTodayAttendanceSummary: () => { type: AttendanceType; count: number }[];
  getBirthdayMembers: () => Member[];
}

let nextId = 100;

export const useDataStore = create<DataState>((set, get) => ({
  members: MOCK_MEMBERS,
  classes: MOCK_CLASSES,
  familyGroups: MOCK_FAMILY_GROUPS,
  attendanceRecords: MOCK_ATTENDANCE,

  // 회원 관리
  addMember: (member) => {
    const newMember: Member = {
      ...member,
      id: `m${nextId++}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ members: [...s.members, newMember] }));
  },

  updateMember: (id, updates) => {
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m)),
    }));
  },

  deleteMember: (id) => {
    set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
  },

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getMembersByClass: (classId) => get().members.filter((m) => m.class_id === classId && m.is_active),

  getMembersByFamily: (familyGroupId) => get().members.filter((m) => m.family_group_id === familyGroupId),

  // 제자반 관리
  addClass: (cls) => {
    const newClass: DiscipleshipClass = {
      ...cls,
      id: `c${nextId++}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ classes: [...s.classes, newClass] }));
  },

  updateClass: (id, updates) => {
    set((s) => ({
      classes: s.classes.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)),
    }));
  },

  deleteClass: (id) => {
    set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }));
  },

  // 출석 관리
  addAttendance: (memberId, type, date, recordedBy) => {
    const existing = get().attendanceRecords.find(
      (a) => a.member_id === memberId && a.attendance_type === type && a.attendance_date === date
    );
    if (existing) return; // 중복 방지

    const record: AttendanceRecord = {
      id: `a${nextId++}`,
      member_id: memberId,
      attendance_type: type,
      attendance_date: date,
      points: 1,
      recorded_by: recordedBy,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ attendanceRecords: [...s.attendanceRecords, record] }));
  },

  removeAttendance: (id) => {
    set((s) => ({ attendanceRecords: s.attendanceRecords.filter((a) => a.id !== id) }));
  },

  getAttendanceByMember: (memberId) =>
    get().attendanceRecords.filter((a) => a.member_id === memberId).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)),

  getAttendanceByDate: (date) =>
    get().attendanceRecords.filter((a) => a.attendance_date === date),

  getAttendanceByDateAndType: (date, type) =>
    get().attendanceRecords.filter((a) => a.attendance_date === date && a.attendance_type === type),

  // 개인별 순위: 총 출석 점수 높은 순
  getIndividualRankings: () => {
    const { members, attendanceRecords } = get();
    const stats = members
      .filter((m) => m.is_active)
      .map((m) => {
        const records = attendanceRecords.filter((a) => a.member_id === m.id);
        const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
        const daysAttended = new Set(records.map((r) => r.attendance_date)).size;
        const cls = get().classes.find((c) => c.id === m.class_id);
        return {
          member_id: m.id,
          name: m.name,
          class_id: m.class_id,
          class_name: cls?.name,
          total_points: totalPoints,
          days_attended: daysAttended,
          point_rank: 0,
        };
      })
      .sort((a, b) => b.total_points - a.total_points);

    // 등수 부여 (동점 시 동일 등수)
    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) {
        rank = i + 1;
      }
      stats[i].point_rank = rank;
    }
    return stats;
  },

  // 제자반별 순위: 점수등수 + 출석률등수 합산
  getClassRankings: () => {
    const { members, classes, attendanceRecords } = get();

    const stats = classes
      .filter((c) => c.is_active)
      .map((c) => {
        const classMembers = members.filter((m) => m.class_id === c.id && m.is_active);
        const memberCount = classMembers.length;
        const classRecords = attendanceRecords.filter((a) => classMembers.some((m) => m.id === a.member_id));
        const totalPoints = classRecords.reduce((sum, r) => sum + r.points, 0);

        // 출석률: 출석한 고유 멤버 수 / 전체 멤버 수
        const attendedMembers = new Set(classRecords.map((r) => r.member_id)).size;
        const attendanceRate = memberCount > 0 ? Math.round((attendedMembers / memberCount) * 100) : 0;

        return {
          class_id: c.id,
          class_name: c.name,
          member_count: memberCount,
          total_points: totalPoints,
          attendance_rate: attendanceRate,
          points_rank: 0,
          rate_rank: 0,
          combined_score: 0,
          final_rank: 0,
        };
      });

    // 점수 등수
    stats.sort((a, b) => b.total_points - a.total_points);
    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) rank = i + 1;
      stats[i].points_rank = rank;
    }

    // 출석률 등수
    stats.sort((a, b) => b.attendance_rate - a.attendance_rate);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].attendance_rate < stats[i - 1].attendance_rate) rank = i + 1;
      stats[i].rate_rank = rank;
    }

    // 합산 점수 → 최종 등수
    stats.forEach((s) => (s.combined_score = s.points_rank + s.rate_rank));
    stats.sort((a, b) => a.combined_score - b.combined_score);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].combined_score > stats[i - 1].combined_score) rank = i + 1;
      stats[i].final_rank = rank;
    }

    return stats;
  },

  // 검색
  searchMembers: (query) => {
    const q = query.toLowerCase();
    return get().members.filter(
      (m) => m.is_active && (m.name.toLowerCase().includes(q) || m.phone?.includes(q))
    );
  },

  // 오늘 출석 요약
  getTodayAttendanceSummary: () => {
    const today = new Date().toISOString().split('T')[0];
    const records = get().attendanceRecords.filter((a) => a.attendance_date === today);
    const types: AttendanceType[] = ['철야', '제자교육', '주일예배'];
    return types.map((type) => ({
      type,
      count: records.filter((r) => r.attendance_type === type).length,
    }));
  },

  // 생일자
  getBirthdayMembers: () => {
    const today = new Date();
    return get().members.filter((m) => {
      if (!m.date_of_birth || !m.is_active) return false;
      const dob = new Date(m.date_of_birth);
      return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
    });
  },
}));
