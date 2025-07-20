import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaPipeHolistic } from "./useMediaPipeHolistic";
import { LandmarkList } from "@mediapipe/holistic";
import { useClassifierClient } from "./useClassifierClient";
import { disconnectWebSockets } from "./useWebsocket";

// 상수 정의
const BUFFER_DURATION = 2000; // 2초

export const useLandmarkBuffer = () => {
  // 상태 변수들
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [isBufferingPaused, setIsBufferingPaused] = useState(false);
  const [landmarksBuffer, setLandmarksBuffer] = useState<LandmarkList[]>([]);
  const [transmissionCount, setTransmissionCount] = useState(0);
  const [currentConnectionId, setCurrentConnectionId] = useState<string>("");
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [displayConfidence, setDisplayConfidence] = useState<string>("");

  // refs
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket 메시지 전송 함수
  const sendMessage = useCallback((message: string, connectionId: string) => {
    // WebSocket 연결이 있다면 메시지 전송
    if (connectionId) {
      // 실제 WebSocket 전송 로직은 여기에 구현
      console.log(`📤 메시지 전송: ${message}`);
    }
  }, []);

  // 재생 속도 토글 함수
  const togglePlaybackSpeed = useCallback(() => {
    setIsSlowMotion(prev => !prev);
  }, []);

  // 비디오 재생 속도 변경
  useEffect(() => {
    const videoElement = document.querySelector('video[src]') as HTMLVideoElement;
    if (videoElement) {
      videoElement.playbackRate = isSlowMotion ? 0.5 : 1.0;
    }
  }, [isSlowMotion, videoSrc]);
  
  // 랜드마크 감지 시 호출되는 콜백 (useCallback으로 먼저 정의)
  const handleLandmarksDetected = useCallback((landmarks: any) => {
    // 녹화 중일 때만 버퍼에 추가
    if (isRecording && isConnected) {
      setLandmarksBuffer(prev => {
        const newBuffer = [...prev, landmarks];
        return newBuffer;
      });
    } else {
      console.log(`⚠️ 랜드마크 버퍼링 건너뜀 - 녹화: ${isRecording}, 연결: ${isConnected}`);
    }
  }, [isRecording, isConnected]);

  // 랜드마크 버퍼링 및 전송 처리
  // MediaPipe holistic hook 사용
  const {
    videoRef,
    canvasRef,
    isInitialized,
    stopCamera,
    inspect_sequence,
    initializeSession
  } = useMediaPipeHolistic({
    onLandmarks: handleLandmarksDetected,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
    enableLogging: false // MediaPipe 내부 로그 숨김
  });

  useEffect(() => {
    // 녹화 중이고 연결된 상태일 때만 버퍼링 시작
    if (isRecording && isConnected) {
      // 기존 타이머 정리
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
      }

      // 2초마다 버퍼 전송
      bufferIntervalRef.current = setInterval(() => {
        setLandmarksBuffer(prevBuffer => {
          if (prevBuffer.length > 0) {
            // 버퍼의 모든 랜드마크를 시퀀스로 전송
            const landmarksSequence = {
              type: 'landmarks_sequence',
              data: {
                sequence: prevBuffer,
                timestamp: Date.now(),
                frame_count: prevBuffer.length
              }
            };
            const is_fast = inspect_sequence(landmarksSequence);
            if (!is_fast) {
              // console.log('✅ 동작 속도 정상');
              if (isBufferingPaused) {
                setIsBufferingPaused(false);
              }
              sendMessage(JSON.stringify(landmarksSequence), currentConnectionId);
            }
            else {
              console.log('❌ 동작 속도 빠름. 시퀸스 전송 건너뜀');
              setDisplayConfidence("천천히 동작해주세요");
              setIsBufferingPaused(true);
              setLandmarksBuffer([]);
            }
            setTransmissionCount(prev => prev + prevBuffer.length);
            // console.log(`📤 랜드마크 시퀀스 전송됨 (${prevBuffer.length}개 프레임)`);

            // 버퍼 비우기
            return [];
          }
          return prevBuffer;
        });
      }, BUFFER_DURATION);

      // console.log('🔄 랜드마크 버퍼링 시작 (1초 간격)');
    } else {
      // 녹화 중이 아니거나 연결이 끊어진 경우 타이머 정리
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
        bufferIntervalRef.current = null;
      }

      // 버퍼 비우기
      setLandmarksBuffer([]);
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
        bufferIntervalRef.current = null;
      }
    };
  }, [isRecording, isConnected, currentConnectionId, sendMessage, isBufferingPaused, currentResult, setDisplayConfidence, setIsBufferingPaused, inspect_sequence]);

  useEffect(() => {
    setIsRecording(true);
    return () => {
      disconnectWebSockets();
      // 버퍼링 타이머 정리
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
        bufferIntervalRef.current = null;
      }
    }
  }, []);

  // 훅에서 반환할 값들
  return {
    // 상태
    isRecording,
    setIsRecording,
    isConnected,
    setIsConnected,
    isSlowMotion,
    isBufferingPaused,
    landmarksBuffer,
    transmissionCount,
    currentConnectionId,
    setCurrentConnectionId,
    videoSrc,
    setVideoSrc,
    currentResult,
    setCurrentResult,
    displayConfidence,
    setDisplayConfidence,
    
    // 함수들
    togglePlaybackSpeed,
    sendMessage,
    
    // MediaPipe 관련
    videoRef,
    canvasRef,
    isInitialized,
    stopCamera,
    inspect_sequence,
    initializeSession
  };
};
