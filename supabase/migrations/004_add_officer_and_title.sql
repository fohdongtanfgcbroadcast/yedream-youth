-- 회원 직책 컬럼 추가
ALTER TABLE members ADD COLUMN IF NOT EXISTS title TEXT;
