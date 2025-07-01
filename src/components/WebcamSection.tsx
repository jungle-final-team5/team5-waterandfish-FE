import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, RotateCcw } from 'lucide-react';

interface WebcamSectionProps {
  isQuizMode: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isTransmitting: boolean;
  state: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentResult: any;
  connectionError: string | null;
  isRecording: boolean;
  feedback: 'correct' | 'incorrect' | null;
  handleStartRecording: () => void;
  handleNextSign: () => void;
  handleRetry: () => void;
}

const WebcamSection = ({
  isQuizMode,
  isConnected,
  isConnecting,
  isTransmitting,
  state,
  videoRef,
  canvasRef,
  currentResult,
  connectionError,
  isRecording,
  feedback,
  handleStartRecording,
  handleNextSign,
  handleRetry
}: WebcamSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">따라하기</h3>

      {/* 연결 상태 표시 */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? '연결됨' : isConnecting ? '연결 중...' : '연결 안됨'}
        </span>
        {isTransmitting && (
          <span className="text-sm text-blue-600">전송 중...</span>
        )}
      </div>

      {/* 비디오 스트림 */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full border rounded-lg bg-gray-100"
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        {!state.isStreaming && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">카메라 초기화 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 분류 결과 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {currentResult ? (
          <>
            <div className="text-lg font-bold text-blue-600">
              {currentResult.prediction}
            </div>
            <div className="text-sm text-gray-600">
              신뢰도: {(currentResult.confidence * 100).toFixed(1)}%
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 text-center">
            분류 결과를 기다리는 중...
          </div>
        )}
      </div>

      {/* 문제 발생 시 새로고침 안내 */}
      {!isConnected && !connectionError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">연결 중...</span>
          </div>
          <p className="text-sm text-yellow-700">
            서버에 연결하는 중입니다. 잠시만 기다려주세요.
          </p>
        </div>
      )}

      {/* 수동 녹화 버튼 (학습 모드용) */}
      {!isQuizMode && isConnected && state.isStreaming && (
        <div className="flex justify-center space-x-4">
          {!isRecording && !feedback && (
            <>
              <Button 
                onClick={handleStartRecording}
                className="bg-green-600 hover:bg-green-700"
                disabled={!isTransmitting}
              >
                <Camera className="h-4 w-4 mr-2" />
                수어 시작하기
              </Button>
              <Button 
                onClick={handleNextSign}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                건너뛰기
              </Button>
            </>
          )}
          
          {isRecording && (
            <>
              <Button disabled className="bg-red-600">
                <div className="animate-pulse flex items-center">
                  <div className="w-3 h-3 bg-white rounded-full mr-2" />
                  인식 중...
                </div>
              </Button>
              <Button 
                onClick={handleNextSign}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                건너뛰기
              </Button>
            </>
          )}
          
          {feedback && (
            <div className="flex space-x-2">
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
              <Button onClick={handleNextSign} className="bg-blue-600 hover:bg-blue-700">
                {feedback === 'correct' ? '다음 수어' : '건너뛰기'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebcamSection; 