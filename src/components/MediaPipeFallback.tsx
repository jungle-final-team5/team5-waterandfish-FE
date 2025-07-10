import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Video, VideoOff } from 'lucide-react';

interface MediaPipeFallbackProps {
  error: string | null;
  onRetry: () => Promise<boolean>;
  onManualMode?: () => void;
  isRetrying?: boolean;
}

const MediaPipeFallback: React.FC<MediaPipeFallbackProps> = ({
  error,
  onRetry,
  onManualMode,
  isRetrying = false
}) => {
  const getErrorDetails = (error: string) => {
    if (error.includes('WebGL')) {
      return {
        title: 'WebGL 지원 문제',
        description: '브라우저가 WebGL을 지원하지 않거나 GPU 가속이 비활성화되어 있습니다.',
        solutions: [
          '브라우저를 최신 버전으로 업데이트하세요',
          'GPU 가속을 활성화하세요',
          '다른 브라우저를 시도해보세요 (Chrome, Firefox, Edge)'
        ]
      };
    } else if (error.includes('MediaPipe')) {
      return {
        title: 'MediaPipe 로드 실패',
        description: 'MediaPipe 라이브러리를 로드하는데 실패했습니다.',
        solutions: [
          '인터넷 연결을 확인하세요',
          '페이지를 새로고침하세요',
          '브라우저 캐시를 지우고 다시 시도하세요'
        ]
      };
    } else {
      return {
        title: '초기화 오류',
        description: 'MediaPipe 초기화 중 오류가 발생했습니다.',
        solutions: [
          '페이지를 새로고침하세요',
          '브라우저를 재시작하세요',
          '다른 브라우저를 시도해보세요'
        ]
      };
    }
  };

  const errorDetails = error ? getErrorDetails(error) : null;

  return (
    <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          MediaPipe 초기화 실패
        </h3>
        
        <p className="text-gray-600 mb-6">
          수어 인식을 위한 MediaPipe 라이브러리를 초기화할 수 없습니다.
        </p>

        {errorDetails && (
          <div className="mb-6 text-left">
            <h4 className="font-medium text-gray-800 mb-2">
              {errorDetails.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {errorDetails.description}
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {errorDetails.solutions.map((solution, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {solution}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
            variant="default"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                재시도 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </>
            )}
          </Button>

          {onManualMode && (
            <Button
              onClick={onManualMode}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Video className="h-4 w-4" />
              수동 모드
            </Button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>EC2 환경에서는 GPU 가속이 제한적일 수 있습니다.</p>
          <p>문제가 지속되면 관리자에게 문의하세요.</p>
        </div>
      </div>
    </div>
  );
};

export default MediaPipeFallback; 