# 예닮드림 청년부 - 배포 가이드 (처음부터 끝까지)

---

## 전체 흐름

```
[1단계] 사전 준비 (계정 생성)
    ↓
[2단계] Supabase 프로젝트 생성 & DB 설정
    ↓
[3단계] 앱에 Supabase 연결
    ↓
[4단계] 로컬에서 테스트
    ↓
[5단계] Expo 계정 & EAS 설정
    ↓
[6단계] Android APK 빌드
    ↓
[7단계] iOS 빌드 (Apple 계정 필요)
    ↓
[8단계] 앱 배포 & 배포
    ↓
[9단계] 시놀로지 NAS 활용 (선택)
```

---

## 1단계: 사전 준비

### 1-1. 필요한 계정 만들기

| 서비스 | URL | 용도 | 비용 |
|--------|-----|------|------|
| Supabase | https://supabase.com | 데이터베이스 | 무료 |
| Expo/EAS | https://expo.dev | 앱 빌드 & 배포 | 무료 (30빌드/월) |
| Google Play | https://play.google.com/console | Android 배포 | $25 (1회) |
| Apple Developer | https://developer.apple.com | iOS 배포 | $99/년 |

> ⚠️ Google Play와 Apple Developer는 스토어 배포 시에만 필요합니다.
> 테스트 단계에서는 Supabase + Expo 계정만 있으면 됩니다.

### 1-2. 개발 도구 확인

터미널에서 다음 명령어가 동작하는지 확인:

```bash
node --version    # v18 이상 필요
npm --version     # 9 이상 권장
git --version     # 설치되어 있으면 OK
```

---

## 2단계: Supabase 프로젝트 생성 & DB 설정

### 2-1. Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** 클릭
2. GitHub 계정으로 로그인
3. **New Project** 클릭
4. 설정 입력:
   - **Organization**: 기본값 사용 또는 새로 생성
   - **Project name**: `yedream-youth`
   - **Database Password**: 안전한 비밀번호 입력 → **반드시 메모해두세요!**
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: Free 선택
5. **Create new project** 클릭
6. 생성 완료까지 약 2분 대기

### 2-2. API 키 확인 (중요!)

프로젝트 생성 후:

1. 왼쪽 메뉴 → **Project Settings** (톱니바퀴 아이콘)
2. **API** 탭 클릭
3. 다음 두 값을 메모:

```
Project URL:  https://xxxxxxxx.supabase.co    ← 이것이 SUPABASE_URL
anon public:  eyJhbGciOi.....                 ← 이것이 SUPABASE_ANON_KEY
```

> ⚠️ `service_role` 키는 절대 앱에 넣지 마세요! (서버에서만 사용)

### 2-3. 데이터베이스 테이블 생성

1. 왼쪽 메뉴 → **SQL Editor** 클릭
2. **New query** 클릭
3. 프로젝트의 `supabase/migrations/001_initial_schema.sql` 파일 내용을 전체 복사
4. SQL Editor에 붙여넣기
5. **Run** 클릭 (Cmd+Enter)
6. "Success. No rows returned" 메시지 확인

### 2-4. DB 생성 확인

1. 왼쪽 메뉴 → **Table Editor** 클릭
2. 다음 테이블들이 보이면 성공:
   - profiles
   - members
   - family_groups
   - discipleship_classes
   - attendance_records
   - push_tokens
   - scheduled_notifications

### 2-5. 테스트 사용자 생성

1. 왼쪽 메뉴 → **Authentication** 클릭
2. **Add user** → **Create new user** 클릭
3. 관리자 계정 생성:
   - Email: `admin@yedream.com`
   - Password: 원하는 비밀번호
   - ✅ Auto Confirm User 체크
4. **Create user** 클릭
5. 생성된 사용자의 **User UID**를 복사

6. **SQL Editor**에서 프로필 등록:

```sql
INSERT INTO profiles (id, role, display_name, phone)
VALUES (
  '여기에-복사한-User-UID-붙여넣기',
  'admin',
  '김관리',
  '010-1234-5678'
);
```

7. 같은 방식으로 강사 계정도 생성:
   - Email: `instructor@yedream.com`
   - role: `'instructor'`

### 2-6. 테스트 데이터 입력 (선택)

SQL Editor에서 실행:

```sql
-- 제자반 생성
INSERT INTO discipleship_classes (name, description) VALUES
  ('제자반 1반', '신입 제자반'),
  ('제자반 2반', '중급 제자반'),
  ('제자반 3반', '고급 제자반');

-- 회원 등록 (제자반 ID는 Table Editor에서 확인)
INSERT INTO members (name, date_of_birth, phone, class_id) VALUES
  ('김철수', '1998-03-17', '010-1111-1111', '제자반1반-UUID'),
  ('이영희', '1999-07-22', '010-2222-2222', '제자반1반-UUID');
```

---

## 3단계: 앱에 Supabase 연결

### 3-1. 환경변수 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
# yedream-youth/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi.....여기에실제키
```

> ⚠️ `.env` 파일은 Git에 올리면 안 됩니다!

### 3-2. .gitignore에 추가

```
# .gitignore에 추가
.env
.env.local
```

### 3-3. Supabase 클라이언트 설정 확인

`src/lib/supabase.ts` 파일이 환경변수를 읽도록 이미 설정되어 있습니다:

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

---

## 4단계: 로컬에서 테스트

### 4-1. 개발 서버 시작

```bash
cd yedream-youth
npm start
```

화면에 QR 코드가 나타남

### 4-2. 스마트폰에서 테스트

#### Android:
1. Google Play에서 **Expo Go** 앱 설치
2. Expo Go 앱 열기 → QR 코드 스캔

#### iPhone:
1. App Store에서 **Expo Go** 앱 설치
2. 기본 카메라 앱으로 QR 코드 스캔

### 4-3. 웹 브라우저에서 테스트

```bash
npm run web
```

브라우저에서 `http://localhost:8081` 자동 열림

### 4-4. 테스트 체크리스트

```
□ 로그인 화면이 정상 표시되는가?
□ 역할(관리자/강사/회원) 선택 후 로그인이 되는가?
□ 홈 화면에 요약 정보가 보이는가?
□ 출석 탭에서 유형/날짜 선택이 되는가?
□ 출석 체크 후 등록이 되는가?
□ 순위 탭에서 개인별/반별 순위가 보이는가?
□ 검색 탭에서 이름 검색이 되는가?
□ 관리 탭에서 회원 추가/삭제가 되는가?
□ 관리 탭에서 제자반 추가/삭제가 되는가?
```

### 4-5. 문제 해결

```bash
# 캐시 초기화 후 다시 시작
npx expo start --clear

# 의존성 재설치
rm -rf node_modules
npm install
npx expo start
```

---

## 5단계: Expo 계정 & EAS 설정

### 5-1. Expo 계정 생성

```bash
# EAS CLI 설치
npm install -g eas-cli

# Expo 로그인 (계정이 없으면 https://expo.dev 에서 먼저 가입)
eas login
# Email: 입력
# Password: 입력
```

### 5-2. EAS 프로젝트 초기화

```bash
cd yedream-youth
eas init
```

- 프로젝트 이름 확인 → Enter

### 5-3. EAS 빌드 설정 파일 생성

```bash
eas build:configure
```

자동으로 `eas.json` 파일이 생성됨. 다음과 같이 수정:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5-4. 환경변수를 EAS에 등록

```bash
# Supabase URL 등록
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxxxxx.supabase.co" --scope project

# Supabase Key 등록
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOi....." --scope project
```

---

## 6단계: Android APK 빌드

### 6-1. APK 빌드 (테스트용)

```bash
eas build --platform android --profile preview
```

- 처음 빌드 시 키스토어 생성 여부를 물어봄 → **Generate new keystore** 선택
- 빌드가 Expo 클라우드에서 진행됨 (약 10~20분)
- 완료 후 다운로드 링크 제공

### 6-2. APK 설치 (테스트)

1. 빌드 완료 시 표시되는 URL에서 APK 다운로드
2. Android 폰에 APK 파일 전송 (카카오톡, 이메일, USB 등)
3. 설정 → 보안 → "알 수 없는 출처의 앱 설치" 허용
4. APK 파일 열어서 설치

### 6-3. 내부 테스트 배포 (팀에게 공유)

```bash
# 내부 배포 등록
eas build --platform android --profile preview
```

빌드 완료 후 Expo 대시보드에서:
1. https://expo.dev 접속 → 프로젝트 선택
2. **Builds** 탭 → 최근 빌드 클릭
3. **Install** 링크 복사 → 팀원에게 공유

---

## 7단계: iOS 빌드 (Apple Developer 계정 필요)

### 7-1. 사전 요구사항

- Apple Developer Program 가입 ($99/년)
- https://developer.apple.com/account

### 7-2. iOS 빌드

```bash
eas build --platform ios --profile preview
```

- Apple ID 입력 요청 → Apple Developer 계정 입력
- 프로비저닝 프로파일 자동 생성
- 빌드 완료까지 약 15~30분

### 7-3. TestFlight으로 테스트 배포

```bash
# 프로덕션 빌드
eas build --platform ios --profile production

# App Store Connect에 업로드
eas submit --platform ios
```

1. https://appstoreconnect.apple.com 접속
2. TestFlight 탭 → 빌드 확인
3. 내부 테스트 그룹에 테스터 추가
4. 테스터가 TestFlight 앱에서 설치

---

## 8단계: 스토어 배포

### 8-1. Google Play Store 배포

#### 사전 준비:
- Google Play Console 계정 ($25 1회성)
- 앱 아이콘 (512x512 PNG)
- 스크린샷 (최소 2장)
- 개인정보처리방침 URL

#### 단계:

```bash
# 프로덕션 빌드 (AAB 포맷)
eas build --platform android --profile production

# Google Play에 업로드
eas submit --platform android
```

또는 수동 업로드:
1. https://play.google.com/console 접속
2. **앱 만들기** 클릭
3. 앱 정보 입력:
   - 앱 이름: 예닮드림 청년부
   - 기본 언어: 한국어
4. **프로덕션** → **새 버전 만들기**
5. AAB 파일 업로드
6. 스토어 등록정보 작성
7. **검토를 위해 제출** (심사 1~3일)

### 8-2. Apple App Store 배포

#### 사전 준비:
- Apple Developer 계정 ($99/년)
- 앱 아이콘 (1024x1024 PNG)
- 스크린샷 (6.7인치, 6.5인치 등 각 사이즈)
- 개인정보처리방침 URL

#### 단계:

```bash
# 프로덕션 빌드
eas build --platform ios --profile production

# App Store에 업로드
eas submit --platform ios
```

1. https://appstoreconnect.apple.com 접속
2. **나의 앱** → **+** → **신규 앱**
3. 앱 정보 작성
4. 빌드 선택 → 심사 제출
5. 심사 대기 (1~7일)

---

## 9단계: 시놀로지 NAS 활용 (선택)

### 9-1. NAS 역할

| 용도 | 설명 |
|------|------|
| 자동 백업 | Supabase DB를 매일 백업 |
| 크론 작업 | 생일 알림, 일요일 출석 알림 트리거 |

### 9-2. Docker 설치 (시놀로지)

1. 시놀로지 DSM 접속
2. **패키지 센터** → **Container Manager** (구 Docker) 설치
3. 설치 완료 확인

### 9-3. 백업 스크립트 설정

1. SSH로 NAS 접속
2. 백업 스크립트 생성:

```bash
# /volume1/scripts/backup-supabase.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/volume1/backups/supabase"

mkdir -p $BACKUP_DIR

# Supabase REST API로 데이터 백업
curl -s "https://xxxxxxxx.supabase.co/rest/v1/members?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  > "$BACKUP_DIR/members_$DATE.json"

curl -s "https://xxxxxxxx.supabase.co/rest/v1/attendance_records?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  > "$BACKUP_DIR/attendance_$DATE.json"

# 30일 이전 백업 삭제
find $BACKUP_DIR -name "*.json" -mtime +30 -delete

echo "Backup completed: $DATE"
```

3. 실행 권한 부여:
```bash
chmod +x /volume1/scripts/backup-supabase.sh
```

### 9-4. 자동 백업 스케줄 (시놀로지)

1. DSM → **제어판** → **작업 스케줄러**
2. **생성** → **예약된 작업** → **사용자 정의 스크립트**
3. 설정:
   - 작업 이름: Supabase 백업
   - 사용자: root
   - 일정: 매일 새벽 3시
   - 스크립트: `bash /volume1/scripts/backup-supabase.sh`

### 9-5. 알림 크론 설정 (시놀로지)

일요일 저녁 7시 출석 알림 트리거:

```bash
# /volume1/scripts/sunday-notify.sh

#!/bin/bash
# 일요일인지 확인
DAY=$(date +%u)
if [ "$DAY" != "7" ]; then
  exit 0
fi

# Supabase Edge Function 호출
curl -s -X POST \
  "https://xxxxxxxx.supabase.co/functions/v1/push-sunday-checkin" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

작업 스케줄러에 등록:
- 일정: 매일 19:00 (스크립트 내에서 일요일 체크)

---

## 부록: 자주 묻는 질문

### Q: Supabase 무료 티어 한도가 넘으면?
A: 100명 이내 사용이면 무료 티어로 충분합니다.
   - DB: 500MB (100명 데이터 = 수 MB 수준)
   - 인증: 무제한
   - API: 무제한

### Q: Expo Go 없이 테스트 가능한가요?
A: `eas build --profile preview`로 빌드한 APK를 직접 설치하면 됩니다.

### Q: 앱 업데이트는 어떻게 하나요?
A: OTA(Over-The-Air) 업데이트 사용:
```bash
eas update --branch production --message "출석 기능 개선"
```
→ 사용자가 앱을 다시 설치하지 않아도 자동 업데이트

### Q: 스토어 없이 배포할 수 있나요?
A: 가능합니다.
   - **Android**: APK 파일을 직접 공유 (카카오톡, 이메일 등)
   - **iOS**: TestFlight으로 최대 100명에게 배포 (Apple Developer 계정 필요)
   - **Expo 링크**: 내부 배포 링크 공유 (Expo Go 필요)

### Q: 인터넷 없이 사용할 수 있나요?
A: 현재는 불가능합니다. Supabase 서버 연결이 필요합니다.
   향후 오프라인 모드를 추가하려면 로컬 캐시 기능이 필요합니다.

---

## 빠른 시작 요약 (최소 단계)

가장 빠르게 실제 동작하는 앱을 만들려면:

```bash
# 1. Supabase 가입 → 프로젝트 생성 → SQL 실행
# 2. .env 파일에 키 입력
# 3. 로컬 테스트
npm start

# 4. Android APK 빌드
npm install -g eas-cli
eas login
eas init
eas build:configure
eas build --platform android --profile preview

# 5. APK 다운로드 → 폰에 설치 → 완료!
```

총 소요 시간: 약 1~2시간 (첫 빌드 기준)
