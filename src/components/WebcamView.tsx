import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { Hands, NormalizedLandmarkList } from '@mediapipe/hands';
import { Camera as MediapipeCamera } from '@mediapipe/camera_utils';
import { drawLandmarks, drawOverlayMessage } from '../components/draw/draw'; // 경로 조정 필요

interface WebcamViewProps {
  isRecording?: boolean;
  onLandmarks?: (landmarks: NormalizedLandmarkList) => void;
}

const WebcamView = ({ isRecording = false }: WebcamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 웹캠 권한 및 스트림 세팅
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setError(null);
        }
      } catch (err) {
        setError('웹캠 접근 권한이 필요합니다.');
        console.error('웹캠 접근 오류:', err);
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Mediapipe Hands와 캔버스 랜더링 설정
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !hasPermission) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) return;

    // 캔버스 크기 video 크기와 동기화
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const handvc = Math.sqrt(
          (landmarks[0].y - landmarks[9].y) ** 2 +
          (landmarks[0].x - landmarks[9].x) ** 2
        );

        if (handvc > 0.13 && handvc <= 0.5) {
          drawLandmarks(canvasCtx, landmarks, canvasElement);
          // 필요시 제스처 인식 함수 호출 가능
        } else {
          const msg = handvc <= 0.13
            ? '손을 앞으로 옮겨주세요'
            : '손을 뒤로 빼주세요';
          drawOverlayMessage(canvasCtx, canvasElement, msg);
        }
      } else {
        // drawOverlayMessage(canvasCtx, canvasElement, '손을 인식하지 못했습니다.');
      }
    });

    const camera = new MediapipeCamera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    };
  }, [hasPermission]);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        setError(null);
      }
    } catch (err) {
      setError('웹캠 접근 권한을 허용해주세요.');
    }
  };

  return (
    <Card className="relative overflow-hidden h-full">
      <div className="aspect-video bg-gray-900 relative h-full min-h-[400px]">
        {/* 비디오 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {/* 권한 없을 때 오버레이 */}
        {!hasPermission && (
          <div className="flex flex-col items-center justify-center h-full text-white absolute inset-0 bg-gray-900 bg-opacity-75">
            {error ? (
              <>
                <CameraOff className="h-20 w-20 mb-6 text-gray-400" />
                <p className="text-gray-400 mb-6 text-center text-lg">{error}</p>
                <Button
                  onClick={requestPermission}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-gray-900 text-lg px-6 py-3"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  웹캠 권한 허용
                </Button>
              </>
            ) : (
              <>
                <Camera className="h-20 w-20 mb-6 text-gray-400" />
                <p className="text-gray-400 text-lg">웹캠을 연결하는 중...</p>
              </>
            )}
          </div>
        )}

        {/* 녹화 중 표시 */}
        {isRecording && hasPermission && (
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse">
            <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full text-base font-medium">
              REC
            </div>
          </div>
        )}

        {/* 손 가이드 오버레이 */}
        {hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-3 border-dashed border-white/50 rounded-lg w-80 h-60 flex items-center justify-center">
              <span className="text-white/70 text-lg">손을 이 영역에 위치시켜주세요</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WebcamView;


