-- 일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_read" ON schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedules_insert" ON schedules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "schedules_update" ON schedules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "schedules_delete" ON schedules FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- profiles에 must_change_password 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- 비밀번호 재설정용 RPC 함수 (이메일 + 휴대폰 번호 일치 확인)
CREATE OR REPLACE FUNCTION verify_phone_for_reset(p_email TEXT, p_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND phone = p_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
