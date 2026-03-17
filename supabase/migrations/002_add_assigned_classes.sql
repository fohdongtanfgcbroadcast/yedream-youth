-- profiles 테이블에 강사 담당 반 배열 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_class_ids UUID[] DEFAULT '{}';
