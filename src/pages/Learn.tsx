import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle,
  BookOpen
} from 'lucide-react';

import ExampleAnim from '@/components/ExampleAnim';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import API from "@/components/AxiosInstance";
import { useLearningData } from '@/hooks/useLearningData';
import PlayerWindow from '@/components/PlayerWindow';
import { useMediaPipeHolistic } from '@/hooks/useMediaPipeHolistic';
import FeedbackModalForLearn from '@/components/FeedbackModalForLearn';
import LearningDisplay from '@/components/LearningDisplay';
import useWebsocket, { getConnectionByUrl, disconnectWebSockets } from '@/hooks/useWebsocket';
import { ClassificationResult, signClassifierClient, LandmarksData } from '@/services/SignClassifierClient';
import StreamingControls from '@/components/StreamingControls';
import SessionHeader from '@/components/SessionHeader';
import { update } from 'lodash';
import { useClassifierClient } from '@/hooks/useClassifierClient';
import { useAnimation } from '@/hooks/useAnimation';
import { Lesson } from '@/types/learning';
import { ConsoleSqlOutlined } from '@ant-design/icons';

const CORRECT_TARGET = 3;

const Learn = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(true); // 진입 시 바로 분류 시작
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const exampleVideoRef = useRef<HTMLVideoElement>(null);
  const [transmissionCount, setTransmissionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWaitingForReset, setIsWaitingForReset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lessonId } = useParams();
  // 애니메이션 훅 사용
  const { videoSrc, isSlowMotion, togglePlaybackSpeed } = useAnimation({
    lessonId: lessonId ?? '',
  });

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [landmarksBuffer, setLandmarksBuffer] = useState<LandmarksData[]>([]);
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const BUFFER_DURATION = 1000; // 1초

  // useClassifierClient 훅 사용
  const {
    isRetrying,
    isConnected,
    currentConnectionId,
    currentWsUrl,
    lessonMapper,
    currentSignId,
    currentSign,
    currentResult,
    feedback,
    displayConfidence,
    maxConfidence,
    isBufferingPaused,
    studyList,
    setCurrentSignId,
    setCurrentSign,
    setLessonMapper,
    setFeedback,
    setDisplayConfidence,
    setMaxConfidence,
    setIsBufferingPaused,
    retryLessonMapper,
    retryWsConnection,
    connectionStatus,
    wsList,
    sendMessage,
  } = useClassifierClient();



  //===============================================
  // 랜드마크 버퍼링 및 전송 처리
  //===============================================

  const [isMovingNextSign, setIsMovingNextSign] = useState(false);
  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateVideoProgress = () => {
    if (exampleVideoRef.current) {
      const currentTime = exampleVideoRef.current.currentTime;
      const duration = exampleVideoRef.current.duration;

      // NaN 체크 추가
      if (!isNaN(currentTime) && !isNaN(duration) && duration > 0) {
        const progress = (currentTime / duration) * 100;
        setVideoProgress(progress);
      }
    } else {
      console.log('exampleVideoRef.current is null');
    }
  };

  // 랜드마크 감지 시 호출되는 콜백 (useCallback으로 먼저 정의)
  const handleLandmarksDetected = useCallback((landmarks: LandmarksData) => {
    // 녹화 중일 때만 버퍼에 추가
    if (isRecording && isConnected) {
      console.log("✅ 랜드마크 감지됨");
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
    startCamera,
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

      console.log("currnesRsutr");
      console.log(currentResult?.prediction);

      // 1초마다 버퍼 전송
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
              // console.log('🔄 랜드마크 시퀀스 전송됨 (1초 간격)');
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
  }, [isRecording, isConnected, currentConnectionId, sendMessage, isBufferingPaused, currentResult]);

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

  // MediaPipe 초기화 후 카메라 자동 시작
  useEffect(() => {
    if (isInitialized && !isCompleted) {
      console.log('🎥 MediaPipe 초기화 완료, 카메라 시작...');
      startCamera().then(success => {
        if (success) {
          console.log('✅ 카메라 시작 성공');
        } else {
          console.error('❌ 카메라 시작 실패');
        }
      });
    }
  }, [isInitialized, isCompleted, startCamera]);

  //===============================================

  // 정답/오답 피드백이 닫힐 때 처리 (모든 상태 전이 담당)
  const handleFeedbackComplete = useCallback(() => {
    setCorrectCount(prev => {
      let next = prev;
      if (feedback === 'correct') next = prev + 1;
      return next;
    });
    setFeedback(null);
    if (feedback === 'correct') {
      setIsWaitingForReset(true); // 정답 후에는 리셋 대기
      setIsRecording(true);
    }
  }, [feedback, setFeedback]);

  // 정답 3회 시 완료 처리
  useEffect(() => {
    if (correctCount >= CORRECT_TARGET) {
      setIsCompleted(true);
      setIsRecording(false);
      setFeedback(null);
      setIsWaitingForReset(false);
    } else if (!isCompleted && feedback === null && !isWaitingForReset) {
      // 3회 미만이고 모달이 닫혔으며, 리셋 대기가 아닐 때만 분류 재시작
      setIsRecording(true);
    }

    setProgress(correctCount * 33.3);
  }, [correctCount, isCompleted, feedback, isWaitingForReset, setFeedback]);

  // 다시하기 핸들러
  const handleRetry = () => {
    setCorrectCount(0);
    setIsCompleted(false);
    setFeedback(null);
    setIsRecording(true);
    setIsWaitingForReset(false);
  };

  const handleGoHome = () => {
    disconnectWebSockets();
    console.log("HOME DONE..?");
    navigate('/home');
  };

  useEffect(() => {
    const fetchLesson = async () => {
      const response = await API.get<{ success: boolean; data: Lesson }>(`/lessons/${lessonId}`);
      if (response.data.success) {
        setLesson(response.data.data);
      }
    };
    setCurrentSignId(lessonId ?? '');
    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    setCurrentSign(lesson);
  }, [currentSignId, lesson]);

  // 완료 화면
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/home')}
                  className="hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{lesson?.word ?? lessonId ?? ''}</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">학습 완료!</h2>
            <p className="text-gray-600 mb-6">'{lesson?.word ?? lessonId}' 수어를 성공적으로 3회 따라했습니다.</p>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleRetry} variant="outline">
                다시하기
              </Button>
              <Button onClick={handleGoHome} className="bg-blue-600 hover:bg-blue-700">
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        currentMode={"단일 학습"}
        chapterId={""}
        currentSignIndex={1}
        progress={progress}
        categoryId={undefined}
        navigate={navigate}
        feedback={feedback}
      />

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="mt-12 p-3 bg-gray-100 rounded-md">
          <div className="space-y-4 relative">
            {videoSrc ? (
              <>
                <video
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  onClick={togglePlaybackSpeed}
                />
                {isSlowMotion && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xl font-medium">
                    0.5x
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center bg-gray-200 rounded h-full w-full">
                <p>비디오 로딩 중...</p>
              </div>
            )}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-3xl font-bold text-blue-600">
              {lesson?.word}
            </h2>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-md">

          {/* 비디오 입력 영역 */}
          <div className="space-y-4">
            <PlayerWindow
              width={640}
              height={480}
              autoStart={true}
              showControls={true}
              className="h-full"
              currentSign={lesson}
              currentResult={displayConfidence}
            />

            {/* 숨겨진 비디오 요소들 */}
            <div className="hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} />
            </div>
          </div>

        </div>
      {/* 피드백 표시 */}
      {feedback && (
        <div className="px-[2vw] pb-[1.5vw]">
          <FeedbackDisplay
            feedback={feedback}
            prediction={currentResult?.prediction}
            onComplete={feedback === 'correct' ? handleFeedbackComplete : undefined}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default Learn;


