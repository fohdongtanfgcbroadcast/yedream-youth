-- 매일 오전 7시(KST = UTC 22:00 전날) 생일 알림 크론
-- Supabase Dashboard > SQL Editor에서 실행

-- pg_cron 확장 활성화 (이미 활성화된 경우 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 매일 한국시간 오전 7시 (UTC 22:00 전날) 실행
SELECT cron.schedule(
  'birthday-push-daily',
  '0 22 * * *',  -- UTC 22:00 = KST 07:00
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/push-birthday',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
