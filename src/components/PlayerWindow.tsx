import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Settings, Monitor, AlertCircle } from 'lucide-react';
import { Lesson } from '@/types/learning';
import LoadingFish from "./LoadingFish";

interface PlayerWindowProps { // 비디오 입력 컴포넌트 속성 인터페이스
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

const PlayerWindow: React.FC<PlayerWindowProps> = ({ // 비디오 입력 컴포넌트 함수
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
  // 팁 내용 배열 추가
  const tips = [
    "좌측의 예시를 전부 따라한 뒤, 손을 카메라가 못보도록 가려주면 채점 판정에 도움이 돼요.",
    "영상이 재생되고 있는 부분을 눌러서 재생 속도를 전환 할 수 있어요.",
    "손 모양이 정확하게 보이도록 카메라 앞에서 적절한 거리를 유지해주세요.",
    "아래 단어를 옆으로 넘겨서 지금 진행하고 있는 단어를 넘어갈 수 있어요.",
    "주변에 사람이 없는 곳에서 진행하면 보다 확실한 판정을 기대 할 수 있어요."
  ];

  // 팁 인덱스와 타이머 상태 추가
  const [tipIndex, setTipIndex] = useState(0);
  const [tipDuration, setTipDuration] = useState(7); // 기본 5초
  const tipTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 팁 순환 함수
  const rotateTips = useCallback(() => {
    setTipIndex(prev => (prev + 1) % tips.length);
  }, []);

  // 팁 타이머 설정
  useEffect(() => {
    // 이전 타이머 정리
    if (tipTimerRef.current) {
      clearInterval(tipTimerRef.current);
    }

    // 새 타이머 설정
    tipTimerRef.current = setInterval(rotateTips, tipDuration * 1000);

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (tipTimerRef.current) {
        clearInterval(tipTimerRef.current);
        tipTimerRef.current = null;
      }
    };
  }, [tipDuration, rotateTips]);

  // 팁 지속 시간 변경 함수 (필요시 외부에서 호출)
  const changeTipDuration = (seconds: number) => {
    setTipDuration(seconds);
  };

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


      <CardContent className="p-0 h-full w-full">
        <div className="grid grid-rows-[1fr_auto_auto] gap-4 h-full w-full p-4">
          {/* 비디오 영역 */}
          <div className="relative w-full h-full overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={width}
              height={height}
              className={`w-full h-full bg-gray-900 rounded-lg object-contain ${isStreaming ? '' : 'opacity-50'
                }`}
              style={{ aspectRatio: `${width}/${height}`, transform: 'scaleX(-1)' }}
            />

            {/* 상태 오버레이 */}
            {!isStreaming && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">카메라가 비활성화됨</p>
                  <p className="text-sm opacity-75">시작 버튼을 클릭하여 카메라를 활성화하세요</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                <LoadingFish />
              </div>
            )}
          </div>

          {/* 도움말 영역 */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 shadow-sm">
            <div className="flex items-center h-full">
              <span className="text-yellow-600 font-semibold mr-2">[도움말]</span>
              <div className="flex-1">
                <p className="text-xl text-gray-700 overflow-hidden overflow-ellipsis line-clamp-3">
                  {tips[tipIndex]}
                </p>
              </div>
            </div>
          </div>

          {/* 상태 바 */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 shadow-sm relative overflow-hidden">
            {/* 차오르는 배경 */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300 ease-out"
              style={{ width: `${parseFloat(currentResult) || 0}%` }}
            ></div>
            <div className="relative z-10 text-left">
              <h2 className="text-4xl font-italic text-blue-900 text-center">
                {currentResult}
              </h2>
            </div>
          </div>
        </div>
      </CardContent>
  );
};

export default PlayerWindow;  