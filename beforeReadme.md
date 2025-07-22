# 수어지교: 인터랙티브 수어 학습 플랫폼

수어지교는 실시간 모션 인식과 즉각적인 피드백을 통해 누구나 쉽고 재미있게 수어(한국 수화)를 배울 수 있는 웹 기반 학습 플랫폼입니다.

## 🏆 주요 특징

- **실시간 웹캠 모션 인식**: MediaPipe Holistic을 활용한 손/몸 동작 인식
- **즉각적 피드백**: AI 분류 결과를 바탕으로 실시간 정오답 피드백 제공
- **맞춤형 학습 경로**: 카테고리/챕터별 체계적 진도 관리, 추천 학습 제공
- **뱃지/연속 학습 보상**: 학습 동기 부여를 위한 뱃지, 연속 학습(스트릭) 시스템
- **검색 및 추천**: 원하는 수어 단어 검색, 오늘의 추천 수어 제공
- **온보딩/튜토리얼**: 초보자도 쉽게 시작할 수 있는 온보딩 가이드
- **반응형 UI**: Tailwind CSS, shadcn-ui 기반의 현대적이고 직관적인 디자인

---

## 📂 폴더 구조

```
src/
  pages/         # 주요 페이지(홈, 학습, 복습, 프로필 등)
  components/    # 재사용 UI 컴포넌트 및 모달
  hooks/         # 커스텀 훅 (학습 데이터, 뱃지, 스트릭 등)
  services/      # WebSocket, MediaPipe 등 외부 서비스 연동
  contexts/      # 글로벌 상태 관리 (예: WebSocket)
  types/         # 타입 정의
  lib/           # API, 유틸 함수
  public/        # 정적 파일(이미지, 모델 등)
```

---

## 🖥️ 주요 페이지 및 기능

- **메인(홈) 페이지**:  
  - 인사/검색창/추천수어/최근학습/진도/뱃지/스트릭 등 대시보드 제공
- **카테고리/챕터/학습 페이지**:  
  - 카테고리별 챕터 목록, 각 챕터별 수어 학습
  - 실시간 웹캠 인식, 예시 애니메이션, 정오답 피드백
- **복습/퀴즈/리뷰**:  
  - 틀린 문제 자동 관리, 맞춤형 복습
- **프로필/설정**:  
  - 닉네임, 뱃지, 연속 학습 현황 등 확인
- **관리자(Admin)**:  
  - (관리자용) 데이터 관리 기능

---

## ⚙️ 설치 및 실행 방법

### 1. 의존성 설치

```bash
git clone <레포지토리 주소>
cd team5-waterandfish-FE
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```
- 기본적으로 [Vite](https://vitejs.dev/) 개발 서버가 실행됩니다.
- 브라우저에서 `http://localhost:5173` 접속

### 3. 환경 변수

- API 서버, MediaPipe 서버 등과 연동 시 `.env` 파일에 필요한 환경변수를 설정해야 할 수 있습니다.

---

## 🛠️ 기술 스택

- **프론트엔드**: React, TypeScript, Vite
- **스타일/UI**: Tailwind CSS, shadcn-ui, Ant Design 일부
- **AI/모션 인식**: MediaPipe Holistic, WebSocket
- **상태관리/비동기**: React Query, Context API, 커스텀 훅
- **테스트**: Jest, Cypress (e2e)
- **기타**: lodash, axios 등

---

## 🧩 주요 컴포넌트

- `ProgressModal`, `BadgeModal`, `StreakModal`: 진도/뱃지/스트릭 모달
- `OnboardingTour`, `HandPreferenceModal`: 온보딩 및 손 선호도 설정
- `WebcamView`, `VideoInput`: 웹캠/비디오 입력 및 MediaPipe 연동
- `FeedbackDisplay`, `FeedbackModalForLearn`: 실시간 피드백 UI
- `NotificationDrawer`, `SystemStatus`: 알림 및 시스템 상태 표시

---

## 🧪 테스트

- `cypress/e2e/` : E2E 테스트 시나리오
- `src/pages/*.test.tsx`, `src/components/*.test.tsx` : 단위 테스트

```bash
npm run test
# 또는
npx cypress open
```

---

## 📝 기여 방법

1. 이슈/기능 제안 등록 (GitHub Issues)
2. Fork & PR 요청
3. 코드 작성 시 Prettier, ESLint 규칙 준수
4. 커밋 메시지 컨벤션 지키기

---

## 📄 라이선스

- 본 프로젝트는 크래프톤 정글 8기 307-5팀 소유의 오픈소스/비영리 목적 프로젝트입니다.
- 라이선스 및 상업적 이용 관련 문의는 팀장에게 연락 바랍니다.

---

## 📚 참고 문서

- [MediaPipe 통합 가이드](./MEDIAPIPE_INTEGRATION.md)
- [EC2 MediaPipe 디버깅 가이드](./EC2_MEDIAPIPE_DEBUGGING.md)

---

추가로 궁금한 점이나 개선 요청이 있다면 언제든 이슈로 남겨주세요!
