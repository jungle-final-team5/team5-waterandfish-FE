import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Upload } from 'lucide-react';
import { StreamingConfig, STREAMING_PRESETS } from '@/types/streaming';

interface StreamingControlsProps {
  // isStreaming: boolean;
  // streamingStatus: string;
  // streamingConfig: StreamingConfig;
  // currentStream: MediaStream | null;
  // connectionStatus: string;
  // onStartStreaming: () => void;
  // onStopStreaming: () => void;
  // onConfigChange: (config: StreamingConfig) => void;
  transitionSign: () => void;
}

const StreamingControls: React.FC<StreamingControlsProps> = ({
  /* isStreaming,
  streamingStatus,
  streamingConfig,
  currentStream,
  connectionStatus,
  onStartStreaming,
  onStopStreaming,
  onConfigChange, */
  transitionSign
}) => {

  return (
    <div className="space-y-3">
      {/* 스트리밍 버튼 */}
      <div className="flex items-center space-x-4">
        <Button onClick={transitionSign}>다음으로 넘어가기</Button>
      </div>
    </div>
  );
};

export default StreamingControls; 