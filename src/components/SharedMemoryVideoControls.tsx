import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Settings, 
  Wifi, 
  WifiOff, 
  Video, 
  VideoOff,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';
import { SharedMemoryConfig, SharedMemoryResult } from '../services/SharedMemoryVideoClient';
import { SharedMemoryVideoState } from '@/hooks/useSharedMemoryVideo';

interface SharedMemoryVideoControlsProps {
  state: SharedMemoryVideoState;
  config: SharedMemoryConfig;
  onStartStreaming: (stream: MediaStream) => Promise<void>;
  onStopStreaming: () => void;
  onUpdateConfig: (config: Partial<SharedMemoryConfig>) => void;
  currentStream: MediaStream | null;
}

export const SharedMemoryVideoControls: React.FC<SharedMemoryVideoControlsProps> = ({
  state,
  config,
  onStartStreaming,
  onStopStreaming,
  onUpdateConfig,
  currentStream
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleStartStreaming = async () => {
    if (currentStream) {
      await onStartStreaming(currentStream);
    }
  };

  const handleStopStreaming = () => {
    onStopStreaming();
  };

  const handleQualityChange = (value: number[]) => {
    onUpdateConfig({ quality: value[0] / 100 });
  };

  const handleFpsChange = (value: number[]) => {
    onUpdateConfig({ fps: value[0] });
  };

  const handleFrameSizeChange = (value: number[]) => {
    const size = value[0];
    onUpdateConfig({ 
      frameWidth: size * 16, 
      frameHeight: size * 9 
    });
  };

  const getConnectionStatusIcon = () => {
    if (state.isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getStreamingStatusIcon = () => {
    if (state.isStreaming) {
      return <Video className="h-4 w-4 text-green-500" />;
    }
    return <VideoOff className="h-4 w-4 text-gray-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatFps = (fps: number) => {
    return `${fps.toFixed(1)} FPS`;
  };

  return (
    <div className="space-y-4">
      {/* 상태 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            공유 메모리 스트리밍 상태
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 연결 상태 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-sm font-medium">연결 상태</span>
            </div>
            <Badge variant={state.isConnected ? "default" : "destructive"}>
              {state.isConnected ? "연결됨" : "연결 안됨"}
            </Badge>
          </div>

          {/* 스트리밍 상태 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStreamingStatusIcon()}
              <span className="text-sm font-medium">스트리밍 상태</span>
            </div>
            <Badge variant={state.isStreaming ? "default" : "secondary"}>
              {state.isStreaming ? "스트리밍 중" : "대기 중"}
            </Badge>
          </div>

          {/* 오류 상태 */}
          {state.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{state.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            성능 통계
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-600">전송된 프레임</span>
              <p className="text-lg font-semibold">{state.stats.framesSent}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-600">드롭된 프레임</span>
              <p className="text-lg font-semibold text-red-600">{state.stats.framesDropped}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-600">평균 프레임 시간</span>
              <p className="text-lg font-semibold">{state.stats.averageFrameTime.toFixed(1)}ms</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-600">전송 속도</span>
              <p className="text-lg font-semibold">{formatBytes(state.stats.bytesPerSecond)}/s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 결과 */}
      {state.lastResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">최근 분류 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">예측</span>
                <Badge variant="outline">{state.lastResult.prediction}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">신뢰도</span>
                <span className="text-sm">{(state.lastResult.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 컨트롤 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleStartStreaming}
              disabled={!state.isConnected || state.isStreaming || !currentStream}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              스트리밍 시작
            </Button>
            
            <Button
              onClick={handleStopStreaming}
              disabled={!state.isStreaming}
              variant="outline"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              스트리밍 중지
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="icon"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 설정 패널 */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">스트리밍 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 품질 설정 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">품질</Label>
                <span className="text-sm text-gray-600">
                  {(config.quality * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                id="quality"
                min={10}
                max={100}
                step={5}
                value={[config.quality * 100]}
                onValueChange={handleQualityChange}
                className="w-full"
              />
            </div>

            {/* FPS 설정 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="fps">프레임 레이트</Label>
                <span className="text-sm text-gray-600">
                  {formatFps(config.fps)}
                </span>
              </div>
              <Slider
                id="fps"
                min={5}
                max={30}
                step={1}
                value={[config.fps]}
                onValueChange={handleFpsChange}
                className="w-full"
              />
            </div>

            {/* 프레임 크기 설정 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="frame-size">프레임 크기</Label>
                <span className="text-sm text-gray-600">
                  {config.frameWidth}×{config.frameHeight}
                </span>
              </div>
              <Slider
                id="frame-size"
                min={20}
                max={60}
                step={5}
                value={[config.frameWidth / 16]}
                onValueChange={handleFrameSizeChange}
                className="w-full"
              />
            </div>

            {/* 현재 설정 요약 */}
            <div className="p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium mb-2">현재 설정</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>해상도: {config.frameWidth}×{config.frameHeight}</div>
                <div>품질: {(config.quality * 100).toFixed(0)}%</div>
                <div>FPS: {config.fps}</div>
                <div>예상 대역폭: {formatBytes(config.frameWidth * config.frameHeight * 3 * config.fps * config.quality)}/s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 