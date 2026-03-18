-- 비밀번호 찾기: 이메일 + 전화번호만으로 확인
CREATE OR REPLACE FUNCTION reset_password_simple(p_email TEXT, p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_new_password TEXT;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND phone = p_phone) THEN
    RETURN NULL;
  END IF;

  v_new_password := lpad(floor(random() * 10000)::TEXT, 4, '0');

  UPDATE auth.users
  SET encrypted_password = crypt(v_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  UPDATE profiles SET must_change_password = true WHERE id = v_user_id;

  RETURN v_new_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
