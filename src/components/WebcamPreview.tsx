import React, { useEffect, useRef, useState } from 'react';

interface WebcamPreviewProps {
  width?: number;
  height?: number;
  className?: string;
}

const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  width = 640,
  height = 480,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    setIsLoading(true);
    setError(null);
    
    navigator.mediaDevices.getUserMedia({ video: { width, height } })
      .then((mediaStream) => {
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      })
      .catch((err) => {
        setError('카메라 접근에 실패했습니다. 권한을 허용해주세요.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [width, height]);

  return (
    <div className={`relative w-[${width}px] h-[${height}px] ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={width}
        height={height}
        className={`w-full h-full bg-gray-900 rounded-lg object-cover ${error ? 'opacity-50' : ''}`}
        style={{ aspectRatio: `${width}/${height}`, transform: 'scaleX(-1)' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-lg font-medium">카메라 연결 중...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-center text-white">
            <p className="text-lg font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamPreview; 