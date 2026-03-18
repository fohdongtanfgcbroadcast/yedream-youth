// 날짜 포맷 (YYYY-MM-DD → YYYY년 MM월 DD일)
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 짧은 날짜 포맷 (MM/DD)
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 오늘 날짜 (YYYY-MM-DD)
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// 생일 여부 확인
export function isBirthday(dateOfBirth: string): boolean {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
}

// 나이 계산
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// 요일 반환
export function getDayOfWeek(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

// ============ 주간 날짜 계산 ============

// 특정 날짜가 속한 주의 일요일 구하기
export function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  d.setDate(d.getDate() - day); // 일요일로 이동
  d.setHours(0, 0, 0, 0);
  return d;
}

// 특정 날짜가 속한 주의 금요일 구하기
export function getFridayOfWeek(date: Date): Date {
  const sunday = getSundayOfWeek(date);
  const friday = new Date(sunday);
  friday.setDate(friday.getDate() - 2); // 일요일 기준 전주 금요일
  return friday;
}

// 날짜를 YYYY-MM-DD 문자열로 변환
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 해당 주의 철야 날짜 (금요일), 주일예배/제자교육 날짜 (일요일)
export function getWeekDates(sundayDate: Date): { friday: string; sunday: string } {
  const friday = new Date(sundayDate);
  friday.setDate(friday.getDate() - 2); // 일요일 - 2 = 금요일
  return {
    friday: toDateString(friday),
    sunday: toDateString(sundayDate),
  };
}

// 주간 이동 (weeks: -1 이전주, +1 다음주)
export function shiftWeek(sundayDate: Date, weeks: number): Date {
  const d = new Date(sundayDate);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

// 주간 표시 문자열 (예: "3/10(금) ~ 3/15(일)")
export function formatWeekRange(sundayDate: Date): string {
  const { friday, sunday } = getWeekDates(sundayDate);
  return `${formatShortDate(friday)}(금) ~ ${formatShortDate(sunday)}(일)`;
}

// ============ 로컬 스토리지 ============

export const storage = {
  getItem: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    try { localStorage.removeItem(key); } catch {}
  },
};

// ============ 웹 호환 Alert ============

export function webAlert(message: string): void {
  if (typeof window !== 'undefined') window.alert(message);
}

export function webConfirm(message: string): boolean {
  if (typeof window !== 'undefined') return window.confirm(message);
  return true;
}

// ============ 음력 변환 ============

export function lunarToSolar(lunarMonth: number, lunarDay: number, year?: number): { month: number; day: number } {
  try {
    const KoreanLunarCalendar = require('korean-lunar-calendar');
    const cal = new KoreanLunarCalendar();
    const y = year || new Date().getFullYear();
    cal.setLunarDate(y, lunarMonth, lunarDay, false);
    const solar = cal.getSolarCalendar();
    return { month: solar.month, day: solar.day };
  } catch {
    // 변환 실패 시 그대로 반환
    return { month: lunarMonth, day: lunarDay };
  }
}

// 생일 매칭: 음력이면 양력으로 변환 후 오늘과 비교
export function isBirthdayToday(dateOfBirth: string, isLunar: boolean): boolean {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // MM-DD 또는 YYYY-MM-DD 형식 파싱
  const parts = dateOfBirth.split('-');
  let month: number, day: number;
  if (parts.length === 3) {
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else if (parts.length === 2) {
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
  } else {
    return false;
  }

  if (isLunar) {
    const solar = lunarToSolar(month, day);
    return solar.month === todayMonth && solar.day === todayDay;
  }
  return month === todayMonth && day === todayDay;
}

// ============ 캘린더 유틸 ============

// 특정 월의 일수
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 특정 월의 첫째 날 요일 (0=일)
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
