import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Monitor, 
  Settings, 
  Activity,
  Zap,
  AlertTriangle
} from 'lucide-react';
import VideoInput from '@/components/VideoInput';
import { SharedMemoryVideoControls } from '@/components/SharedMemoryVideoControls';
import { useSharedMemoryVideo } from '@/hooks/useSharedMemoryVideo';
import { SharedMemoryConfig, SharedMemoryResult } from '../services/SharedMemoryVideoClient';

const DEFAULT_CONFIG: SharedMemoryConfig = {
  serverId: 'shared-memory-server',
  sharedMemoryDir: '/tmp/video_streams',
  frameWidth: 640,
  frameHeight: 360,
  quality: 0.8,
  fps: 15
};

export const SharedMemoryVideoDemo: React.FC = () => {
  const [config, setConfig] = useState<SharedMemoryConfig>(DEFAULT_CONFIG);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [classificationHistory, setClassificationHistory] = useState<SharedMemoryResult[]>([]);

  // 공유 메모리 비디오 훅 사용
  const {
    isInitialized,
    isConnected,
    isStreaming,
    error,
    stats,
    lastResult,
    initialize,
    startStreaming,
    stopStreaming,
    updateConfig
  } = useSharedMemoryVideo({
    config,
    onResult: (result: SharedMemoryResult) => {
      setClassificationHistory(prev => [result, ...prev.slice(0, 9)]); // 최근 10개만 유지
    },
    onError: (error: string) => {
      console.error('Shared Memory Video Error:', error);
    },
    onFrameSent: (frame) => {
      console.log('Frame sent:', frame.width, 'x', frame.height, 'bytes:', frame.data.length);
    },
    onFrameError: (error) => {
      console.error('Frame error:', error);
    }
  });

  const handleInitialize = useCallback(async () => {
    try {
      await initialize();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }, [initialize]);

  const handleStreamReady = useCallback((stream: MediaStream) => {
    setCurrentStream(stream);
  }, []);

  const handleStreamError = useCallback((error: string) => {
    console.error('Stream error:', error);
  }, []);

  const handleStartStreaming = useCallback(async (stream: MediaStream) => {
    await startStreaming(stream);
  }, [startStreaming]);

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const handleUpdateConfig = useCallback((newConfig: Partial<SharedMemoryConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    updateConfig(newConfig);
  }, [config, updateConfig]);

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isStreaming) return 'text-green-500';
    if (isConnected) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (error) return '오류 발생';
    if (isStreaming) return '스트리밍 중';
    if (isConnected) return '연결됨';
    if (isInitialized) return '초기화됨';
    return '초기화 중';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">공유 메모리 비디오 스트리밍 데모</h1>
        <p className="text-gray-600">
          웹소켓 대신 공유 메모리를 사용한 고성능 비디오 스트리밍 시스템
        </p>
        <div className="flex items-center justify-center gap-4">
          <Activity className={`h-5 w-5 ${getStatusColor()}`} />
          <Badge variant={error ? "destructive" : isStreaming ? "default" : "secondary"}>
            {getStatusText()}
          </Badge>
          {!isInitialized && (
            <Button 
              onClick={handleInitialize}
              disabled={isInitialized}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <Tabs defaultValue="streaming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            스트리밍
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            모니터링
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            설정
          </TabsTrigger>
        </TabsList>

        {/* 스트리밍 탭 */}
        <TabsContent value="streaming" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 웹캠 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  웹캠 입력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VideoInput
                  onStreamReady={handleStreamReady}
                  onStreamError={handleStreamError}
                  autoStart={true}
                  showControls={true}
                />
              </CardContent>
            </Card>

            {/* 컨트롤 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  스트리밍 컨트롤
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SharedMemoryVideoControls
                  state={{
                    isInitialized,
                    isConnected,
                    isStreaming,
                    error,
                    stats,
                    lastResult
                  }}
                  config={config}
                  onStartStreaming={handleStartStreaming}
                  onStopStreaming={handleStopStreaming}
                  onUpdateConfig={handleUpdateConfig}
                  currentStream={currentStream}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 실시간 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  실시간 성능 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.framesSent}
                    </div>
                    <div className="text-sm text-gray-600">전송된 프레임</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.framesDropped}
                    </div>
                    <div className="text-sm text-gray-600">드롭된 프레임</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.averageFrameTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">평균 프레임 시간</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(stats.bytesPerSecond / 1024)}KB/s
                    </div>
                    <div className="text-sm text-gray-600">전송 속도</div>
                  </div>
                </div>

                {/* 성능 지표 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>연결 상태</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "연결됨" : "연결 안됨"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>스트리밍 상태</span>
                    <Badge variant={isStreaming ? "default" : "secondary"}>
                      {isStreaming ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>초기화 상태</span>
                    <Badge variant={isInitialized ? "default" : "secondary"}>
                      {isInitialized ? "완료" : "진행 중"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 분류 결과 히스토리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  분류 결과 히스토리
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classificationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {classificationHistory.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{result.prediction}</div>
                          <div className="text-sm text-gray-600">
                            {(result.confidence * 100).toFixed(1)}% 신뢰도
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>아직 분류 결과가 없습니다</p>
                    <p className="text-sm">스트리밍을 시작하면 결과가 여기에 표시됩니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 현재 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">현재 설정</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">해상도</div>
                    <div className="font-medium">{config.frameWidth} × {config.frameHeight}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">품질</div>
                    <div className="font-medium">{(config.quality * 100).toFixed(0)}%</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">프레임 레이트</div>
                    <div className="font-medium">{config.fps} FPS</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">서버 ID</div>
                    <div className="font-medium">{config.serverId}</div>
                  </div>
                </div>
              </div>

              {/* 성능 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">성능 정보</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">공유 메모리 시스템</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• 최저 레이턴시 (마이크로초 단위)</div>
                    <div>• 최고 처리량 (GB/s 단위)</div>
                    <div>• Zero-copy 프레임 전송</div>
                    <div>• 실시간 처리 최적화</div>
                  </div>
                </div>
              </div>

              {/* 기술 스택 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">기술 스택</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">백엔드</div>
                    <div className="font-medium">Python + mmap</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">프론트엔드</div>
                    <div className="font-medium">React + WASM</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">통신</div>
                    <div className="font-medium">공유 메모리</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">AI 모델</div>
                    <div className="font-medium">TensorFlow + MediaPipe</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 

export default SharedMemoryVideoDemo;