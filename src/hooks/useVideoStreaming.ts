import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  StreamingConfig, 
  StreamingStats, 
  StreamingStatus, 
  DEFAULT_STREAMING_CONFIG 
} from '@/types/streaming';
import { getConnectionByUrl } from '@/hooks/useWebsocket';

interface UseVideoStreamingProps {
  connectionStatus: string;
  broadcastMessage: (data: ArrayBuffer) => boolean;
  sendMessage: (data: ArrayBuffer, connectionId?: string) => boolean;  
  onStreamReady?: (stream: MediaStream) => void;
  onStreamError?: (error: string) => void;
  connectionId: string;
}

export const useVideoStreaming = ({
  connectionStatus,
  broadcastMessage,
  sendMessage,
  onStreamReady,
  onStreamError,
  connectionId
}: UseVideoStreamingProps) => {
  // 스트리밍 상태
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [streamInfo, setStreamInfo] = useState<string>('');
  
  // 스트리밍 설정
  const [streamingConfig, setStreamingConfig] = useState<StreamingConfig>(DEFAULT_STREAMING_CONFIG);
  
  // 스트리밍 통계
  const [streamingStats, setStreamingStats] = useState<StreamingStats>({
    actualFPS: 0,
    frameDropCount: 0,
    bytesPerSecond: 0,
    totalBytesSent: 0,
    framesSent: 0,
  });
  
  // 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const lastFrameTimeRef = useRef<number>(0);

  // 스트리밍 시작
  const startStreaming = useCallback(() => {
    if (!currentStream || connectionStatus !== 'connected') {
      setStreamingStatus('스트리밍 시작 불가 - 비디오 또는 웹소켓 연결 확인 필요');
      return;
    }

    if (!videoRef.current) {
      setStreamingStatus('비디오 엘리먼트가 준비되지 않았습니다');
      return;
    }

    isStreamingRef.current = true;
    setIsStreaming(true);
    setStreamingStatus('스트리밍 시작됨');
    
    // 통계 초기화
    setStreamingStats({
      actualFPS: 0,
      frameDropCount: 0,
      bytesPerSecond: 0,
      totalBytesSent: 0,
      framesSent: 0,
    });
    
    lastFrameTimeRef.current = 0;
  }, [currentStream, connectionStatus]);

  // 스트리밍 중지
  const stopStreaming = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    isStreamingRef.current = false;
    setIsStreaming(false);
    setStreamingStatus('스트리밍 중지됨');
    
    setStreamingStats(prev => ({
      ...prev,
      actualFPS: 0,
      bytesPerSecond: 0
    }));
  }, []);

  // 스트림 설정
  const handleStreamReady = useCallback((stream: MediaStream) => {
    setCurrentStream(stream);
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      setStreamInfo(`${settings.width}×${settings.height} @ ${settings.frameRate}fps`);
    }
    onStreamReady?.(stream);
  }, [onStreamReady]);

  const handleStreamError = useCallback((error: string) => {
    console.error('Video stream error:', error);
    setCurrentStream(null);
    setStreamInfo('');
    
    if (isStreamingRef.current) {
      stopStreaming();
    }
    
    onStreamError?.(error);
  }, [stopStreaming, onStreamError]);

  // 비디오 스트림 연결
  useEffect(() => {
    if (currentStream && videoRef.current) {
      videoRef.current.srcObject = currentStream;
      
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      };
    }
  }, [currentStream]);

  // WebSocket 연결 상태 변경 시 스트리밍 자동 중지
  useEffect(() => {
    if (isStreamingRef.current && connectionStatus === 'error') {
      stopStreaming();
      setStreamingStatus('WebSocket 연결 에러로 스트리밍 중지됨');
    }
  }, [connectionStatus, stopStreaming]);

  // 정리
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // 상태
    isStreaming,
    streamingStatus,
    currentStream,
    streamInfo,
    streamingConfig,
    streamingStats,
    
    // 참조
    canvasRef,
    videoRef,
    
    // 함수
    startStreaming,
    stopStreaming,
    setStreamingConfig,
    handleStreamReady,
    handleStreamError,
  };
}; 