import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Hand, AlertCircle } from 'lucide-react';

interface HandDetectionIndicatorProps {
  isHandDetected: boolean;
  isConnected: boolean;
  isStreaming: boolean;
}

const HandDetectionIndicator: React.FC<HandDetectionIndicatorProps> = ({
  isHandDetected,
  isConnected,
  isStreaming
}) => {
  const getStatus = () => {
    if (!isConnected) {
      return {
        icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
        text: '서버 연결 중...',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
    
    if (!isStreaming) {
      return {
        icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
        text: '카메라 준비 중...',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
    
    if (isHandDetected) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        text: '손 감지됨',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: <XCircle className="w-6 h-6 text-red-500" />,
        text: '손 감지되지 않음',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  const status = getStatus();

  return (
    <Card className={`fixed top-4 right-4 z-50 ${status.bgColor} ${status.borderColor} border-2 transition-all duration-300`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <Hand className="w-5 h-5 text-gray-600" />
          {status.icon}
          <span className="text-sm font-medium text-gray-700">
            {status.text}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default HandDetectionIndicator; 