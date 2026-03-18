-- date_of_birth를 DATE → TEXT로 변경하고 MM-DD만 저장
ALTER TABLE members ALTER COLUMN date_of_birth TYPE TEXT USING
  CASE WHEN date_of_birth IS NOT NULL THEN to_char(date_of_birth, 'MM-DD') ELSE NULL END;
