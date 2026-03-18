import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Member,
  DiscipleshipClass,
  AttendanceRecord,
  FamilyGroup,
  AttendanceType,
  IndividualRanking,
  ClassRanking,
  Schedule,
} from '../types';

interface DataState {
  members: Member[];
  classes: DiscipleshipClass[];
  familyGroups: FamilyGroup[];
  attendanceRecords: AttendanceRecord[];
  schedules: Schedule[];
  isLoading: boolean;

  // 데이터 로드
  loadAll: () => Promise<void>;
  loadMembers: () => Promise<void>;
  loadClasses: () => Promise<void>;
  loadAttendance: () => Promise<void>;
  loadFamilyGroups: () => Promise<void>;
  loadSchedules: () => Promise<void>;

  // 회원 관리
  addMember: (member: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => Member | undefined;
  getMembersByClass: (classId: string) => Member[];
  getMembersByFamily: (familyGroupId: string) => Member[];

  // 제자반 관리
  addClass: (cls: Omit<DiscipleshipClass, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<void>;
  updateClass: (id: string, updates: Partial<DiscipleshipClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  // 출석 관리
  addAttendance: (memberId: string, type: AttendanceType, date: string, recordedBy?: string) => Promise<void>;
  removeAttendance: (id: string) => Promise<void>;
  getAttendanceByMember: (memberId: string) => AttendanceRecord[];
  getAttendanceByDate: (date: string) => AttendanceRecord[];
  getAttendanceByDateAndType: (date: string, type: AttendanceType) => AttendanceRecord[];

  // 일정 관리
  addSchedule: (schedule: { title: string; description?: string; event_date: string; created_by?: string }) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // 순위
  getIndividualRankings: () => IndividualRanking[];
  getClassRankings: () => ClassRanking[];

  // 검색
  searchMembers: (query: string) => Member[];

  // 통계
  getTodayAttendanceSummary: () => { type: AttendanceType; count: number }[];
  getBirthdayMembers: () => Member[];
}

export const useDataStore = create<DataState>((set, get) => ({
  members: [],
  classes: [],
  familyGroups: [],
  attendanceRecords: [],
  schedules: [],
  isLoading: false,

  // ============ 데이터 로드 ============

  loadAll: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().loadMembers(),
      get().loadClasses(),
      get().loadAttendance(),
      get().loadFamilyGroups(),
      get().loadSchedules(),
    ]);
    set({ isLoading: false });
  },

  loadMembers: async () => {
    const { data } = await supabase.from('members').select('*').eq('is_active', true).order('name');
    if (data) set({ members: data });
  },

  loadClasses: async () => {
    const { data } = await supabase.from('discipleship_classes').select('*').eq('is_active', true).order('name');
    if (data) set({ classes: data });
  },

  loadAttendance: async () => {
    const { data } = await supabase.from('attendance_records').select('*').order('attendance_date', { ascending: false });
    if (data) set({ attendanceRecords: data });
  },

  loadFamilyGroups: async () => {
    const { data } = await supabase.from('family_groups').select('*').order('family_name');
    if (data) set({ familyGroups: data });
  },

  loadSchedules: async () => {
    const { data } = await supabase.from('schedules').select('*').order('event_date', { ascending: true });
    if (data) set({ schedules: data });
  },

  // ============ 회원 관리 ============

  addMember: async (member) => {
    const { data, error } = await supabase.from('members').insert({
      name: member.name,
      date_of_birth: member.date_of_birth || null,
      phone: member.phone || null,
      address: member.address || null,
      notes: member.notes || null,
      title: member.title || null,
      family_group_id: member.family_group_id || null,
      class_id: member.class_id || null,
    }).select().single();

    if (data) set((s) => ({ members: [...s.members, data] }));
  },

  updateMember: async (id, updates) => {
    // undefined → null 변환, 조인 데이터 제거
    const cleanUpdates: Record<string, any> = {};
    const validColumns = ['name', 'date_of_birth', 'phone', 'address', 'notes', 'title', 'family_group_id', 'class_id', 'profile_id', 'is_active'];
    Object.entries(updates).forEach(([key, value]) => {
      if (validColumns.includes(key)) {
        cleanUpdates[key] = value === undefined ? null : value;
      }
    });

    // 디버깅: 실제 전송 데이터 확인
    console.log('updateMember id:', id);
    console.log('updateMember cleanUpdates:', JSON.stringify(cleanUpdates));

    const { data, error, count } = await supabase
      .from('members')
      .update(cleanUpdates)
      .eq('id', id)
      .select();

    console.log('updateMember result:', { data, error, count });

    if (error) {
      if (typeof window !== 'undefined') window.alert('DB 수정 오류: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      if (typeof window !== 'undefined') window.alert('수정된 행이 없습니다. RLS 정책을 확인하세요.\n\nID: ' + id);
      return;
    }

    // 업데이트 성공 후 전체 멤버 다시 로드
    await get().loadMembers();
  },

  deleteMember: async (id) => {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
  },

  getMemberById: (id) => get().members.find((m) => m.id === id),
  getMembersByClass: (classId) => get().members.filter((m) => m.class_id === classId && m.is_active),
  getMembersByFamily: (familyGroupId) => get().members.filter((m) => m.family_group_id === familyGroupId),

  // ============ 제자반 관리 ============

  addClass: async (cls) => {
    const { data } = await supabase.from('discipleship_classes').insert({
      name: cls.name,
      description: cls.description || null,
      instructor_id: cls.instructor_id || null,
    }).select().single();

    if (data) set((s) => ({ classes: [...s.classes, data] }));
  },

  updateClass: async (id, updates) => {
    const { error } = await supabase.from('discipleship_classes').update(updates).eq('id', id);
    if (!error) {
      set((s) => ({
        classes: s.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    }
  },

  deleteClass: async (id) => {
    const { error } = await supabase.from('discipleship_classes').delete().eq('id', id);
    if (!error) set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }));
  },

  // ============ 출석 관리 ============

  addAttendance: async (memberId, type, date, recordedBy) => {
    // 중복 체크
    const existing = get().attendanceRecords.find(
      (a) => a.member_id === memberId && a.attendance_type === type && a.attendance_date === date
    );
    if (existing) return;

    const { data } = await supabase.from('attendance_records').insert({
      member_id: memberId,
      attendance_type: type,
      attendance_date: date,
      points: 1,
      recorded_by: recordedBy || null,
    }).select().single();

    if (data) set((s) => ({ attendanceRecords: [data, ...s.attendanceRecords] }));
  },

  removeAttendance: async (id) => {
    const { error } = await supabase.from('attendance_records').delete().eq('id', id);
    if (!error) set((s) => ({ attendanceRecords: s.attendanceRecords.filter((a) => a.id !== id) }));
  },

  getAttendanceByMember: (memberId) =>
    get().attendanceRecords.filter((a) => a.member_id === memberId).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)),

  getAttendanceByDate: (date) =>
    get().attendanceRecords.filter((a) => a.attendance_date === date),

  getAttendanceByDateAndType: (date, type) =>
    get().attendanceRecords.filter((a) => a.attendance_date === date && a.attendance_type === type),

  // ============ 일정 관리 ============

  addSchedule: async (schedule) => {
    const { data } = await supabase.from('schedules').insert({
      title: schedule.title,
      description: schedule.description || null,
      event_date: schedule.event_date,
      created_by: schedule.created_by || null,
    }).select().single();

    if (data) set((s) => ({ schedules: [...s.schedules, data] }));
  },

  deleteSchedule: async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) }));
  },

  // ============ 순위 ============

  getIndividualRankings: () => {
    const { members, attendanceRecords, classes } = get();
    const stats = members
      .filter((m) => m.is_active)
      .map((m) => {
        const records = attendanceRecords.filter((a) => a.member_id === m.id);
        const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
        const daysAttended = new Set(records.map((r) => r.attendance_date)).size;
        const cls = classes.find((c) => c.id === m.class_id);
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

    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) rank = i + 1;
      stats[i].point_rank = rank;
    }
    return stats;
  },

  getClassRankings: () => {
    const { members, classes, attendanceRecords } = get();
    const stats = classes
      .filter((c) => c.is_active)
      .map((c) => {
        const classMembers = members.filter((m) => m.class_id === c.id && m.is_active);
        const memberCount = classMembers.length;
        const classRecords = attendanceRecords.filter((a) => classMembers.some((m) => m.id === a.member_id));
        const totalPoints = classRecords.reduce((sum, r) => sum + r.points, 0);
        const attendedMembers = new Set(classRecords.map((r) => r.member_id)).size;
        const attendanceRate = memberCount > 0 ? Math.round((attendedMembers / memberCount) * 100) : 0;

        return {
          class_id: c.id, class_name: c.name, member_count: memberCount,
          total_points: totalPoints, attendance_rate: attendanceRate,
          points_rank: 0, rate_rank: 0, combined_score: 0, final_rank: 0,
        };
      });

    stats.sort((a, b) => b.total_points - a.total_points);
    let rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].total_points < stats[i - 1].total_points) rank = i + 1;
      stats[i].points_rank = rank;
    }

    stats.sort((a, b) => b.attendance_rate - a.attendance_rate);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].attendance_rate < stats[i - 1].attendance_rate) rank = i + 1;
      stats[i].rate_rank = rank;
    }

    stats.forEach((s) => (s.combined_score = s.points_rank + s.rate_rank));
    stats.sort((a, b) => a.combined_score - b.combined_score);
    rank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].combined_score > stats[i - 1].combined_score) rank = i + 1;
      stats[i].final_rank = rank;
    }

    return stats;
  },

  // ============ 검색 ============

  searchMembers: (query) => {
    const q = query.toLowerCase();
    const { classes } = get();
    return get().members.filter((m) => {
      if (!m.is_active) return false;
      if (m.name.toLowerCase().includes(q)) return true;
      const cls = classes.find((c) => c.id === m.class_id);
      if (cls && cls.name.toLowerCase().includes(q)) return true;
      return false;
    });
  },

  // ============ 통계 ============

  getTodayAttendanceSummary: () => {
    const today = new Date().toISOString().split('T')[0];
    const records = get().attendanceRecords.filter((a) => a.attendance_date === today);
    const types: AttendanceType[] = ['철야', '제자교육', '주일예배'];
    return types.map((type) => ({
      type,
      count: records.filter((r) => r.attendance_type === type).length,
    }));
  },

  getBirthdayMembers: () => {
    const today = new Date();
    return get().members.filter((m) => {
      if (!m.date_of_birth || !m.is_active) return false;
      const dob = new Date(m.date_of_birth);
      return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
    });
  },
}));
