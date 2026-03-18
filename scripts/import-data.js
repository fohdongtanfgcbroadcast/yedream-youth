const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ucqcgstrduwrcrhgbcdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWNnc3RyZHV3cmNyaGdiY2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjU5MjYsImV4cCI6MjA4OTMwMTkyNn0.6y6CBPVZnQtmeRQ8domZ4PXp1Wo_kOFmrHL0SzUp1IA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Excel serial date → MM-DD
function excelDateToMMDD(serial) {
  if (!serial) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}-${d}`;
}

// Excel serial date → 2000-MM-DD (DB 저장용)
function excelDateToDB(serial) {
  const mmdd = excelDateToMMDD(serial);
  if (!mmdd) return null;
  return `2000-${mmdd}`;
}

async function main() {
  const wb = XLSX.readFile('/Users/admin/Downloads/청년부 DB.xlsx');
  const data = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1']);

  console.log(`총 ${data.length}명 데이터 로드`);

  // 1. 기존 데이터 삭제
  console.log('\n--- 기존 데이터 삭제 ---');
  await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('출석 기록 삭제');
  await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('회원 삭제');
  await supabase.from('discipleship_classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('제자반 삭제');

  // 2. 제자반 생성
  console.log('\n--- 제자반 생성 ---');
  const classNames = [...new Set(data.map(r => r['제자반']).filter(c => c && c !== '무소속'))];
  const classMap = {};

  for (const name of classNames) {
    const { data: cls, error } = await supabase.from('discipleship_classes')
      .insert({ name, is_active: true })
      .select().single();
    if (error) { console.error(`제자반 ${name} 생성 실패:`, error.message); continue; }
    classMap[name] = cls.id;
    console.log(`제자반 생성: ${name} → ${cls.id}`);
  }

  // 3. 강사/목사 계정 생성 + 회원 등록
  console.log('\n--- 강사/목사 계정 생성 ---');
  const instructors = data.filter(r => r['직책'] === '강사' || r['직책'] === '목사');

  for (const inst of instructors) {
    const phone = String(inst['전화번호'] || '');
    const account = String(inst['계정'] || phone);
    const email = `${account}@yedream.app`;
    const password = String(inst['비밀번호'] || '1111');
    const role = inst['직책'] === '목사' ? 'pastor' : 'instructor';
    const className = inst['제자반'];
    const classId = classMap[className] || null;
    const isLunar = inst['음력여부'] === '음력';
    const dob = excelDateToDB(inst['생년월일']);

    // 계정 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      console.error(`계정 생성 실패 (${inst['이름']}):`, authError.message);
      continue;
    }

    const userId = authData.user?.id;
    if (!userId) { console.error(`UID 없음: ${inst['이름']}`); continue; }

    // 이메일 확인 (SQL로 직접 해야 함 - 아래 SQL 출력)
    console.log(`-- SQL: UPDATE auth.users SET email_confirmed_at = now() WHERE email = '${email}';`);

    // 프로필 생성
    const { error: profError } = await supabase.from('profiles').insert({
      id: userId,
      role: role,
      display_name: inst['이름'],
      phone: phone,
      assigned_class_ids: classId ? [classId] : [],
      must_change_password: true,
    });
    if (profError) console.error(`프로필 생성 실패 (${inst['이름']}):`, profError.message);

    // 회원 등록
    const { error: memError } = await supabase.from('members').insert({
      name: inst['이름'],
      phone: phone,
      title: inst['직책'],
      date_of_birth: dob,
      is_lunar_birthday: isLunar,
      class_id: classId,
      profile_id: userId,
      is_active: true,
    });
    if (memError) console.error(`회원 등록 실패 (${inst['이름']}):`, memError.message);
    else console.log(`✓ ${inst['직책']} 계정+회원: ${inst['이름']} (${email})`);
  }

  // 4. 일반 청년/전도사 회원 등록
  console.log('\n--- 일반 회원 등록 ---');
  const members = data.filter(r => r['직책'] !== '강사' && r['직책'] !== '목사');

  for (const mem of members) {
    const className = mem['제자반'];
    const classId = (className && className !== '무소속') ? classMap[className] || null : null;
    const isLunar = mem['음력여부'] === '음력';
    const dob = excelDateToDB(mem['생년월일']);
    const phone = mem['전화번호'] ? String(mem['전화번호']) : null;

    const { error } = await supabase.from('members').insert({
      name: mem['이름'],
      phone: phone,
      title: mem['직책'] === '청년' ? null : mem['직책'],
      date_of_birth: dob,
      is_lunar_birthday: isLunar,
      class_id: classId,
      is_active: true,
    });
    if (error) console.error(`회원 등록 실패 (${mem['이름']}):`, error.message);
    else console.log(`✓ 회원: ${mem['이름']} (${className})`);
  }

  console.log('\n=== 완료 ===');
  console.log('\n⚠️ 아래 SQL을 Supabase SQL Editor에서 실행하여 이메일 인증을 완료하세요:');
  console.log("UPDATE auth.users SET email_confirmed_at = now() WHERE email LIKE '%@yedream.app';");
}

main().catch(console.error);
