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
