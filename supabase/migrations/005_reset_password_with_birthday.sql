-- 비밀번호 찾기: 이메일 + 전화번호 + 생일 확인 후 비밀번호 초기화
CREATE OR REPLACE FUNCTION reset_password_with_verification(
  p_email TEXT,
  p_phone TEXT,
  p_birthday TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_new_password TEXT;
BEGIN
  -- 1. 이메일로 사용자 찾기
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  -- 2. 전화번호 확인 (profiles 테이블)
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND phone = p_phone) THEN
    RETURN NULL;
  END IF;

  -- 3. 생일 확인 (members 테이블 - profile_id 또는 phone 매칭)
  IF NOT EXISTS (
    SELECT 1 FROM members
    WHERE (profile_id = v_user_id OR phone = p_phone)
    AND date_of_birth = p_birthday::DATE
    AND is_active = true
  ) THEN
    RETURN NULL;
  END IF;

  -- 4. 랜덤 4자리 비밀번호 생성
  v_new_password := lpad(floor(random() * 10000)::TEXT, 4, '0');

  -- 5. 비밀번호 초기화
  UPDATE auth.users
  SET encrypted_password = crypt(v_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  -- 6. 다음 로그인 시 비밀번호 변경 요청
  UPDATE profiles SET must_change_password = true WHERE id = v_user_id;

  RETURN v_new_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
