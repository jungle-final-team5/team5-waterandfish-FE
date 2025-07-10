# MediaPipe EC2 환경 문제 해결 가이드

## 🚨 문제 상황

EC2 환경에서 MediaPipe Holistic 초기화 시 다음과 같은 오류가 발생할 수 있습니다:

```
❌ MediaPipe Holistic 초기화 실패: TypeError: Rq.Holistic is not a constructor
```

## 🔍 원인 분석

### 1. WebGL 지원 문제
- EC2 인스턴스에서 GPU 가속이 제한적
- 소프트웨어 렌더러 (llvmpipe, swiftshader) 사용
- WebGL 컨텍스트 생성 실패

### 2. MediaPipe 모듈 로드 문제
- CDN 접근 문제
- 네트워크 지연으로 인한 모듈 로드 실패
- 브라우저 캐시 문제

### 3. 브라우저 호환성 문제
- 오래된 브라우저 버전
- WebGL 지원 부족
- 보안 정책으로 인한 제한

## 🛠️ 해결 방법

### 1. 즉시 해결 방법

#### A. 브라우저 새로고침
```bash
# 브라우저에서 F5 또는 Ctrl+R
```

#### B. 브라우저 캐시 삭제
1. 개발자 도구 열기 (F12)
2. Network 탭에서 "Disable cache" 체크
3. 페이지 새로고침

#### C. 재시도 버튼 사용
- 화면에 표시되는 "재시도" 버튼 클릭
- 최대 3회까지 자동 재시도

### 2. 브라우저 설정 최적화

#### Chrome 설정
1. `chrome://settings/` 접속
2. "고급" → "시스템" → "하드웨어 가속 사용" 활성화
3. "고급" → "개인정보 및 보안" → "사이트 설정" → "JavaScript" 허용

#### Firefox 설정
1. `about:config` 접속
2. `webgl.disabled` → `false`
3. `webgl.force-enabled` → `true`
4. `media.navigator.enabled` → `true`

### 3. EC2 인스턴스 최적화

#### GPU 인스턴스 사용 (권장)
```bash
# GPU 인스턴스 타입 예시
g4dn.xlarge  # NVIDIA T4 GPU
g5.xlarge    # NVIDIA A10G GPU
```

#### 소프트웨어 렌더러 최적화
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mesa-utils

# CentOS/RHEL
sudo yum install mesa-utils
```

### 4. 네트워크 최적화

#### CDN 접근 확인
```bash
# CDN 접근 테스트
curl -I https://cdn.jsdelivr.net/npm/@mediapipe/holistic
curl -I https://unpkg.com/@mediapipe/holistic
```

#### 프록시 설정 (필요시)
```bash
# 환경 변수 설정
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

## 🔧 개발자 도구 활용

### 1. 콘솔 로그 확인
```javascript
// 브라우저 개발자 도구에서 실행
console.log('WebGL 지원:', !!document.createElement('canvas').getContext('webgl'));
console.log('MediaPipe 모듈:', typeof Holistic);
```

### 2. 네트워크 탭 확인
1. 개발자 도구 → Network 탭
2. MediaPipe 관련 파일 로드 상태 확인
3. 실패한 요청이 있는지 확인

### 3. 성능 모니터링
```javascript
// 성능 측정
const startTime = performance.now();
// MediaPipe 초기화
const endTime = performance.now();
console.log('초기화 시간:', endTime - startTime, 'ms');
```

## 📊 환경 진단

### 자동 진단 실행
```javascript
// 브라우저 콘솔에서 실행
import { diagnoseEnvironment } from '@/utils/mediaPipeUtils';
diagnoseEnvironment().then(console.log);
```

### 수동 진단 체크리스트
- [ ] WebGL 지원 확인
- [ ] MediaPipe 모듈 로드 확인
- [ ] 브라우저 버전 확인
- [ ] 네트워크 연결 확인
- [ ] GPU 가속 활성화 확인

## 🚀 성능 최적화

### 1. MediaPipe 설정 최적화
```javascript
// EC2 환경용 최적화 설정
const optimizedConfig = {
  modelComplexity: 0,        // 가장 낮은 복잡도
  smoothLandmarks: false,    // 스무딩 비활성화
  enableSegmentation: false, // 세그멘테이션 비활성화
  minDetectionConfidence: 0.3, // 낮은 임계값
  minTrackingConfidence: 0.3
};
```

### 2. 프레임 레이트 조정
```javascript
// 낮은 프레임 레이트로 성능 향상
const targetFPS = 15; // 기본 30fps에서 15fps로 감소
```

### 3. 해상도 조정
```javascript
// 낮은 해상도로 처리 속도 향상
const videoConfig = {
  width: 320,  // 기본 640에서 320으로 감소
  height: 240  // 기본 480에서 240으로 감소
};
```

## 📞 지원 요청

### 문제 보고 시 포함할 정보
1. **환경 정보**
   - EC2 인스턴스 타입
   - 운영체제 버전
   - 브라우저 종류 및 버전

2. **오류 로그**
   - 브라우저 콘솔 오류 메시지
   - 네트워크 탭 실패 요청
   - 성능 탭 메트릭

3. **재현 단계**
   - 문제 발생 단계별 설명
   - 예상 동작과 실제 동작 차이

### 연락처
- 기술 지원: support@waterandfish.com
- GitHub Issues: [프로젝트 이슈 페이지]
- 문서: [프로젝트 위키]

## 📚 추가 자료

- [MediaPipe 공식 문서](https://mediapipe.dev/)
- [WebGL 지원 확인](https://get.webgl.org/)
- [EC2 GPU 인스턴스 가이드](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/accelerated-computing-instances.html)
- [브라우저 호환성 테이블](https://caniuse.com/webgl) 