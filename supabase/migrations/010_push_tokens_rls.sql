-- push_tokens: 모든 인증 사용자가 본인 토큰 관리 가능하도록
DROP POLICY IF EXISTS "본인 관리" ON push_tokens;
CREATE POLICY "본인 읽기" ON push_tokens FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "본인 삽입" ON push_tokens FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "본인 수정" ON push_tokens FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "본인 삭제" ON push_tokens FOR DELETE USING (profile_id = auth.uid());
