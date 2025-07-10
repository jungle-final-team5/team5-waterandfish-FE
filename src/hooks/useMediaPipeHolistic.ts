import { useRef, useCallback, useEffect, useState } from 'react';
import { Holistic, Results } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import { LandmarksData } from '@/services/SignClassifierClient';
import { 
  checkWebGLSupport, 
  checkMediaPipeModule, 
  getOptimizedMediaPipeConfig,
  createRetryLogic,
  getMediaPipeCDNUrls
} from '@/utils/mediaPipeUtils';

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
}

interface UseMediaPipeHolisticReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  isProcessing: boolean;
  lastLandmarks: LandmarksData | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  processFrame: () => void;
  error: string | null;
  retryInitialization: () => Promise<boolean>;
}

export const useMediaPipeHolistic = (
  options: UseMediaPipeHolisticOptions = {}
): UseMediaPipeHolisticReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holisticRef = useRef<Holistic | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLandmarks, setLastLandmarks] = useState<LandmarksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  const {
    onLandmarks,
    modelComplexity = 1,
    smoothLandmarks = true,
    enableSegmentation = false,
    smoothSegmentation = true,
    refineFaceLandmarks = false,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
    enableLogging = false
  } = options;

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
    return () => {}; // 로깅이 활성화된 경우 정리 함수 없음
  }, [enableLogging]);

  // WebGL 지원 확인 (유틸리티 함수 사용)
  const checkWebGLSupportLocal = useCallback(() => {
    const webglInfo = checkWebGLSupport();
    if (!webglInfo.supported) {
      console.warn('⚠️ WebGL 지원 확인 실패:', webglInfo.reason);
      return false;
    }
    
    if (webglInfo.isEC2Environment) {
      console.warn('⚠️ EC2 환경에서 소프트웨어 렌더러 사용 중:', webglInfo.details);
    }
    
    return true;
  }, []);

  // MediaPipe 모듈 로드 확인 (유틸리티 함수 사용)
  const checkMediaPipeModuleLocal = useCallback(async () => {
    const mediaPipeInfo = await checkMediaPipeModule();
    if (!mediaPipeInfo.loaded) {
      console.error('❌ MediaPipe 모듈 확인 실패:', mediaPipeInfo.reason);
      return false;
    }
    
    console.log('✅ MediaPipe Holistic 모듈 확인됨');
    return true;
  }, []);

  // MediaPipe 초기화
  const initializeMediaPipe = useCallback(async () => {
    try {
      setError(null);
      
      // WebGL 지원 확인
      if (!checkWebGLSupportLocal()) {
        throw new Error('WebGL이 지원되지 않아 MediaPipe를 초기화할 수 없습니다');
      }

      // MediaPipe 모듈 확인
      const moduleLoaded = await checkMediaPipeModuleLocal();
      if (!moduleLoaded) {
        throw new Error('MediaPipe 모듈을 로드할 수 없습니다');
      }

      // 로그 필터링 시작
      const cleanupLogs = filterConsoleLogs();
      
      console.log('🎯 MediaPipe Holistic 초기화 중...');
      
      // 브라우저가 완전히 준비될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 환경에 따른 최적화된 설정 가져오기
      const webglInfo = checkWebGLSupport();
      const optimizedConfig = getOptimizedMediaPipeConfig(webglInfo.isEC2Environment);
      
      let holistic;
      try {
        // CDN에서 파일을 로드하도록 설정
        const cdnUrls = getMediaPipeCDNUrls();
        holistic = new Holistic({
          locateFile: (file) => {
            return `${cdnUrls[0]}/${file}`;
          }
        });
        console.log('✅ Holistic 인스턴스 생성 성공');
      } catch (constructorError) {
        console.error('❌ Holistic 생성자 오류:', constructorError);
        
        // 대체 방법 시도
        try {
          holistic = new Holistic();
          console.log('✅ Holistic 인스턴스 생성 성공 (대체 방법)');
        } catch (fallbackError) {
          throw new Error(`MediaPipe Holistic 생성 실패: ${constructorError.message}`);
        }
      }

      // MediaPipe 옵션 설정 (최적화된 설정 사용)
      try {
        const finalConfig = {
          ...optimizedConfig,
          // 사용자가 지정한 옵션으로 덮어쓰기
          modelComplexity: modelComplexity ?? optimizedConfig.modelComplexity,
          smoothLandmarks: smoothLandmarks ?? optimizedConfig.smoothLandmarks,
          enableSegmentation: enableSegmentation ?? optimizedConfig.enableSegmentation,
          smoothSegmentation: smoothSegmentation ?? optimizedConfig.smoothSegmentation,
          refineFaceLandmarks: refineFaceLandmarks ?? optimizedConfig.refineFaceLandmarks,
          minDetectionConfidence: minDetectionConfidence ?? optimizedConfig.minDetectionConfidence,
          minTrackingConfidence: minTrackingConfidence ?? optimizedConfig.minTrackingConfidence,
        };
        
        holistic.setOptions(finalConfig);
        console.log('✅ Holistic 옵션 설정 성공 (최적화된 설정 적용)');
      } catch (optionsError) {
        console.error('❌ Holistic 옵션 설정 오류:', optionsError);
        throw new Error(`MediaPipe 옵션 설정 실패: ${optionsError.message}`);
      }

      // 결과 처리 콜백 설정
      try {
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
        console.log('✅ Holistic 결과 콜백 설정 성공');
      } catch (callbackError) {
        console.error('❌ Holistic 결과 콜백 설정 오류:', callbackError);
        throw new Error(`MediaPipe 결과 콜백 설정 실패: ${callbackError.message}`);
      }

      holisticRef.current = holistic;
      setIsInitialized(true);
      setInitializationAttempts(0);
      console.log('✅ MediaPipe Holistic 초기화 완료');
      
      // 로그 필터링 정리
      setTimeout(() => {
        cleanupLogs();
      }, 2000); // 2초 후 로그 필터링 해제
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('❌ MediaPipe Holistic 초기화 실패:', error);
      setError(errorMessage);
      setIsInitialized(false);
      setInitializationAttempts(prev => prev + 1);
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
    checkWebGLSupportLocal,
    checkMediaPipeModuleLocal
  ]);

  // 재시도 함수
  const retryInitialization = useCallback(async (): Promise<boolean> => {
    if (initializationAttempts >= 3) {
      setError('최대 재시도 횟수를 초과했습니다. 페이지를 새로고침해주세요.');
      return false;
    }

    console.log(`🔄 MediaPipe 초기화 재시도 ${initializationAttempts + 1}/3`);
    
    // 기존 인스턴스 정리
    if (holisticRef.current) {
      try {
        holisticRef.current.close();
      } catch (e) {
        console.warn('기존 MediaPipe 인스턴스 정리 중 오류:', e);
      }
      holisticRef.current = null;
    }

    // 잠시 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await initializeMediaPipe();
  }, [initializationAttempts, initializeMediaPipe]);

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
      
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (holisticRef.current && videoRef.current) {
            await holisticRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      cameraRef.current = camera;
      
      console.log('✅ 카메라 시작됨');
      return true;
    } catch (error) {
      console.error('❌ 카메라 시작 실패:', error);
      return false;
    }
  }, [isInitialized]);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
      console.log('📹 카메라 정지됨');
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
    // 사용자 상호작용 후 초기화 시도
    const handleUserInteraction = async () => {
      if (!isInitialized && !holisticRef.current) {
        await initializeMediaPipe();
      }
    };

    // 지연된 초기화 시도
    const initTimeout = setTimeout(handleUserInteraction, 2000);

    // 사용자 상호작용 이벤트 리스너
    const events = ['click', 'touchstart', 'keydown'];
    const eventHandlers = events.map(event => {
      const handler = () => handleUserInteraction();
      document.addEventListener(event, handler, { once: true });
      return { event, handler };
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearTimeout(initTimeout);
      eventHandlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
      });
      stopCamera();
      if (holisticRef.current) {
        try {
          holisticRef.current.close();
        } catch (e) {
          console.warn('MediaPipe 정리 중 오류:', e);
        }
        holisticRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [initializeMediaPipe, stopCamera, isInitialized]);

  return {
    videoRef,
    canvasRef,
    isInitialized,
    isProcessing,
    lastLandmarks,
    startCamera,
    stopCamera,
    processFrame,
    error,
    retryInitialization
  };
}; 