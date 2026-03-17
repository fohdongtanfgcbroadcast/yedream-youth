export const COLORS = {
  primary: '#4A90D9',
  primaryDark: '#2E6CB8',
  secondary: '#F5A623',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
  disabled: '#BDC3C7',
};

export const ATTENDANCE_TYPES = [
  { key: '철야' as const, label: '철야', icon: 'weather-night', color: '#8E44AD' },
  { key: '제자교육' as const, label: '제자교육', icon: 'book-open-variant', color: '#2980B9' },
  { key: '주일예배' as const, label: '주일예배', icon: 'church', color: '#27AE60' },
];

export const ROLES = {
  admin: { label: '관리자', color: '#E74C3C' },
  instructor: { label: '강사', color: '#3498DB' },
  member: { label: '회원', color: '#95A5A6' },
};
