import { useState, useRef, useCallback, useEffect } from 'react';
import SharedMemoryVideoClient, { 
  SharedMemoryConfig, 
  SharedMemoryFrame, 
  SharedMemoryResult 
} from '../services/SharedMemoryVideoClient';

export interface SharedMemoryVideoState {
  isInitialized: boolean;
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  stats: {
    framesSent: number;
    framesDropped: number;
    lastFrameTime: number;
    averageFrameTime: number;
    bytesPerSecond: number;
    totalBytesSent: number;
  };
  lastResult: SharedMemoryResult | null;
}

export interface UseSharedMemoryVideoProps {
  config: SharedMemoryConfig;
  onResult?: (result: SharedMemoryResult) => void;
  onError?: (error: string) => void;
  onFrameSent?: (frame: SharedMemoryFrame) => void;
  onFrameError?: (error: string) => void;
}

export const useSharedMemoryVideo = ({
  config,
  onResult,
  onError,
  onFrameSent,
  onFrameError
}: UseSharedMemoryVideoProps) => {
  const [state, setState] = useState<SharedMemoryVideoState>({
    isInitialized: false,
    isConnected: false,
    isStreaming: false,
    error: null,
    stats: {
      framesSent: 0,
      framesDropped: 0,
      lastFrameTime: 0,
      averageFrameTime: 0,
      bytesPerSecond: 0,
      totalBytesSent: 0
    },
    lastResult: null
  });

  const clientRef = useRef<SharedMemoryVideoClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statsRef = useRef<{
    frameTimes: number[];
    lastFrameSentTime: number;
  }>({
    frameTimes: [],
    lastFrameSentTime: 0
  });

  // 클라이언트 초기화
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // 기존 클라이언트 정리
      if (clientRef.current) {
        await clientRef.current.disconnect();
      }

      // 새 클라이언트 생성
      const client = new SharedMemoryVideoClient(config);
      clientRef.current = client;

      // 이벤트 리스너 설정
      client.on('connected', () => {
        setState(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isConnected: true 
        }));
      });

      client.on('disconnected', () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isStreaming: false 
        }));
      });

      client.on('streaming-started', () => {
        setState(prev => ({ ...prev, isStreaming: true }));
      });

      client.on('streaming-stopped', () => {
        setState(prev => ({ ...prev, isStreaming: false }));
      });

      client.on('classification-result', (result: SharedMemoryResult) => {
        setState(prev => ({ 
          ...prev, 
          lastResult: result 
        }));
        onResult?.(result);
      });

      client.on('frame-sent', (frame: SharedMemoryFrame) => {
        const now = Date.now();
        const frameTime = now - statsRef.current.lastFrameSentTime;
        
        // 통계 업데이트
        statsRef.current.frameTimes.push(frameTime);
        if (statsRef.current.frameTimes.length > 30) {
          statsRef.current.frameTimes.shift();
        }
        
        const avgFrameTime = statsRef.current.frameTimes.reduce((a, b) => a + b, 0) / statsRef.current.frameTimes.length;
        
        setState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            framesSent: prev.stats.framesSent + 1,
            lastFrameTime: frameTime,
            averageFrameTime: avgFrameTime,
            totalBytesSent: prev.stats.totalBytesSent + frame.data.length,
            bytesPerSecond: Math.round(frame.data.length / (frameTime / 1000))
          }
        }));
        
        statsRef.current.lastFrameSentTime = now;
        onFrameSent?.(frame);
      });

      client.on('frame-error', (error: string) => {
        setState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            framesDropped: prev.stats.framesDropped + 1
          }
        }));
        onFrameError?.(error);
      });

      client.on('error', (error: any) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      });

      // 클라이언트 초기화
      const success = await client.initialize();
      if (!success) {
        throw new Error('클라이언트 초기화 실패');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [config, onResult, onError, onFrameSent, onFrameError]);

  // 스트리밍 시작
  const startStreaming = useCallback(async (stream: MediaStream) => {
    try {
      if (!clientRef.current) {
        throw new Error('클라이언트가 초기화되지 않았습니다');
      }

      if (!clientRef.current.getConnectionStatus()) {
        throw new Error('서버에 연결되지 않았습니다');
      }

      streamRef.current = stream;
      const success = await clientRef.current.startStreaming(stream);
      
      if (!success) {
        throw new Error('스트리밍 시작 실패');
      }

      // 통계 초기화
      statsRef.current = {
        frameTimes: [],
        lastFrameSentTime: Date.now()
      };

      setState(prev => ({
        ...prev,
        stats: {
          framesSent: 0,
          framesDropped: 0,
          lastFrameTime: 0,
          averageFrameTime: 0,
          bytesPerSecond: 0,
          totalBytesSent: 0
        }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  // 스트리밍 중지
  const stopStreaming = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopStreaming();
    }
    streamRef.current = null;
  }, []);

  // 연결 해제
  const disconnect = useCallback(async () => {
    try {
      stopStreaming();
      
      if (clientRef.current) {
        await clientRef.current.disconnect();
        clientRef.current = null;
      }
      
      streamRef.current = null;
      
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isConnected: false,
        isStreaming: false,
        error: null
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [stopStreaming]);

  // 설정 업데이트
  const updateConfig = useCallback((newConfig: Partial<SharedMemoryConfig>) => {
    if (clientRef.current) {
      clientRef.current.updateConfig(newConfig);
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // 상태
    ...state,
    
    // 함수
    initialize,
    startStreaming,
    stopStreaming,
    disconnect,
    updateConfig,
    
    // 클라이언트 참조
    client: clientRef.current
  };
}; 