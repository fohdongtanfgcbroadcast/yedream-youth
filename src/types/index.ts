// 사용자 역할
export type UserRole = 'admin' | 'instructor' | 'member';

// 출석 유형
export type AttendanceType = '철야' | '제자교육' | '주일예배';

// 사용자 프로필
export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  phone?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

// 교인 정보
export interface Member {
  id: string;
  name: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  notes?: string;
  family_group_id?: string;
  class_id?: string;
  profile_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  discipleship_class?: DiscipleshipClass;
  family_group?: FamilyGroup;
}

// 가족 그룹
export interface FamilyGroup {
  id: string;
  family_name: string;
  notes?: string;
  created_at: string;
  members?: Member[];
}

// 제자반
export interface DiscipleshipClass {
  id: string;
  name: string;
  instructor_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  instructor?: Profile;
  members?: Member[];
}

// 출석 기록
export interface AttendanceRecord {
  id: string;
  member_id: string;
  attendance_type: AttendanceType;
  attendance_date: string;
  points: number;
  recorded_by?: string;
  created_at: string;
  // 조인 데이터
  member?: Member;
}

// 개인별 순위
export interface IndividualRanking {
  member_id: string;
  name: string;
  class_id?: string;
  class_name?: string;
  total_points: number;
  days_attended: number;
  point_rank: number;
}

// 제자반별 순위
export interface ClassRanking {
  class_id: string;
  class_name: string;
  member_count: number;
  total_points: number;
  attendance_rate: number;
  points_rank: number;
  rate_rank: number;
  combined_score: number;
  final_rank: number;
}

// 예약 알림
export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  target_role?: UserRole;
  cron_expression: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

// 일정
export interface Schedule {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  created_by?: string;
  created_at: string;
}
