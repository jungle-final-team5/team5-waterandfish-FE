import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Settings, Monitor, AlertCircle } from 'lucide-react';
import { Lesson } from '@/types/learning';

interface VideoInputProps { // 비디오 입력 컴포넌트 속성 인터페이스
  onStreamReady?: (stream: MediaStream) => void;
  onStreamError?: (error: string) => void;
  width?: number;
  height?: number;
  autoStart?: boolean;
  showControls?: boolean;
  className?: string;
  currentSign: Lesson;
  currentResult: string;
}

const VideoInput: React.FC<VideoInputProps> = ({ // 비디오 입력 컴포넌트 함수
  onStreamReady,
  onStreamError,
  width = 640,
  height = 480,
  autoStart = false,
  showControls = true,
  className = "",
  currentSign = null,
  currentResult = ""
}) => {
  const videoRef = useRef<HTMLVideoElement>(null); // 비디오 요소 참조
  const streamRef = useRef<MediaStream | null>(null); // 비디오 스트림 참조

  const [isStreaming, setIsStreaming] = useState(false); // 스트리밍 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]); // 비디오 장치 목록
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(''); // 선택된 장치 ID
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // 사용 가능한 카메라 장치 목록 가져오기
  const getVideoDevices = useCallback(async () => { // 비디오 장치 목록 가져
    try {
      const devices = await navigator.mediaDevices.enumerateDevices(); // 모든 장치 목록 가져오기
      const videoDevices = devices.filter(device => device.kind === 'videoinput'); // 비디오 장치 목록 필터링
      setDevices(videoDevices);

      if (videoDevices.length > 0 && !selectedDeviceId) { // 비디오 장치가 있고 선택된 장치가 없으면 첫 번째 장치 선택
        setSelectedDeviceId(videoDevices[0].deviceId); // 첫 번째 비디오 장치 선택
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err); // 장치 열거 실패 시 에러 로깅
      setError('카메라 장치를 가져올 수 없습니다.'); // 에러 메시지 설정
    }
  }, [selectedDeviceId]); // 의존성 배열에 selectedDeviceId 추가

  // 비디오 스트림 시작
  const startVideo = useCallback(async () => {
    try {
      setIsLoading(true); // 로딩 상태 설정
      setError(null); // 에러 메시지 초기화

      const constraints: MediaStreamConstraints = { // 비디오 스트림 제약 조건 설정
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined, // 선택된 장치 ID 설정
          width: { ideal: width }, // 목표 너비
          height: { ideal: height }, // 목표 높이
          frameRate: { ideal: 30 } // 목표 FPS
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints); // 비디오 스트림 가져오기

      if (videoRef.current) { // 비디오 요소가 존재하면
        videoRef.current.srcObject = stream; // 비디오 요소에 스트림 할당
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play(); // 비디오 요소 재생
        };
      }

      streamRef.current = stream; // 스트림 참조 업데이트
      setIsStreaming(true); // 스트리밍 상태 설정

      // 콜백 호출
      if (onStreamReady) {
        onStreamReady(stream); // 스트림 준비 콜백 호출
      }

    } catch (err) {
      console.error('Failed to start video:', err); // 비디오 시작 실패 시 에러 로깅
      const errorMessage = err instanceof Error ? err.message : '카메라 접근에 실패했습니다.'; // 에러 메시지 설정
      setError(errorMessage); // 에러 메시지 설정

      if (onStreamError) {
        onStreamError(errorMessage); // 스트림 오류 콜백 호출
      }
    } finally {
      setIsLoading(false); // 로딩 상태 초기화
    }
  }, [selectedDeviceId, width, height, onStreamReady, onStreamError]); // 의존성 배열에 selectedDeviceId, width, height, onStreamReady, onStreamError 추가

  // 비디오 스트림 중지
  const stopVideo = useCallback(() => {
    if (streamRef.current) { // 스트림 참조가 존재하면
      streamRef.current.getTracks().forEach(track => track.stop()); // 스트림 트랙 중지
      streamRef.current = null; // 스트림 참
    }

    if (videoRef.current) { // 비디오 요소가 존재하면
      videoRef.current.srcObject = null; // 비디오 요소에 스트림 해제
    }

    setIsStreaming(false); // 스트리밍 상태 초기화
  }, []); // 의존성 배열 비움


  // 초기 설정
  useEffect(() => {
    getVideoDevices(); // 비디오 장치 목록 가져오기

    if (autoStart) { // 자동 시작 설정이 활성화되어 있으면
      startVideo(); // 비디오 스트림 시작
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      stopVideo(); // 비디오 스트림 중지
    };
  }, []); // 빈 의존성 배열로 변경하여 무한 루프 방지

  return (
    <Card className={className}>
      <CardContent>
        {/* 비디오 영역 */}
        <div className="relative w-[640px] h-[480px] mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width={width}
            height={height}
            className={`w-full h-full bg-gray-900 rounded-lg object-cover ${isStreaming ? '' : 'opacity-50'
              }`}
            style={{ aspectRatio: `${width}/${height}`, transform: 'scaleX(-1)' }}
          />

          {/* 상태 오버레이 */}
          {!isStreaming && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg w-[640px] h-[480px]">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">카메라가 비활성화됨</p>
                <p className="text-sm opacity-75">시작 버튼을 클릭하여 카메라를 활성화하세요</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-lg font-medium">카메라 연결 중...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* 현재 수어 텍스트 표시 */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-blue-600 mb-2">따라해보세요</p>
          <h2 className="text-3xl font-bold text-blue-800">
            "{currentSign?.word}" | "{currentResult}"
          </h2>
        </div>
      </div>
    </Card>
  );
};

export default VideoInput;  