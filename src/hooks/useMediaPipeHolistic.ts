import { useRef, useCallback, useEffect, useState } from 'react';
import { Holistic, Results } from '@mediapipe/holistic';
import { LandmarksData } from '@/services/SignClassifierClient';

// Camera 클래스 타입 정의
interface CameraOptions {
  onFrame: () => Promise<void>;
  width?: number;
  height?: number;
  facingMode?: string;
}

interface CameraInterface {
  start(): Promise<void>;
  stop(): void;
}

// Camera 클래스 구현
class MediaPipeCamera implements CameraInterface {
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private options: CameraOptions;

  constructor(video: HTMLVideoElement, options: CameraOptions) {
    this.video = video;
    this.options = options;
  }

  async start(): Promise<void> {
    try {
      // 기존 스트림 정리
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // 카메라 접근 시도
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.options.width || 640 },
          height: { ideal: this.options.height || 480 },
          facingMode: this.options.facingMode || 'user'
        },
        audio: false
      };

      // 다양한 카메라 접근 방식 시도
      let stream: MediaStream;

      try {
        // 1. 기본 접근 방식
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn('⚠️ 기본 카메라 접근 실패, 대체 방식 시도:', error);

        try {
          // 2. 더 관대한 제약 조건
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (fallbackError) {
          console.warn('⚠️ 대체 카메라 접근 실패, 환경 확인:', fallbackError);

          // 3. 사용 가능한 카메라 확인
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');

          if (videoDevices.length === 0) {
            throw new Error('사용 가능한 카메라가 없습니다');
          }

          console.log('📹 사용 가능한 카메라:', videoDevices.map(d => d.label || d.deviceId));

          // 4. 특정 카메라로 시도
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: videoDevices[0].deviceId }
            },
            audio: false
          });
        }
      }

      this.stream = stream;
      this.video.srcObject = stream;

      // 비디오 로드 완료 대기
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('비디오 로드 타임아웃'));
        }, 10000);

        this.video.onloadedmetadata = () => {
          clearTimeout(timeout);
          this.video.play().then(resolve).catch(reject);
        };

        this.video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('비디오 로드 실패'));
        };
      });

      // 프레임 처리 시작
      this.startFrameProcessing();

      console.log('✅ 카메라 스트림 시작됨');
    } catch (error) {
      console.error('❌ 카메라 시작 실패:', error);
      throw error;
    }
  }

  private startFrameProcessing(): void {
    const processFrame = async () => {
      if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA
        try {
          await this.options.onFrame();
        } catch (error) {
          console.warn('⚠️ 프레임 처리 오류:', error);
        }
      }
      this.animationId = requestAnimationFrame(processFrame);
    };

    this.animationId = requestAnimationFrame(processFrame);
  }

  stop(): void {
    // 애니메이션 프레임 정지
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 스트림 정지
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // 비디오 정리
    if (this.video.srcObject) {
      this.video.srcObject = null;
    }

    console.log('📹 카메라 스트림 정지됨');
  }
}

interface UseMediaPipeHolisticOptions {
  onLandmarks?: (landmarks: LandmarksData) => void;
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  smoothSegmentation?: boolean;
  refineFaceLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  enableLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseMediaPipeHolisticReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  isProcessing: boolean;
  lastLandmarks: LandmarksData | null;
  error: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  processFrame: () => void;
  retryInitialization: () => Promise<boolean>;
  inspect_sequence: (sequence: any) => boolean;
  initializeSession: () => Promise<boolean>;
  webglSupported: boolean | null;
}

// MediaPipe 모듈 로딩 상태 추적
let mediaPipeLoadPromise: Promise<boolean> | null = null;
let mediaPipeLoadAttempts = 0;
const MAX_GLOBAL_RETRIES = 5; // 증가

// CDN URL 목록 (대체 CDN 포함)
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/holistic',
  'https://unpkg.com/@mediapipe/holistic',
  'https://cdnjs.cloudflare.com/ajax/libs/mediapipe-holistic'
];

// 전역 MediaPipe 객체 확인
const checkGlobalMediaPipe = (): boolean => {
  try {
    // window 객체에 MediaPipe가 있는지 확인
    if (typeof window !== 'undefined' && (window as any).MediaPipe) {
      console.log('✅ 전역 MediaPipe 객체 발견');
      return true;
    }

    // require나 import로 로드된 모듈 확인
    if (typeof require !== 'undefined') {
      try {
        const mediapipe = require('@mediapipe/holistic');
        if (mediapipe && mediapipe.Holistic) {
          console.log('✅ require로 MediaPipe 모듈 발견');
          return true;
        }
      } catch (e) {
        // require 실패는 정상
      }
    }

    return false;
  } catch (error) {
    console.warn('⚠️ 전역 MediaPipe 확인 실패:', error);
    return false;
  }
};

// 스크립트 태그를 통한 MediaPipe 로딩
const loadMediaPipeViaScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 이미 로드되어 있는지 확인
    if (typeof window !== 'undefined' && (window as any).MediaPipe) {
      console.log('✅ MediaPipe가 이미 로드되어 있음');
      resolve(true);
      return;
    }

    // 다양한 스크립트 URL 시도
    const scriptUrls = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/holistic.js',
      'https://unpkg.com/@mediapipe/holistic@0.5.1675471629/holistic.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js',
      'https://unpkg.com/@mediapipe/holistic/holistic.js'
    ];

    let currentIndex = 0;

    const tryNextScript = () => {
      if (currentIndex >= scriptUrls.length) {
        console.error('❌ 모든 MediaPipe 스크립트 URL 시도 실패');
        resolve(false);
        return;
      }

      const scriptUrl = scriptUrls[currentIndex];
      console.log(`📥 MediaPipe 스크립트 로딩 시도: ${scriptUrl}`);

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;

      script.onload = () => {
        console.log(`✅ MediaPipe 스크립트 로드 성공: ${scriptUrl}`);
        resolve(true);
      };

      script.onerror = () => {
        console.warn(`⚠️ MediaPipe 스크립트 로드 실패: ${scriptUrl}`);
        currentIndex++;
        tryNextScript();
      };

      document.head.appendChild(script);
    };

    tryNextScript();
  });
};

// CDN 접근성 확인
const checkCDNAccessibility = async (): Promise<string | null> => {
  for (const cdnUrl of CDN_URLS) {
    try {
      const response = await fetch(`${cdnUrl}/holistic_solution_simd_wasm_bin.js`, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (response.ok) {
        console.log(`✅ CDN 접근 가능: ${cdnUrl}`);
        return cdnUrl;
      }
    } catch (error) {
      console.warn(`⚠️ CDN 접근 실패: ${cdnUrl}`, error);
    }
  }

  console.error('❌ 모든 CDN 접근 실패');
  return null;
};

// MediaPipe 모듈 로딩 함수
const loadMediaPipeModule = async (): Promise<boolean> => {
  try {
    console.log('📦 MediaPipe 모듈 로딩 시작...');

    // 전역 MediaPipe 확인
    if (checkGlobalMediaPipe()) {
      console.log('✅ 전역 MediaPipe 사용 가능');
      return true;
    }

    // 스크립트 태그를 통한 로딩 시도
    console.log('📥 MediaPipe 스크립트 태그 로딩 시도...');
    const scriptLoaded = await loadMediaPipeViaScript();
    if (scriptLoaded && checkGlobalMediaPipe()) {
      console.log('✅ 스크립트 태그를 통한 MediaPipe 로딩 성공');
      return true;
    }

    // CDN 접근성 확인
    const accessibleCDN = await checkCDNAccessibility();
    if (!accessibleCDN) {
      throw new Error('MediaPipe CDN에 접근할 수 없습니다');
    }

    // 로컬 파일을 통한 MediaPipe 모듈 로드 (LetterSession 방식 적용)
    console.log('📥 MediaPipe 모듈 로컬 파일 로드 시도...');
    
    // loadScript 함수 정의
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // public 폴더의 파일을 가리키도록 수정 (앞에 / 를 붙여 절대 경로로 지정)
        script.src = `/${src}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`${src} 로드 실패`));
        document.body.appendChild(script);
      });
    };
    
    
      await Promise.all([
        loadScript('holistic.js')
      ]);
      
      console.log('MediaPipe 스크립트 로드 성공');
      
      // 전역 객체로 로드된 MediaPipe 사용
      const mediapipeModule = { default: (window as any).Holistic };
      console.log('전역 객체에서 Holistic 생성자 가져옴:', mediapipeModule.default);

    // 모듈 구조 확인
    console.log('🔍 MediaPipe 모듈 구조 확인:', Object.keys(mediapipeModule));
    console.log('🔍 default export 타입:', typeof mediapipeModule.default);

    // 다양한 방식으로 Holistic 생성자 찾기
    let Holistic: any = null;

    // 1. 직접 export 확인
    if (mediapipeModule.Holistic) {
      Holistic = mediapipeModule.Holistic;
      console.log('✅ 직접 export에서 Holistic 발견');
    }
    // 2. default export 확인 (개선된 로직)
    else if (mediapipeModule.default) {
      console.log('🔍 default export 상세 분석...');

      // default가 객체인 경우
      if (typeof mediapipeModule.default === 'object' && mediapipeModule.default !== null) {
        console.log('default export 객체의 키들:', Object.keys(mediapipeModule.default));

        // 다양한 가능한 키 이름 확인
        const possibleKeys = ['Holistic', 'holistic', 'HolisticSolution', 'holisticSolution'];
        for (const key of possibleKeys) {
          if (mediapipeModule.default[key]) {
            Holistic = mediapipeModule.default[key];
            console.log(`✅ default export 객체에서 ${key} 발견`);
            break;
          }
        }

        // 모든 속성을 순회하며 함수 타입 찾기
        if (!Holistic) {
          for (const [key, value] of Object.entries(mediapipeModule.default)) {
            if (typeof value === 'function' && key.toLowerCase().includes('holistic')) {
              Holistic = value;
              console.log(`✅ default export에서 함수 발견: ${key}`);
              break;
            }
          }
        }
      }
      // default가 함수인 경우 (생성자일 수 있음)
      else if (typeof mediapipeModule.default === 'function') {
        Holistic = mediapipeModule.default;
        console.log('✅ default export가 Holistic 생성자인 것으로 추정');
      }
    }

    // 3. 전역 객체에서 찾기
    if (!Holistic && typeof window !== 'undefined') {
      if ((window as any).MediaPipe && (window as any).MediaPipe.Holistic) {
        Holistic = (window as any).MediaPipe.Holistic;
        console.log('✅ 전역 MediaPipe 객체에서 Holistic 발견');
      }
    }

    // 4. 스크립트 태그 로딩 후 전역 객체 재확인
    if (!Holistic) {
      console.log('🔄 스크립트 태그 로딩 후 전역 객체 재확인...');
      await loadMediaPipeViaScript();

      if (typeof window !== 'undefined') {
        // 다양한 전역 객체 경로 확인
        const globalPaths = [
          'MediaPipe.Holistic',
          'MediaPipe.holistic',
          'Holistic',
          'holistic',
          'MediaPipeHolistic',
          'mediaPipeHolistic'
        ];

        for (const path of globalPaths) {
          const parts = path.split('.');
          let obj: any = window;
          let found = true;

          for (const part of parts) {
            if (obj && obj[part]) {
              obj = obj[part];
            } else {
              found = false;
              break;
            }
          }

          if (found && typeof obj === 'function') {
            Holistic = obj;
            console.log(`✅ 전역 객체에서 발견: ${path}`);
            break;
          }
        }
      }
    }

    if (!Holistic) {
      console.error('❌ Holistic 생성자를 찾을 수 없습니다');
      console.log('사용 가능한 exports:', Object.keys(mediapipeModule));
      console.log('default export 타입:', typeof mediapipeModule.default);
      if (mediapipeModule.default && typeof mediapipeModule.default === 'object') {
        console.log('default export 내용:', mediapipeModule.default);
        console.log('default export의 모든 속성:');
        for (const [key, value] of Object.entries(mediapipeModule.default)) {
          console.log(`  ${key}: ${typeof value}`);
        }
      }
      throw new Error('Holistic constructor not found in module');
    }

    if (typeof Holistic !== 'function') {
      console.error('❌ Holistic이 함수가 아닙니다:', typeof Holistic);
      throw new Error('Holistic is not a constructor function');
    }

    console.log('✅ Holistic 생성자 확인됨');

    // 테스트 인스턴스 생성으로 초기화 확인
    console.log('🧪 MediaPipe 테스트 인스턴스 생성...');
    const testHolistic = new Holistic({
      locateFile: (file) => {
        return `${accessibleCDN}/${file}`;
      }
    });

    // 기본 옵션으로 초기화 테스트
    testHolistic.setOptions({
      modelComplexity: 0,
      smoothLandmarks: false,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // 정리
    await testHolistic.close();

    console.log('✅ MediaPipe 모듈 로드 성공');
    return true;
  } catch (error) {
    console.error('❌ MediaPipe 모듈 로드 실패:', error);

    // 더 자세한 오류 정보 출력
    if (error instanceof Error) {
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
    }

    return false;
  }
};
// WASM 파일 접근성 확인
const checkWasmAccessibility = async (): Promise<boolean> => {
  const wasmFiles = [
    'holistic_solution_simd_wasm_bin.js',
    'holistic_solution_simd_wasm_bin.wasm'
  ];

  // CDN 접근성 확인
  const accessibleCDN = await checkCDNAccessibility();
  if (!accessibleCDN) {
    return false;
  }

  try {
    for (const file of wasmFiles) {
      const response = await fetch(`${accessibleCDN}/${file}`, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        console.warn(`⚠️ WASM 파일 접근 실패: ${file}`);
        return false;
      }
    }

    console.log('✅ WASM 파일 접근 가능');
    return true;
  } catch (error) {
    console.error('❌ WASM 파일 접근 확인 실패:', error);
    return false;
  }
};

export const useMediaPipeHolistic = (
  options: UseMediaPipeHolisticOptions = {}
): UseMediaPipeHolisticReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holisticRef = useRef<Holistic | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLandmarks, setLastLandmarks] = useState<LandmarksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBufferingPaused, setIsBufferingPaused] = useState(false);

  const {
    onLandmarks,
    modelComplexity = 1,
    smoothLandmarks = true,
    enableSegmentation = false,
    smoothSegmentation = true,
    refineFaceLandmarks = false,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
    enableLogging = false,
    maxRetries = 3,
    retryDelay = 2000
  } = options;

  // WebGL 지원 확인
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        setWebglSupported(!!gl);
      } catch (err) {
        alert(`지원하지 않는 브라우저입니다. 크롬 브라우저를 사용해주세요.`);
        setWebglSupported(false);
      }
    };
    checkWebGL();
  }, []);

  const inspect_sequence = (sequence: any) => {
    // console.log('🔍 시퀀스 검사 시작:', sequence.data.sequence?.length || 0, '프레임');

    // 시퀀스 데이터 추출
    const landmarksSequence = sequence.data.sequence as LandmarksData[];
    if (!landmarksSequence || landmarksSequence.length < 3) {
      return; // 최소 3개 프레임이 필요
    }

    // 가속도 계산을 위한 임계값 설정
    const ACCELERATION_THRESHOLD = 300.0; // 가속도 임계값 (더 낮게 조정)
    const FRAME_RATE = 30; // 예상 프레임 레이트
    const FRAME_INTERVAL = 1 / FRAME_RATE; // 프레임 간격 (초)

    // 노이즈 필터링을 위한 설정
    const MIN_MOVEMENT_THRESHOLD = 0.01; // 최소 이동 거리 임계값 (낮게 조정)
    const CONSECUTIVE_DETECTIONS_REQUIRED = 1; // 연속 감지 횟수 요구사항 (1로 줄임)
    const TOTAL_MOVEMENT_THRESHOLD = 0.03; // 전체 이동 거리 임계값 (낮게 조정)

    // 각 랜드마크 포인트의 가속도 계산 (손만 감지)
    const checkAcceleration = () => {
      let fastMovementCount = 0; // 빠른 동작 감지 횟수

      for (let i = 1; i < landmarksSequence.length - 1; i++) {
        const prev = landmarksSequence[i - 1];
        const current = landmarksSequence[i];
        const next = landmarksSequence[i + 1];

        // 손 랜드마크 가속도 계산 (왼손)
        if (prev.left_hand && current.left_hand && next.left_hand) {
          for (let j = 0; j < Math.min(prev.left_hand.length, current.left_hand.length, next.left_hand.length); j++) {
            const prevPos = prev.left_hand[j];
            const currentPos = current.left_hand[j];
            const nextPos = next.left_hand[j];

            if (prevPos && currentPos && nextPos && prevPos.length >= 3 && currentPos.length >= 3 && nextPos.length >= 3) {
              // 개별 프레임 간 이동 거리 계산
              const movement1 = Math.sqrt(
                Math.pow(currentPos[0] - prevPos[0], 2) +
                Math.pow(currentPos[1] - prevPos[1], 2) +
                Math.pow(currentPos[2] - prevPos[2], 2)
              );

              const movement2 = Math.sqrt(
                Math.pow(nextPos[0] - currentPos[0], 2) +
                Math.pow(nextPos[1] - currentPos[1], 2) +
                Math.pow(nextPos[2] - currentPos[2], 2)
              );

              // 전체 이동 거리 계산 (시작점에서 끝점까지의 직선 거리)
              const totalMovement = Math.sqrt(
                Math.pow(nextPos[0] - prevPos[0], 2) +
                Math.pow(nextPos[1] - prevPos[1], 2) +
                Math.pow(nextPos[2] - prevPos[2], 2)
              );

              // 최소 이동 거리와 전체 이동 거리 모두 확인
              if (movement1 < MIN_MOVEMENT_THRESHOLD && movement2 < MIN_MOVEMENT_THRESHOLD) {
                continue; // 개별 프레임 간 이동이 너무 작음
              }

              if (totalMovement < TOTAL_MOVEMENT_THRESHOLD) {
                continue; // 전체 이동 거리가 너무 작음 (미세한 움직임 무시)
              }

              const velocity1 = {
                x: (currentPos[0] - prevPos[0]) / FRAME_INTERVAL,
                y: (currentPos[1] - prevPos[1]) / FRAME_INTERVAL,
                z: (currentPos[2] - prevPos[2]) / FRAME_INTERVAL
              };

              const velocity2 = {
                x: (nextPos[0] - currentPos[0]) / FRAME_INTERVAL,
                y: (nextPos[1] - currentPos[1]) / FRAME_INTERVAL,
                z: (nextPos[2] - currentPos[2]) / FRAME_INTERVAL
              };

              const acceleration = {
                x: (velocity2.x - velocity1.x) / FRAME_INTERVAL,
                y: (velocity2.y - velocity1.y) / FRAME_INTERVAL,
                z: (velocity2.z - velocity1.z) / FRAME_INTERVAL
              };

              const accelerationMagnitude = Math.sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
              );

              if (accelerationMagnitude > ACCELERATION_THRESHOLD) {
                fastMovementCount++;
                console.warn(`🚨 빠른 동작 감지! 왼손 포인트 ${j}의 가속도: ${accelerationMagnitude.toFixed(3)} (${fastMovementCount}/${CONSECUTIVE_DETECTIONS_REQUIRED})`);
                if (fastMovementCount >= CONSECUTIVE_DETECTIONS_REQUIRED) {
                  // alert(`너무 빠른 동작이 감지되었습니다!\n왼손 포인트 ${j}의 가속도: ${accelerationMagnitude.toFixed(3)}\n천천히 동작해주세요.`);
                  setIsBufferingPaused(true);
                  return true;
                }
              } else {
                fastMovementCount = 0;
              }
            }
          }
        }

        // 손 랜드마크 가속도 계산 (오른손)
        if (prev.right_hand && current.right_hand && next.right_hand) {
          for (let j = 0; j < Math.min(prev.right_hand.length, current.right_hand.length, next.right_hand.length); j++) {
            const prevPos = prev.right_hand[j];
            const currentPos = current.right_hand[j];
            const nextPos = next.right_hand[j];

            if (prevPos && currentPos && nextPos && prevPos.length >= 3 && currentPos.length >= 3 && nextPos.length >= 3) {
              // 개별 프레임 간 이동 거리 계산
              const movement1 = Math.sqrt(
                Math.pow(currentPos[0] - prevPos[0], 2) +
                Math.pow(currentPos[1] - prevPos[1], 2) +
                Math.pow(currentPos[2] - prevPos[2], 2)
              );

              const movement2 = Math.sqrt(
                Math.pow(nextPos[0] - currentPos[0], 2) +
                Math.pow(nextPos[1] - currentPos[1], 2) +
                Math.pow(nextPos[2] - currentPos[2], 2)
              );

              // 전체 이동 거리 계산 (시작점에서 끝점까지의 직선 거리)
              const totalMovement = Math.sqrt(
                Math.pow(nextPos[0] - prevPos[0], 2) +
                Math.pow(nextPos[1] - prevPos[1], 2) +
                Math.pow(nextPos[2] - prevPos[2], 2)
              );

              // 최소 이동 거리와 전체 이동 거리 모두 확인
              if (movement1 < MIN_MOVEMENT_THRESHOLD && movement2 < MIN_MOVEMENT_THRESHOLD) {
                continue; // 개별 프레임 간 이동이 너무 작음
              }

              if (totalMovement < TOTAL_MOVEMENT_THRESHOLD) {
                continue; // 전체 이동 거리가 너무 작음 (미세한 움직임 무시)
              }

              const velocity1 = {
                x: (currentPos[0] - prevPos[0]) / FRAME_INTERVAL,
                y: (currentPos[1] - prevPos[1]) / FRAME_INTERVAL,
                z: (currentPos[2] - prevPos[2]) / FRAME_INTERVAL
              };

              const velocity2 = {
                x: (nextPos[0] - currentPos[0]) / FRAME_INTERVAL,
                y: (nextPos[1] - currentPos[1]) / FRAME_INTERVAL,
                z: (nextPos[2] - currentPos[2]) / FRAME_INTERVAL
              };

              const acceleration = {
                x: (velocity2.x - velocity1.x) / FRAME_INTERVAL,
                y: (velocity2.y - velocity1.y) / FRAME_INTERVAL,
                z: (velocity2.z - velocity1.z) / FRAME_INTERVAL
              };

              const accelerationMagnitude = Math.sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
              );

              if (accelerationMagnitude > ACCELERATION_THRESHOLD) {
                fastMovementCount++;
                console.warn(`🚨 빠른 동작 감지! 오른손 포인트 ${j}의 가속도: ${accelerationMagnitude.toFixed(3)} (${fastMovementCount}/${CONSECUTIVE_DETECTIONS_REQUIRED})`);

                if (fastMovementCount >= CONSECUTIVE_DETECTIONS_REQUIRED) {
                  // alert(`너무 빠른 동작이 감지되었습니다!\n오른손 포인트 ${j}의 가속도: ${accelerationMagnitude.toFixed(3)}\n천천히 동작해주세요.`);
                  setIsBufferingPaused(true);
                  return true;
                }
              } else {
                fastMovementCount = 0;
              }
            }
          }
        }
      }
      return false;
    };

    // 가속도 검사 실행
    const hasFastMovement = checkAcceleration();

    if (!hasFastMovement) {
      // console.log('✅ 동작 속도 정상');
    }
    return hasFastMovement; // 실제 감지 결과 반환
  }

  // 콘솔 로그 필터링 함수
  const filterConsoleLogs = useCallback(() => {
    if (!enableLogging) {
      // 원본 console.log 저장
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalInfo = console.info;

      // MediaPipe 관련 로그 필터링
      console.log = (...args) => {
        const message = args.join(' ');
        // MediaPipe 내부 로그 필터링
        if (
          message.includes('GL version:') ||
          message.includes('gl_context.cc:') ||
          message.includes('I0000') ||
          message.includes('overrideMethod') ||
          message.includes('put_char') ||
          message.includes('write') ||
          message.includes('doWritev') ||
          message.includes('_fd_write') ||
          message.includes('$func') ||
          message.includes('holistic_solution_simd_wasm_bin')
        ) {
          return; // 로그 숨김
        }
        originalLog(...args);
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        // MediaPipe 관련 경고 필터링
        if (
          message.includes('GL version:') ||
          message.includes('gl_context.cc:') ||
          message.includes('I0000')
        ) {
          return; // 경고 숨김
        }
        originalWarn(...args);
      };

      // 에러는 그대로 표시 (중요한 문제일 수 있음)
      console.error = originalError;
      console.info = originalInfo;

      // 정리 함수 반환
      return () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
        console.info = originalInfo;
      };
    }
    return () => { }; // 로깅이 활성화된 경우 정리 함수 없음
  }, [enableLogging]);

  // WebGL 지원 확인
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        console.warn('⚠️ WebGL이 지원되지 않습니다');
        return false;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log('🎮 WebGL 렌더러:', renderer);
      }

      return true;
    } catch (error) {
      console.error('❌ WebGL 지원 확인 실패:', error);
      return false;
    }
  }, []);

  // 지연 함수
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // MediaPipe 초기화 (재시도 로직 포함)
  const initializeMediaPipe = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      setError(null);

      // WebGL 지원 확인
      if (!checkWebGLSupport()) {
        throw new Error('WebGL이 지원되지 않아 MediaPipe를 초기화할 수 없습니다');
      }

      // WASM 파일 접근성 확인
      const wasmAccessible = await checkWasmAccessibility();
      if (!wasmAccessible) {
        throw new Error('WASM 파일에 접근할 수 없습니다. 네트워크 연결을 확인해주세요.');
      }

      // 로그 필터링 시작
      const cleanupLogs = filterConsoleLogs();

      console.log(`🎯 MediaPipe Holistic 초기화 중... (시도 ${retryCount + 1}/${maxRetries + 1})`);

      // 전역 로딩 상태 확인
      if (mediaPipeLoadPromise) {
        console.log('⏳ MediaPipe 모듈 로딩 대기 중...');
        const loadSuccess = await mediaPipeLoadPromise;
        if (!loadSuccess) {
          throw new Error('MediaPipe 모듈 로딩 실패');
        }
      } else {
        // 새로운 로딩 시도
        mediaPipeLoadPromise = loadMediaPipeModule();
        const loadSuccess = await mediaPipeLoadPromise;
        if (!loadSuccess) {
          mediaPipeLoadPromise = null;
          throw new Error('MediaPipe 모듈 로딩 실패');
        }
      }

      // Holistic 인스턴스 생성 (개선된 방식)
      let Holistic: any = null;

      // 1. 전역 객체에서 찾기 (우선순위)
      if (typeof window !== 'undefined') {
        // 다양한 전역 객체 경로 확인
        const globalPaths = [
          'MediaPipe.Holistic',
          'MediaPipe.holistic',
          'Holistic',
          'holistic',
          'MediaPipeHolistic',
          'mediaPipeHolistic'
        ];

        for (const path of globalPaths) {
          const parts = path.split('.');
          let obj: any = window;
          let found = true;

          for (const part of parts) {
            if (obj && obj[part]) {
              obj = obj[part];
            } else {
              found = false;
              break;
            }
          }

          if (found && typeof obj === 'function') {
            Holistic = obj;
            console.log(`✅ 전역 객체에서 Holistic 발견: ${path}`);
            break;
          }
        }
      }

      // 2. 모듈에서 찾기
      if (!Holistic) {
        const mediapipeModule = await import('@mediapipe/holistic');

        // 직접 export 확인
        if (mediapipeModule.Holistic) {
          Holistic = mediapipeModule.Holistic;
          console.log('✅ 모듈에서 직접 export Holistic 발견');
        }
        // default export 확인 (개선된 로직)
        else if (mediapipeModule.default) {
          console.log('🔍 모듈 default export 분석...');

          if (typeof mediapipeModule.default === 'object' && mediapipeModule.default !== null) {
            console.log('default export 객체의 키들:', Object.keys(mediapipeModule.default));

            // 다양한 가능한 키 이름 확인
            const possibleKeys = ['Holistic', 'holistic', 'HolisticSolution', 'holisticSolution'];
            for (const key of possibleKeys) {
              if (mediapipeModule.default[key]) {
                Holistic = mediapipeModule.default[key];
                console.log(`✅ default export 객체에서 ${key} 발견`);
                break;
              }
            }

            // 모든 속성을 순회하며 함수 타입 찾기
            if (!Holistic) {
              for (const [key, value] of Object.entries(mediapipeModule.default)) {
                if (typeof value === 'function' && key.toLowerCase().includes('holistic')) {
                  Holistic = value;
                  console.log(`✅ default export에서 함수 발견: ${key}`);
                  break;
                }
              }
            }
          } else if (typeof mediapipeModule.default === 'function') {
            Holistic = mediapipeModule.default;
            console.log('✅ default export가 Holistic 생성자인 것으로 추정');
          }
        }
      }

      // 3. 스크립트 태그 로딩 후 재시도
      if (!Holistic) {
        console.log('🔄 스크립트 태그 로딩 후 Holistic 재검색...');
        await loadMediaPipeViaScript();

        // 전역 객체 재확인
        if (typeof window !== 'undefined') {
          const globalPaths = [
            'MediaPipe.Holistic',
            'MediaPipe.holistic',
            'Holistic',
            'holistic',
            'MediaPipeHolistic',
            'mediaPipeHolistic'
          ];

          for (const path of globalPaths) {
            const parts = path.split('.');
            let obj: any = window;
            let found = true;

            for (const part of parts) {
              if (obj && obj[part]) {
                obj = obj[part];
              } else {
                found = false;
                break;
              }
            }

            if (found && typeof obj === 'function') {
              Holistic = obj;
              console.log(`✅ 스크립트 로딩 후 전역 객체에서 발견: ${path}`);
              break;
            }
          }
        }
      }

      if (!Holistic) {
        console.error('❌ Holistic 생성자를 찾을 수 없습니다');
        throw new Error('Holistic constructor not found in module or global object');
      }

      // CDN 접근성 재확인
      const accessibleCDN = await checkCDNAccessibility();
      if (!accessibleCDN) {
        throw new Error('MediaPipe CDN에 접근할 수 없습니다');
      }

      const holistic = new Holistic({
        locateFile: (file) => {
          return `${accessibleCDN}/${file}`;
        }
      });

      // MediaPipe 옵션 설정
      holistic.setOptions({
        modelComplexity,
        smoothLandmarks,
        enableSegmentation,
        smoothSegmentation,
        refineFaceLandmarks,
        minDetectionConfidence,
        minTrackingConfidence
      });

      // 결과 처리 콜백 설정
      holistic.onResults((results: Results) => {
        setIsProcessing(true);

        try {
          // 랜드마크 데이터 추출 및 변환
          const landmarksData: LandmarksData = {
            pose: results.poseLandmarks
              ? results.poseLandmarks.map(landmark => [landmark.x, landmark.y, landmark.z])
              : null,
            left_hand: results.leftHandLandmarks
              ? results.leftHandLandmarks.map(landmark => [landmark.x, landmark.y, landmark.z])
              : null,
            right_hand: results.rightHandLandmarks
              ? results.rightHandLandmarks.map(landmark => [landmark.x, landmark.y, landmark.z])
              : null
          };

          setLastLandmarks(landmarksData);

          // 콜백 호출
          if (onLandmarks) {
            onLandmarks(landmarksData);
          }

          // 디버그용 시각화 (옵션)
          if (canvasRef.current) {
            drawLandmarks(results);
          }

        } catch (error) {
          console.error('❌ 랜드마크 처리 실패:', error);
        } finally {
          setIsProcessing(false);
        }
      });

      holisticRef.current = holistic;
      setIsInitialized(true);
      console.log('✅ MediaPipe Holistic 초기화 완료');

      // 로그 필터링 정리
      setTimeout(() => {
        cleanupLogs();
      }, 2000); // 2초 후 로그 필터링 해제

      return true;
    } catch (error) {
      console.error(`❌ MediaPipe Holistic 초기화 실패 (시도 ${retryCount + 1}):`, error);

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setError(`초기화 실패: ${errorMessage}`);
      setIsInitialized(false);

      // 재시도 로직
      if (retryCount < maxRetries) {
        console.log(`🔄 ${retryDelay}ms 후 재시도...`);
        await delay(retryDelay);
        return initializeMediaPipe(retryCount + 1);
      }

      return false;
    }
  }, [
    onLandmarks,
    modelComplexity,
    smoothLandmarks,
    enableSegmentation,
    smoothSegmentation,
    refineFaceLandmarks,
    minDetectionConfidence,
    minTrackingConfidence,
    filterConsoleLogs,
    checkWebGLSupport,
    maxRetries,
    retryDelay
  ]);

  // 랜드마크 시각화 (디버그용)
  const drawLandmarks = useCallback((results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 랜드마크 그리기 (선택적)
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    // 포즈 랜드마크
    if (results.poseLandmarks) {
      results.poseLandmarks.forEach((landmark) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 손 랜드마크
    [results.leftHandLandmarks, results.rightHandLandmarks].forEach((handLandmarks, index) => {
      if (handLandmarks) {
        ctx.fillStyle = index === 0 ? 'green' : 'orange';
        handLandmarks.forEach((landmark) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!videoRef.current || !isInitialized || !holisticRef.current) {
      console.warn('⚠️ MediaPipe가 초기화되지 않음');
      return false;
    }

    try {
      console.log('📹 카메라 시작 중...');

      // 카메라 권한 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('카메라 API가 지원되지 않습니다');
      }

      // 기존 카메라 정리
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      const camera = new MediaPipeCamera(videoRef.current, {
        onFrame: async () => {
          if (holisticRef.current && videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await holisticRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.warn('⚠️ MediaPipe 프레임 처리 오류:', error);
            }
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user'
      });

      await camera.start();
      cameraRef.current = camera;

      console.log('✅ 카메라 시작됨');
      return true;
    } catch (error) {
      console.error('[useMediaPipeHolistic] ❌ 카메라 시작 실패:', error);

      // 더 자세한 오류 정보 제공
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        } else if (error.name === 'NotFoundError') {
          setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
        } else if (error.name === 'NotReadableError') {
          setError('카메라가 다른 애플리케이션에서 사용 중입니다.');
        } else {
          setError(`카메라 오류: ${error.message}`);
        }
      }

      return false;
    }
  }, [isInitialized]);

  // 카메라 및 MediaPipe 초기화
  const initializeSession = async () => {
    if (!isInitialized) {
      console.log('⚠️ MediaPipe가 아직 초기화되지 않음');
      return false;
    }

    try {
      console.log('📹 카메라 시작 중...');
      const cameraStarted = await startCamera();

      if (cameraStarted) {
        console.log('✅ 세션 초기화 완료');
        return true;
      } else {
        console.log('[LearnSession] ❌ 카메라 시작 실패');
        return false;
      }
    } catch (error) {
      console.error('❌ 세션 초기화 실패:', error);
      return false;
    }
  };

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
        cameraRef.current = null;
        console.log('📹 카메라 정지됨');
      } catch (error) {
        console.warn('⚠️ 카메라 정지 중 오류:', error);
      }
    }
  }, []);

  // 수동 프레임 처리
  const processFrame = useCallback(() => {
    if (holisticRef.current && videoRef.current && videoRef.current.readyState >= 2) {
      holisticRef.current.send({ image: videoRef.current });
    }
  }, []);

  // 컴포넌트 마운트 시 MediaPipe 초기화
  useEffect(() => {
    initializeMediaPipe();

    // 컴포넌트 언마운트 시 정리
    return () => {
      try {
        stopCamera();
        if (holisticRef.current) {
          holisticRef.current.close();
          holisticRef.current = null;
        }
        setIsInitialized(false);
      } catch (error) {
        console.warn('⚠️ 컴포넌트 정리 중 오류:', error);
      }
    };
  }, [initializeMediaPipe, stopCamera]);

  // 수동 재시도 함수
  const retryInitialization = useCallback(async (): Promise<boolean> => {
    console.log('🔄 MediaPipe 초기화 재시도...');
    setError(null);

    // 기존 인스턴스 정리
    if (holisticRef.current) {
      await holisticRef.current.close();
      holisticRef.current = null;
    }

    // 전역 로딩 상태 리셋
    mediaPipeLoadPromise = null;

    return initializeMediaPipe();
  }, [initializeMediaPipe]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isProcessing,
    lastLandmarks,
    error,
    startCamera,
    stopCamera,
    processFrame,
    retryInitialization,
    inspect_sequence,
    initializeSession,
    webglSupported
  };
}; 