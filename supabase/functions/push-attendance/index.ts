// Supabase Edge Function: 출석 체크 알림 (매주 일요일 오후 7시 실행)
// 강사/목사/전도사 계정에 푸시 알림 발송

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 강사/목사/전도사의 푸시 토큰 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['instructor', 'pastor', 'evangelist']);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: '알림 대상 없음', sent: 0 }));
    }

    const profileIds = profiles.map((p: any) => p.id);

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .in('profile_id', profileIds);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: '등록된 푸시 토큰 없음', sent: 0 }));
    }

    // 푸시 알림 발송
    const messages = tokens.map((t: any) => ({
      to: t.expo_push_token,
      sound: 'default',
      title: '✅ 출석 체크 시간입니다',
      body: '출석 체크를 진행해주세요.',
      data: { type: 'attendance', screen: 'attendance' },
    }));

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({
      message: '출석 체크 알림 발송 완료',
      tokens: tokens.length,
      sent: messages.length,
      result: pushResult,
    }));

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
