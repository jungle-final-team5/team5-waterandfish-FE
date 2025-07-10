// MediaPipe 초기화를 위한 유틸리티 함수들

/**
 * WebGL 지원 여부를 확인하고 상세 정보를 반환
 */
export const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return {
        supported: false,
        reason: 'WebGL 컨텍스트를 생성할 수 없습니다',
        details: '브라우저가 WebGL을 지원하지 않거나 GPU 가속이 비활성화되어 있습니다'
      };
    }

    // WebGL 정보 수집
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const info = {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };

    if (debugInfo) {
      info.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      info.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    // EC2 환경에서 흔히 발생하는 문제들 확인
    const isEC2Environment = info.renderer?.toLowerCase().includes('llvmpipe') || 
                           info.renderer?.toLowerCase().includes('swiftshader') ||
                           info.renderer?.toLowerCase().includes('software');

    return {
      supported: true,
      isEC2Environment,
      info,
      details: isEC2Environment 
        ? 'EC2 환경에서 소프트웨어 렌더러가 사용되고 있습니다. 성능이 제한적일 수 있습니다.'
        : 'WebGL이 정상적으로 지원됩니다.'
    };
  } catch (error) {
    return {
      supported: false,
      reason: 'WebGL 확인 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

/**
 * MediaPipe 모듈이 로드되었는지 확인
 */
export const checkMediaPipeModule = async () => {
  try {
    // 동적 import로 MediaPipe 모듈 확인
    const { Holistic } = await import('@mediapipe/holistic');
    
    if (typeof Holistic === 'undefined') {
      return {
        loaded: false,
        reason: 'MediaPipe Holistic 모듈이 로드되지 않았습니다'
      };
    }

    if (typeof Holistic !== 'function') {
      return {
        loaded: false,
        reason: 'MediaPipe Holistic이 생성자 함수가 아닙니다'
      };
    }

    return {
      loaded: true,
      reason: 'MediaPipe Holistic 모듈이 정상적으로 로드되었습니다'
    };
  } catch (error) {
    return {
      loaded: false,
      reason: 'MediaPipe 모듈 로드 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

/**
 * 브라우저 환경 정보를 수집
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const cookieEnabled = navigator.cookieEnabled;
  const onLine = navigator.onLine;
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const deviceMemory = (navigator as any).deviceMemory;

  return {
    userAgent,
    platform,
    language,
    cookieEnabled,
    onLine,
    hardwareConcurrency,
    deviceMemory,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: /Edge/.test(userAgent)
  };
};

/**
 * MediaPipe 초기화를 위한 최적화된 설정을 반환
 */
export const getOptimizedMediaPipeConfig = (isEC2Environment: boolean = false) => {
  if (isEC2Environment) {
    // EC2 환경에서는 더 낮은 설정으로 시작
    return {
      modelComplexity: 0, // 가장 낮은 복잡도
      smoothLandmarks: false, // 스무딩 비활성화로 성능 향상
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.3, // 더 낮은 임계값
      minTrackingConfidence: 0.3,
      maxNumHands: 1, // 한 손만 감지
      maxNumFaces: 0 // 얼굴 감지 비활성화
    };
  }

  // 일반 환경에서는 기본 설정
  return {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    refineFaceLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    maxNumHands: 2,
    maxNumFaces: 1
  };
};

/**
 * MediaPipe 초기화 재시도 로직
 */
export const createRetryLogic = (
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 5000
) => {
  let attempts = 0;

  const retry = async <T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> => {
    while (attempts < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        const currentError = error instanceof Error ? error : new Error(String(error));
        
        if (attempts >= maxAttempts) {
          throw currentError;
        }

        const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
        
        if (onRetry) {
          onRetry(attempts, currentError);
        }

        console.log(`MediaPipe 초기화 재시도 ${attempts}/${maxAttempts} (${delay}ms 후)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('최대 재시도 횟수를 초과했습니다');
  };

  return { retry, attempts: () => attempts };
};

/**
 * MediaPipe CDN URL들을 반환
 */
export const getMediaPipeCDNUrls = () => [
  'https://cdn.jsdelivr.net/npm/@mediapipe/holistic',
  'https://unpkg.com/@mediapipe/holistic',
  'https://cdn.skypack.dev/@mediapipe/holistic',
  'https://esm.sh/@mediapipe/holistic'
];

/**
 * 환경 진단 정보를 수집
 */
export const diagnoseEnvironment = async () => {
  const webglInfo = checkWebGLSupport();
  const mediaPipeInfo = await checkMediaPipeModule();
  const browserInfo = getBrowserInfo();

  return {
    webgl: webglInfo,
    mediaPipe: mediaPipeInfo,
    browser: browserInfo,
    timestamp: new Date().toISOString(),
    recommendations: []
  };
}; 