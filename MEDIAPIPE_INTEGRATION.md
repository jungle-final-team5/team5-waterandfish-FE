# MediaPipe Holistic 통합 가이드

## 📋 개요

이 프로젝트에서는 MediaPipe Holistic, Hand를 사용하여 프론트엔드에서 수어 랜드마크를 추출하고, 서버에는 벡터 데이터만 전송하는 방식으로 리팩터링되었습니다.

## 🔄 변경사항

### 이전 방식 (비디오 스트림)
- 프론트엔드에서 비디오 프레임을 캡처
- base64로 인코딩하여 서버로 전송
- 서버에서 MediaPipe 처리 및 분류

### 새로운 방식 (랜드마크 벡터)
- 프론트엔드에서 MediaPipe Holistic 처리
- 랜드마크 좌표만 서버로 전송
- 서버에서 벡터 데이터만 분류 처리

## 🛠️ 설치된 패키지

```bash
npm install @mediapipe/holistic
```

## 📁 새로운 파일들

### 1. `src/hooks/useMediaPipeHolistic.ts`
MediaPipe Holistic 처리를 담당하는 커스텀 hook

**주요 기능:**
- MediaPipe 초기화 및 설정 (EC2 환경 최적화)
- 카메라 스트림 관리
- 랜드마크 추출 및 변환
- 실시간 시각화 (디버그용)
- 다중 CDN 전략 및 재시도 로직

**사용법:**
```typescript
const {
  videoRef,
  canvasRef,
  isInitialized,
  isProcessing,
  lastLandmarks,
  startCamera,
  stopCamera
} = useMediaPipeHolistic({
  onLandmarks: (landmarks) => {
    console.log('랜드마크 감지:', landmarks);
  },
  modelComplexity: 1,
  minDetectionConfidence: 0.7
});
```

### 2. `src/services/SignClassifierClient.ts` (수정됨)
WebSocket 클라이언트가 랜드마크 데이터를 전송하도록 수정

**새로운 메시지 타입:**
```typescript
interface LandmarksData {
  pose: number[][] | null;      // 33개 포즈 랜드마크
  left_hand: number[][] | null; // 21개 왼손 랜드마크
  right_hand: number[][] | null; // 21개 오른손 랜드마크
}

interface LandmarksMessage {
  type: 'landmarks';
  data: LandmarksData;
  timestamp: number;
}
```

**사용법:**
```typescript
const landmarks: LandmarksData = {
  pose: [[x1,y1,z1], [x2,y2,z2], ...],
  left_hand: [[x1,y1,z1], [x2,y2,z2], ...],
  right_hand: [[x1,y1,z1], [x2,y2,z2], ...]
};

signClassifierClient.sendLandmarks(landmarks);
```

### 3. `src/pages/MediaPipeSession.tsx`
MediaPipe 기능을 테스트할 수 있는 데모 페이지

**접속 URL:** `/test/mediapipe`

## 🚀 서버 실행 방법

백엔드 서버를 새로운 벡터 처리 모드로 실행:

```bash
cd team5-waterandfish-BE
python src/services/sign_classifier_websocket_server.py \
  --port 8765 \
  --env model_info.json \
  --prediction-interval 5 \
  --debug \
  --profile
```

### 새로운 서버 옵션
- `--prediction-interval`: N개 벡터마다 예측 실행 (기본값: 5)
- `--debug`: 디버그 모드 (추가 로깅)
- `--profile`: 성능 프로파일링 활성화

## 📊 성능 향상 효과

### CPU 사용량
- **이전**: 서버에서 MediaPipe 처리로 높은 CPU 사용량
- **현재**: 클라이언트 분산 처리로 서버 부하 감소

### 네트워크 사용량
- **이전**: 비디오 프레임 (base64) ~50-100KB/frame
- **현재**: 랜드마크 벡터 ~2-5KB/frame (90%+ 감소)

### 응답 속도
- **이전**: 프레임 디코딩 + MediaPipe 처리 시간
- **현재**: 벡터 전처리 + 분류만으로 응답 시간 단축

## 🔧 사용 방법

### 1. 개발 서버 시작
```bash
npm run dev
```

### 2. MediaPipe 테스트 페이지 접속
브라우저에서 `http://localhost:5173/test/mediapipe` 접속

### 3. 테스트 절차
1. MediaPipe 초기화 완료 대기
2. "서버 연결" 버튼 클릭
3. "세션 초기화" 버튼 클릭 (카메라 시작)
4. "녹화 시작" 버튼 클릭
5. 수어 동작 수행
6. 실시간 분류 결과 확인

## 🐛 디버깅

### MediaPipe 초기화 실패
```javascript
// 브라우저 콘솔에서 확인
console.log('MediaPipe 상태:', isInitialized);
```

### 랜드마크 데이터 확인
```javascript
// 마지막 감지된 랜드마크 확인
console.log('마지막 랜드마크:', lastLandmarks);
```

### 서버 연결 문제
```javascript
// WebSocket 연결 상태 확인
console.log('서버 연결:', signClassifierClient.getConnectionStatus());
```

## 🔄 기존 컴포넌트 통합

기존 `QuizSession`, `LearnSession` 등에 MediaPipe를 통합하려면:

1. `useMediaPipeHolistic` hook import
2. `useVideoStream` 대신 사용
3. `captureFrameAsync` → `onLandmarks` 콜백으로 변경
4. `sendVideoChunk` → `sendLandmarks`로 변경

### 예시 코드
```typescript
// 기존 방식
const { captureFrameAsync } = useVideoStream();
const frame = await captureFrameAsync();
signClassifierClient.sendVideoChunk(frame);

// 새로운 방식
const { } = useMediaPipeHolistic({
  onLandmarks: (landmarks) => {
    signClassifierClient.sendLandmarks(landmarks);
  }
});
```

## 🌐 EC2 환경 최적화

### 환경 정보
- **서버**: EC2 t3-xlarge
- **OS**: Linux
- **컨테이너**: Docker
- **프론트엔드**: React + Vite

### 해결된 문제들
1. **ES 모듈 호환성 문제**: MediaPipe 모듈의 `default` export 처리
2. **CDN 로딩 순서 문제**: 스크립트 태그 우선 로딩 전략
3. **WASM 파일 접근성**: 다중 CDN 전략으로 네트워크 문제 해결

### 핵심 해결 방법
```typescript
// 1. 다중 CDN 전략
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/holistic',
  'https://unpkg.com/@mediapipe/holistic',
  'https://cdnjs.cloudflare.com/ajax/libs/mediapipe-holistic'
];

// 2. 전역 객체 우선 검색
const globalPaths = [
  'MediaPipe.Holistic',
  'MediaPipe.holistic',
  'Holistic',
  'holistic'
];

// 3. 스크립트 태그 로딩 후 재검색
await loadMediaPipeViaScript();
```

### 성공적인 초기화 로그
```javascript
✅ MediaPipe 스크립트 로드 성공
✅ CDN 접근 가능
✅ 전역 객체에서 Holistic 발견
✅ Holistic 생성자 확인됨
✅ MediaPipe 모듈 로드 성공
✅ MediaPipe Holistic 초기화 완료
```

자세한 내용은 [EC2 MediaPipe 디버깅 가이드](./EC2_MEDIAPIPE_DEBUGGING.md)를 참조하세요.

## 📈 확장 가능성

### 추가 설정 옵션
- `modelComplexity`: 0(빠름), 1(균형), 2(정확함)
- `smoothLandmarks`: 랜드마크 스무딩 활성화/비활성화
- `minDetectionConfidence`: 감지 신뢰도 임계값
- `minTrackingConfidence`: 추적 신뢰도 임계값

### 성능 튜닝
```typescript
// 고성능 모드 (속도 우선)
const fastConfig = {
  modelComplexity: 0,
  smoothLandmarks: false,
  minDetectionConfidence: 0.8
};

// 고정확도 모드 (정확도 우선)
const accurateConfig = {
  modelComplexity: 2,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5
};
```

## 🎯 다음 단계

1. **기존 세션 컴포넌트 업데이트**: QuizSession, LearnSession 등에 MediaPipe 적용
2. **성능 최적화**: 랜드마크 전송 빈도 조절
3. **에러 처리 강화**: MediaPipe 초기화 실패 시 fallback 방식

---

## 📞 문의사항

MediaPipe 통합 관련 문의사항은 개발팀에 연락해주세요. 