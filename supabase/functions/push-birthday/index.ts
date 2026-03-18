// Supabase Edge Function: 생일 알림 푸시 (매일 오전 7시 실행)
// 호출: POST /functions/v1/push-birthday

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 오늘 생일인 멤버 조회
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const { data: birthdayMembers, error: memberError } = await supabase
      .from('members')
      .select('id, name, class_id, date_of_birth')
      .eq('is_active', true)
      .not('date_of_birth', 'is', null);

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), { status: 500 });
    }

    // 생일 필터링 (MM-DD 형식 매칭)
    const todayMMDD = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayBirthdays = (birthdayMembers || []).filter((m: any) => {
      if (!m.date_of_birth) return false;
      // MM-DD 형식 또는 YYYY-MM-DD 형식 모두 지원
      const dob = String(m.date_of_birth);
      if (dob.length === 5) return dob === todayMMDD; // MM-DD
      if (dob.length >= 10) return dob.slice(5, 10) === todayMMDD; // YYYY-MM-DD
      return false;
    });

    if (todayBirthdays.length === 0) {
      return new Response(JSON.stringify({ message: '오늘 생일자 없음', sent: 0 }));
    }

    // 2. 제자반 이름 조회
    const { data: classes } = await supabase
      .from('discipleship_classes')
      .select('id, name');

    const classMap: Record<string, string> = {};
    (classes || []).forEach((c: any) => { classMap[c.id] = c.name; });

    // 3. 임원/목사/전도사/강사/관리자의 푸시 토큰 조회
    const { data: officerProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['officer', 'pastor', 'evangelist', 'instructor', 'admin']);

    if (!officerProfiles || officerProfiles.length === 0) {
      return new Response(JSON.stringify({ message: '알림 대상 없음', sent: 0 }));
    }

    const profileIds = officerProfiles.map((p: any) => p.id);

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .in('profile_id', profileIds);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: '등록된 푸시 토큰 없음', sent: 0 }));
    }

    // 4. 푸시 알림 발송
    const birthdayNames = todayBirthdays.map((m: any) => {
      const className = m.class_id ? classMap[m.class_id] || '' : '';
      return `${className} ${m.name}`;
    }).join(', ');

    const messages = tokens.map((t: any) => ({
      to: t.expo_push_token,
      sound: 'default',
      title: '🎂 오늘의 생일자',
      body: `${birthdayNames}의 생일입니다! 축하해주세요.`,
      data: { type: 'birthday', screen: 'home' },
    }));

    // Expo Push API 호출
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({
      message: '생일 알림 발송 완료',
      birthdays: todayBirthdays.length,
      tokens: tokens.length,
      sent: messages.length,
      result: pushResult,
    }));

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
