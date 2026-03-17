-- =============================================
-- 예닮드림 청년부 재적관리 시스템 DB 스키마
-- =============================================

-- ENUM 타입 생성
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'member');
CREATE TYPE attendance_type AS ENUM ('철야', '제자교육', '주일예배');

-- 확장 기능 (한국어 퍼지 검색)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- 1. 사용자 프로필 (Supabase auth.users 연동)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 2. 가족 그룹
-- =============================================
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 3. 제자반
-- =============================================
CREATE TABLE discipleship_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. 교인 정보
-- =============================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  address TEXT,
  notes TEXT,
  family_group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL,
  class_id UUID REFERENCES discipleship_classes(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5. 출석 기록
-- =============================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attendance_type attendance_type NOT NULL,
  attendance_date DATE NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, attendance_type, attendance_date)
);

-- =============================================
-- 6. 푸시 알림 토큰
-- =============================================
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, expo_push_token)
);

-- =============================================
-- 7. 예약 알림
-- =============================================
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_role user_role,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_members_class ON members(class_id);
CREATE INDEX idx_members_family ON members(family_group_id);
CREATE INDEX idx_members_name ON members USING gin(name gin_trgm_ops);
CREATE INDEX idx_attendance_member ON attendance_records(member_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_type_date ON attendance_records(attendance_type, attendance_date);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- 헬퍼 함수: 현재 사용자 역할
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 프로필 정책
CREATE POLICY "읽기: 모든 인증 사용자" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "수정: 본인만" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "관리: 관리자" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- 회원 정책
CREATE POLICY "읽기: 인증 사용자" ON members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "관리: 관리자" ON members FOR ALL USING (get_user_role() = 'admin');

-- 제자반 정책
CREATE POLICY "읽기: 인증 사용자" ON discipleship_classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "관리: 관리자" ON discipleship_classes FOR ALL USING (get_user_role() = 'admin');

-- 출석 정책
CREATE POLICY "읽기: 인증 사용자" ON attendance_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "관리: 관리자" ON attendance_records FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "입력: 강사" ON attendance_records FOR INSERT
  WITH CHECK (
    get_user_role() = 'instructor'
    AND member_id IN (
      SELECT m.id FROM members m
      JOIN discipleship_classes dc ON m.class_id = dc.id
      WHERE dc.instructor_id = auth.uid()
    )
  );

-- 가족 정책
CREATE POLICY "읽기: 인증 사용자" ON family_groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "관리: 관리자" ON family_groups FOR ALL USING (get_user_role() = 'admin');

-- 푸시 토큰 정책
CREATE POLICY "본인 관리" ON push_tokens FOR ALL USING (profile_id = auth.uid());

-- 예약 알림 정책
CREATE POLICY "읽기: 인증 사용자" ON scheduled_notifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "관리: 관리자" ON scheduled_notifications FOR ALL USING (get_user_role() = 'admin');

-- =============================================
-- 개인별 순위 뷰
-- =============================================
CREATE VIEW individual_rankings AS
SELECT
  m.id AS member_id,
  m.name,
  m.class_id,
  dc.name AS class_name,
  COUNT(ar.id) AS total_points,
  COUNT(DISTINCT ar.attendance_date) AS days_attended,
  RANK() OVER (ORDER BY COUNT(ar.id) DESC) AS point_rank
FROM members m
LEFT JOIN attendance_records ar ON m.id = ar.member_id
LEFT JOIN discipleship_classes dc ON m.class_id = dc.id
WHERE m.is_active = true
GROUP BY m.id, m.name, m.class_id, dc.name;

-- =============================================
-- 제자반별 순위 뷰
-- =============================================
CREATE VIEW class_rankings AS
WITH class_stats AS (
  SELECT
    dc.id AS class_id,
    dc.name AS class_name,
    COUNT(DISTINCT m.id) AS member_count,
    COALESCE(SUM(ar.points), 0) AS total_points,
    CASE WHEN COUNT(DISTINCT m.id) = 0 THEN 0
         ELSE ROUND(
           COUNT(DISTINCT ar.member_id)::NUMERIC / COUNT(DISTINCT m.id) * 100, 2
         )
    END AS attendance_rate
  FROM discipleship_classes dc
  LEFT JOIN members m ON m.class_id = dc.id AND m.is_active = true
  LEFT JOIN attendance_records ar ON ar.member_id = m.id
  WHERE dc.is_active = true
  GROUP BY dc.id, dc.name
),
ranked AS (
  SELECT
    *,
    RANK() OVER (ORDER BY total_points DESC) AS points_rank,
    RANK() OVER (ORDER BY attendance_rate DESC) AS rate_rank
  FROM class_stats
)
SELECT
  *,
  points_rank + rate_rank AS combined_score,
  RANK() OVER (ORDER BY points_rank + rate_rank ASC) AS final_rank
FROM ranked;

-- =============================================
-- 생일 조회 함수
-- =============================================
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(member_id UUID, name TEXT, date_of_birth DATE, class_id UUID, instructor_id UUID)
AS $$
  SELECT m.id, m.name, m.date_of_birth, m.class_id, dc.instructor_id
  FROM members m
  LEFT JOIN discipleship_classes dc ON m.class_id = dc.id
  WHERE m.is_active = true
    AND m.date_of_birth IS NOT NULL
    AND (
      (EXTRACT(MONTH FROM m.date_of_birth), EXTRACT(DAY FROM m.date_of_birth))
      IN (
        SELECT EXTRACT(MONTH FROM d), EXTRACT(DAY FROM d)
        FROM generate_series(CURRENT_DATE, CURRENT_DATE + (days_ahead || ' days')::INTERVAL, '1 day') AS d
      )
    );
$$ LANGUAGE sql SECURITY DEFINER;
