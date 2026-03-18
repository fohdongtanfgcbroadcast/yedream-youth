-- 매주 일요일 오후 7시(KST = UTC 10:00) 출석 체크 알림
SELECT cron.schedule(
  'attendance-push-sunday',
  '0 10 * * 0',  -- UTC 10:00 일요일 = KST 19:00 일요일
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/push-attendance',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
