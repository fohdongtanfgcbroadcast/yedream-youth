# 완전 무료 배포 가이드 (처음부터 끝까지)

```
Android → APK 직접 공유 (무료)
iPhone  → PWA 웹앱 (무료)
PC      → 웹 브라우저 (무료)
```

**총 비용: 0원**
**총 소요시간: 약 1~2시간**

---

## 전체 흐름도

```
스텝 1. GitHub 가입 & 코드 업로드          (15분)
   ↓
스텝 2. Supabase 가입 & DB 생성           (20분)
   ↓
스텝 3. Vercel 가입 & 웹 배포             (15분)
   ↓
스텝 4. 환경변수 설정                      (5분)
   ↓
스텝 5. 배포 확인 & 테스트                 (10분)
   ↓
스텝 6. iPhone에 앱 설치 (PWA)            (5분)
   ↓
스텝 7. Android APK 빌드 (선택)           (30분)
   ↓
스텝 8. 팀원에게 공유                      (5분)
```

---

# 스텝 1. GitHub 가입 & 코드 업로드

## 1-1. GitHub 계정 만들기

1. 브라우저에서 **https://github.com** 접속
2. 오른쪽 상단 **Sign up** 클릭
3. 이메일, 비밀번호, 사용자이름 입력
4. 이메일 인증 완료

## 1-2. 새 저장소(Repository) 만들기

1. GitHub 로그인 후 오른쪽 상단 **+** 버튼 → **New repository**
2. 설정:
   - Repository name: `yedream-youth`
   - Description: `예닮드림 청년부 재적관리`
   - **Private** 선택 (비공개)
   - 나머지 체크 해제
3. **Create repository** 클릭

## 1-3. 코드 업로드

터미널(맥: 터미널 앱)을 열고 아래 명령어를 **한 줄씩** 입력:

```bash
# 프로젝트 폴더로 이동
cd ~/Desktop/클로드/yedream-youth

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋
git commit -m "첫 번째 커밋: 예닮드림 청년부 프로토타입"

# GitHub 저장소 연결 (본인 GitHub 사용자명으로 변경!)
git remote add origin https://github.com/여기에-GitHub사용자명/yedream-youth.git

# 코드 업로드
git branch -M main
git push -u origin main
```

> **GitHub 사용자명 확인 방법:**
> GitHub 접속 → 오른쪽 상단 프로필 아이콘 → 표시되는 이름이 사용자명

> **인증 오류가 나면:**
> GitHub → Settings → Developer settings → Personal access tokens → Generate new token
> 토큰을 비밀번호 대신 사용

---

# 스텝 2. Supabase 가입 & DB 생성

## 2-1. Supabase 가입

1. **https://supabase.com** 접속
2. **Start your project** 클릭
3. **Continue with GitHub** 클릭 (GitHub 계정으로 로그인)
4. 권한 허용

## 2-2. 새 프로젝트 만들기

1. **New Project** 클릭
2. 입력:
   - **Organization**: 기본값 사용
   - **Project name**: `yedream-youth`
   - **Database Password**: 비밀번호 입력

     ⚠️ **이 비밀번호를 반드시 어딘가에 메모하세요!**

   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Plan**: Free ($0/month)
3. **Create new project** 클릭
4. 약 2분 기다리기 (프로젝트 준비 중...)

## 2-3. API 키 확인 (매우 중요!)

프로젝트가 준비되면:

1. 왼쪽 메뉴 맨 아래 ⚙️ **Project Settings** 클릭
2. 왼쪽에서 **API** 클릭
3. 화면에 보이는 두 가지를 메모장에 복사:

```
┌─────────────────────────────────────────────┐
│ Project URL                                  │
│ https://abcdefgh.supabase.co    ← 복사!     │
├─────────────────────────────────────────────┤
│ Project API keys                             │
│                                              │
│ anon public                                  │
│ eyJhbGciOiJIUzI1NiIs...        ← 복사!     │
│                                              │
│ service_role (절대 공개 금지!)               │
│ eyJhbGciOiJIUzI1NiIs...        ← 메모만!   │
└─────────────────────────────────────────────┘
```

## 2-4. 데이터베이스 테이블 만들기

1. 왼쪽 메뉴에서 **SQL Editor** 클릭 (코드 아이콘)
2. **New query** 클릭
3. 프로젝트 안의 `supabase/migrations/001_initial_schema.sql` 파일을 열기
4. 파일 내용을 **전체 선택(Cmd+A) → 복사(Cmd+C)**
5. SQL Editor에 **붙여넣기(Cmd+V)**
6. 오른쪽 아래 초록색 **Run** 버튼 클릭 (또는 Cmd+Enter)

```
✅ 성공하면: "Success. No rows returned" 표시
❌ 실패하면: 빨간 에러 메시지 → 내용 확인 후 다시 시도
```

## 2-5. 테이블 생성 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭 (표 아이콘)
2. 왼쪽에 테이블 목록이 보이면 성공:

```
✅ profiles
✅ members
✅ family_groups
✅ discipleship_classes
✅ attendance_records
✅ push_tokens
✅ scheduled_notifications
```

## 2-6. 관리자 계정 만들기

1. 왼쪽 메뉴 → **Authentication** 클릭 (사람 아이콘)
2. **Add user** 버튼 → **Create new user**
3. 입력:
   - Email: `admin@yedream.com` (원하는 이메일)
   - Password: 원하는 비밀번호
   - ✅ **Auto Confirm User** 반드시 체크!
4. **Create user** 클릭
5. 생성된 행에서 **User UID** 복사 (클릭하면 복사됨)

   ```
   예: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

6. **SQL Editor**로 이동 → **New query** → 아래 내용 붙여넣기:

```sql
-- ⚠️ 'User-UID-여기에-붙여넣기' 부분을 실제 UID로 교체하세요!
INSERT INTO profiles (id, role, display_name, phone)
VALUES (
  'User-UID-여기에-붙여넣기',
  'admin',
  '관리자이름',
  '010-0000-0000'
);
```

7. **Run** 클릭

## 2-7. 테스트 데이터 넣기 (선택사항)

SQL Editor에서 실행:

```sql
-- 제자반 생성
INSERT INTO discipleship_classes (name, description) VALUES
  ('제자반 1반', '신입 제자반'),
  ('제자반 2반', '중급 제자반'),
  ('제자반 3반', '고급 제자반');

-- 회원 생성 (class_id는 나중에 Table Editor에서 수정 가능)
INSERT INTO members (name, date_of_birth, phone) VALUES
  ('김철수', '1998-03-17', '010-1111-1111'),
  ('이영희', '1999-07-22', '010-2222-2222'),
  ('박민수', '1997-11-05', '010-3333-3333'),
  ('정수진', '2000-01-15', '010-4444-4444'),
  ('최지훈', '1998-05-30', '010-5555-5555');
```

---

# 스텝 3. Vercel 가입 & 웹 배포

## 3-1. Vercel이란?

- 웹사이트를 무료로 인터넷에 올려주는 서비스
- GitHub 코드가 바뀌면 자동으로 다시 배포됨
- 무료 범위: 월 100GB 대역폭 (충분함)

## 3-2. Vercel 가입

1. **https://vercel.com** 접속
2. **Sign Up** 클릭
3. **Continue with GitHub** 선택
4. GitHub 권한 허용

## 3-3. 프로젝트 연결 & 배포

1. Vercel 대시보드에서 **Add New...** → **Project** 클릭
2. **Import Git Repository** 에서 `yedream-youth` 찾기
3. **Import** 클릭
4. 설정 화면:

```
┌─────────────────────────────────────┐
│ Configure Project                    │
│                                      │
│ Project Name: yedream-youth          │
│ Framework Preset: Other              │
│                                      │
│ Build and Output Settings:           │
│   Build Command:                     │
│   → npx expo export --platform web   │
│                                      │
│   Output Directory:                  │
│   → dist                             │
│                                      │
│ Install Command: (비워두기)          │
└─────────────────────────────────────┘
```

> ⚠️ 프로젝트에 이미 `vercel.json` 파일이 있으므로
> 자동으로 설정될 수 있습니다. 아니라면 위처럼 수동 입력.

5. **아직 Deploy 누르지 마세요!** → 먼저 환경변수 설정 (스텝 4)

---

# 스텝 4. 환경변수 설정

## 4-1. Vercel에 환경변수 추가

배포 설정 화면에서 (또는 프로젝트 Settings → Environment Variables):

1. **Environment Variables** 섹션 찾기
2. 두 개 추가:

```
┌──────────────────────────────────┬──────────────────────────────┐
│ Name                              │ Value                        │
├──────────────────────────────────┼──────────────────────────────┤
│ EXPO_PUBLIC_SUPABASE_URL         │ https://xxxxxxxx.supabase.co │
│ EXPO_PUBLIC_SUPABASE_ANON_KEY    │ eyJhbGciOi......             │
└──────────────────────────────────┴──────────────────────────────┘
```

- **Name** 칸에 변수 이름 입력
- **Value** 칸에 스텝 2-3에서 복사한 값 입력
- **Add** 클릭

3. 두 개 다 추가했으면 **Deploy** 클릭!

## 4-2. 배포 대기

```
⏳ Building... (약 1~3분)
   ↓
✅ Congratulations! Your project has been deployed.
```

## 4-3. 배포 URL 확인

배포 완료 후 표시되는 URL:

```
https://yedream-youth.vercel.app
```

> 이 URL이 바로 여러분의 앱 주소입니다!
> 브라우저에서 접속해보세요.

## 4-4. 커스텀 도메인 설정 (선택)

기본 URL이 마음에 안 들면:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력 (예: `youth.yedream.com`)
3. DNS 설정 안내에 따라 도메인 연결

> 도메인이 없으면 기본 `xxx.vercel.app` 그대로 사용해도 됩니다.

---

# 스텝 5. 배포 확인 & 테스트

## 5-1. PC 브라우저에서 확인

1. 배포된 URL 접속: `https://yedream-youth.vercel.app`
2. 로그인 화면이 나오는지 확인
3. 로그인 → 각 탭 동작 확인

## 5-2. 스마트폰 브라우저에서 확인

1. 폰 브라우저(Safari/Chrome)에서 같은 URL 접속
2. 모바일 화면에 맞게 표시되는지 확인
3. 각 기능 테스트

## 5-3. 테스트 체크리스트

```
□ 로그인 화면이 정상 표시되는가?
□ 로그인이 정상 동작하는가?
□ [홈] 대시보드 정보가 보이는가?
□ [출석] 출석 유형 선택이 되는가?
□ [출석] 체크 후 등록이 되는가?
□ [순위] 개인별/반별 순위가 보이는가?
□ [검색] 이름 검색이 동작하는가?
□ [관리] 회원 추가/삭제가 되는가?
□ 폰에서 가로/세로 회전 시 정상인가?
```

---

# 스텝 6. iPhone에 앱처럼 설치 (PWA)

## 6-1. 설치 방법 (사용자 안내용)

iPhone 사용자에게 아래 내용을 공유하세요:

```
📱 예닮드림 청년부 앱 설치 방법 (iPhone)

1. Safari 브라우저를 엽니다 (크롬 안 됨!)
2. 주소창에 입력: https://yedream-youth.vercel.app
3. 화면 아래 공유 버튼 [↑] 을 탭합니다
4. 아래로 스크롤하여 "홈 화면에 추가"를 탭합니다
5. 이름을 "예닮드림"으로 입력
6. 오른쪽 상단 "추가"를 탭합니다
7. 홈 화면에 앱 아이콘이 생깁니다!

이제 아이콘을 탭하면 앱처럼 실행됩니다.
(주소창 없이 전체화면으로 보입니다)
```

## 6-2. 그림으로 보는 설치 과정

```
Safari 열기 → URL 입력 → 페이지 로드
    ↓
공유 버튼 탭 [↑]
    ↓
┌─────────────────────────┐
│ 홈 화면에 추가          │ ← 이것을 탭!
│ 즐겨찾기 추가           │
│ 읽기 목록에 추가        │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 홈 화면에 추가          │
│                          │
│ 이름: [예닮드림]        │
│ URL:  yedream-youth...   │
│                          │
│        [취소] [추가]    │
└─────────────────────────┘
    ↓
홈 화면에 앱 아이콘 생성! ✅
```

## 6-3. PWA 특징

```
✅ 앱처럼 전체화면 실행 (주소창 없음)
✅ 홈 화면에 아이콘 표시
✅ 푸시 알림 지원 (iOS 16.4 이상)
✅ 설치/업데이트 무료
✅ 앱스토어 심사 불필요
✅ 용량 차지 거의 없음

⚠️ Safari에서만 "홈 화면에 추가" 가능 (Chrome 불가)
⚠️ 인터넷 연결 필요
```

---

# 스텝 7. Android APK 빌드 (선택)

> Android도 PWA(스텝 6과 동일)로 사용 가능합니다.
> APK가 필요한 경우에만 이 단계를 진행하세요.

## 7-1. EAS CLI 설치

```bash
npm install -g eas-cli
```

## 7-2. Expo 계정 로그인

```bash
eas login
```

- https://expo.dev 에서 계정이 없으면 먼저 가입
- 이메일과 비밀번호 입력

## 7-3. EAS 초기화

```bash
cd ~/Desktop/클로드/yedream-youth
eas init
eas build:configure
```

## 7-4. eas.json 확인

자동 생성된 `eas.json`을 다음과 같이 수정:

```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

## 7-5. 환경변수 등록 (EAS)

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://xxxxxxxx.supabase.co" --scope project

eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "eyJhbGciOi....." --scope project
```

## 7-6. APK 빌드

```bash
eas build --platform android --profile preview
```

```
⏳ 빌드 진행 (약 10~20분)
   Expo 클라우드에서 빌드됩니다
   ↓
✅ Build complete!
   https://expo.dev/artifacts/eas/xxxxx.apk    ← APK 다운로드 링크
```

## 7-7. APK 설치

1. 위 링크에서 APK 다운로드
2. Android 폰으로 전송 (카카오톡, 이메일, USB)
3. 폰에서 APK 파일 열기
4. "알 수 없는 출처의 앱 설치" 허용
5. 설치 완료!

---

# 스텝 8. 팀원에게 공유

## 8-1. 공유 메시지 예시 (카카오톡/문자용)

```
📱 예닮드림 청년부 앱이 나왔습니다!

▶ 접속 주소
https://yedream-youth.vercel.app

▶ iPhone 설치 방법
1. Safari로 위 주소 접속
2. 하단 공유 버튼 [↑] 탭
3. "홈 화면에 추가" 탭
4. "추가" 탭 → 완료!

▶ Android 설치 방법 (방법 1 - 간편)
1. Chrome으로 위 주소 접속
2. 메뉴(⋮) → "홈 화면에 추가" 탭

▶ Android 설치 방법 (방법 2 - APK)
아래 링크에서 APK 다운로드 후 설치
[APK 다운로드 링크]

▶ 로그인 정보
아이디: (개별 안내)
비밀번호: (개별 안내)
```

## 8-2. Android도 PWA로 설치 (APK 없이)

Android Chrome에서:

```
1. Chrome으로 URL 접속
2. 메뉴 (⋮) 탭
3. "홈 화면에 추가" 또는 "앱 설치" 탭
4. 홈 화면에 아이콘 생성!
```

---

# 스텝 9. 업데이트 방법

## 9-1. 코드 수정 후 자동 배포

코드를 수정하고 GitHub에 올리면 Vercel이 자동으로 다시 배포합니다:

```bash
# 코드 수정 후
git add .
git commit -m "기능 수정: 출석 화면 개선"
git push
```

```
GitHub에 코드 올림
    ↓ (자동)
Vercel이 감지
    ↓ (자동, 1~3분)
새 버전 배포 완료!
    ↓
사용자가 앱 열면 자동으로 최신 버전
```

## 9-2. Supabase 데이터 수정

1. https://supabase.com 접속 → 프로젝트 선택
2. **Table Editor** → 원하는 테이블 클릭
3. 직접 데이터 수정 가능 (엑셀처럼)

---

# 문제 해결

## 자주 발생하는 문제

### "빌드 실패" 오류
```bash
# 캐시 삭제 후 재시도
rm -rf node_modules dist .expo
npm install
npm run build:web
```

### "Supabase 연결 안 됨"
- Vercel 환경변수가 정확한지 확인
- Supabase URL 앞에 `https://` 포함되어 있는지 확인
- anon key가 전체 복사되었는지 확인

### "로그인이 안 됨"
- Supabase Authentication에서 사용자가 생성되었는지 확인
- Auto Confirm이 체크되어 있었는지 확인
- profiles 테이블에 해당 사용자 데이터가 있는지 확인

### "iPhone에서 홈 화면 추가가 안 보임"
- 반드시 **Safari** 사용 (Chrome에서는 안 됨)
- 공유 버튼이 화면 하단에 있음 (iPhone 모델에 따라 위치 다름)

### "Vercel 배포가 실패"
- Build Command가 `npx expo export --platform web` 인지 확인
- Output Directory가 `dist` 인지 확인
- 환경변수 2개가 모두 설정되어 있는지 확인

---

# 비용 정리

| 서비스 | 용도 | 비용 |
|--------|------|------|
| GitHub | 코드 저장 | ✅ 무료 |
| Supabase | 데이터베이스 | ✅ 무료 (500MB) |
| Vercel | 웹 배포 | ✅ 무료 (100GB/월) |
| Expo EAS | APK 빌드 | ✅ 무료 (30빌드/월) |
| **합계** | | **0원** |

---

# 다음 단계 (향후)

- [ ] 실제 Supabase 인증으로 Mock 로그인 교체
- [ ] 푸시 알림 기능 연동
- [ ] 오프라인 캐시 기능 추가
- [ ] 시놀로지 NAS 백업 설정
- [ ] 앱 아이콘 & 스플래시 화면 디자인
