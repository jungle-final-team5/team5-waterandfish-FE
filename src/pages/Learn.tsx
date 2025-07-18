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
import { Lesson as LessonBase } from '@/types/learning';
import VideoInput from '@/components/VideoInput';
import { useMediaPipeHolistic } from '@/hooks/useMediaPipeHolistic';
import FeedbackModalForLearn from '@/components/FeedbackModalForLearn';
import LearningDisplay from '@/components/LearningDisplay';
import useWebsocket, { getConnectionByUrl, disconnectWebSockets } from '@/hooks/useWebsocket';
import { ClassificationResult, signClassifierClient, LandmarksData } from '@/services/SignClassifierClient';
import StreamingControls from '@/components/StreamingControls';
import SessionHeader from '@/components/SessionHeader';
import { update } from 'lodash';
import { useClassifierClient } from '@/hooks/useClassifierClient';

interface Lesson extends LessonBase {
  sign_text?: string;
  media_url?: string;
  chapter_id?: string;
}

const CORRECT_TARGET = 3;

const Learn = () => {
  const [progress, setProgress] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(true); // 진입 시 바로 분류 시작
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const exampleVideoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [transmissionCount, setTransmissionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWaitingForReset, setIsWaitingForReset] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lessonId } = useParams();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [wsUrlLoading, setWsUrlLoading] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
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
              console.log('✅ 동작 속도 정상');
              if (isBufferingPaused) {
                setIsBufferingPaused(false);
              }
              console.log('🔄 랜드마크 시퀀스 전송됨 (1초 간격)');
              sendMessage(JSON.stringify(landmarksSequence), currentConnectionId);
            }
            else {
              console.log('❌ 동작 속도 빠름. 시퀸스 전송 건너뜀');
              setDisplayConfidence("천천히 동작해주세요");
              setIsBufferingPaused(true);
              setLandmarksBuffer([]);
            }
            setTransmissionCount(prev => prev + prevBuffer.length);
            console.log(`📤 랜드마크 시퀀스 전송됨 (${prevBuffer.length}개 프레임)`);

            // 버퍼 비우기
            return [];
          }
          return prevBuffer;
        });
      }, BUFFER_DURATION);

      console.log('🔄 랜드마크 버퍼링 시작 (1초 간격)');
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

  // lesson fetch (chapter_id 포함)
  useEffect(() => {
    if (!lessonId) return;
    setLessonLoading(true);
    setLessonError(null);
    API.get<{ success: boolean; data: Lesson; message?: string }>(`/lessons/${lessonId}`)
      .then(res => {
        const data = res.data.data;
        // word가 없고 sign_text가 있으면 word에 sign_text를 할당
        if (!data.word && data.sign_text) {
          data.word = data.sign_text;
        }
        setLesson(data);
        setCurrentSign(data); // useClassifierClient의 currentSign 설정
        setCurrentSignId(data.id); // useClassifierClient의 currentSignId 설정
        setLessonLoading(false);
      })
      .catch((err) => {
        setLesson(null);
        setLessonLoading(false);
        setLessonError('존재하지 않는 수어입니다');
      });
  }, [lessonId, setCurrentSign, setCurrentSignId]);

  // 단일 레슨용 wsUrl fetch
  useEffect(() => {
    if (!lessonId) return;
    setWsUrlLoading(true);
    API.get<{ success: boolean; data: { ws_url: string }; message?: string }>(`/ml/public/deploy/lesson/${lessonId}`)
      .then(res => {
        setWsUrl(res.data.data.ws_url);
        // Home.tsx처럼 lesson_mapper에 직접 할당
        setLessonMapper(prev => {
          const newMapper = { ...prev, [lessonId]: res.data.data.ws_url };
          // lessonMapper가 세팅된 후 currentSignId를 다시 세팅하여 분류 트리거
          setCurrentSignId(lessonId);
          return newMapper;
        });
        setWsUrlLoading(false);
      })
      .catch(() => {
        setWsUrl(null);
        setWsUrlLoading(false);
      });
  }, [lessonId, setCurrentSignId, setLessonMapper]);

  // 애니메이션 데이터 로딩
  useEffect(() => {
    const loadAnim = async () => {
      try {
        const response = await API.get(`/anim/${lessonId}`, {
          responseType: 'blob'
        });
        const videoBlob = new Blob([response.data as BlobPart], { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);

        if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
        }
        setVideoSrc(videoUrl);
      } catch (error) {
        console.error('애니메이션 불러오는데 실패했습니다 : ', error);
      }
    };
    if (lessonId) loadAnim();
  }, [lessonId]);

  const togglePlaybackSpeed = () => {
    setIsSlowMotion(prev => !prev);
  };

  useEffect(() => {
    const videoElement = document.querySelector('video[src]') as HTMLVideoElement;
    if (videoElement) {
      videoElement.playbackRate = isSlowMotion ? 0.5 : 1.0;
    }
  }, [isSlowMotion, videoSrc]);

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

  // 정답/오답 모달이 뜨면 3초(정답) 또는 2초(오답) 뒤 자동으로 닫힘
  useEffect(() => {
    if (feedback === 'correct' || feedback === 'incorrect') {
      const timer = setTimeout(() => {
        handleFeedbackComplete();
      }, feedback === 'correct' ? 3000 : 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback, handleFeedbackComplete]);

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

  // 데이터 로딩/에러 처리
  if (lessonLoading || wsUrlLoading) {
    return <div className="text-center mt-10">수어 정보를 불러오는 중입니다...</div>;
  }
  if (lessonError) {
    return <div className="text-center mt-10 text-red-500">{lessonError}</div>;
  }

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
            <p className="text-gray-600 mb-6">'{lesson?.sign_text ?? lessonId}' 수어를 성공적으로 3회 따라했습니다.</p>
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
      {/* 상단 헤더: 현재 학습 중인 단어 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Button>
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{lesson?.word ?? lesson?.sign_text ?? lessonId ?? ''}</h1>
              {/* 진행률 프로그레스 바 */}
              <div className="flex flex-col items-center w-40">
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((correctCount / 3) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 font-medium mt-1">{Math.min(correctCount, 3)}/3</span>
              </div>
            </div>
            <div style={{ width: '40px' }} /> {/* 오른쪽 공간 맞춤용 */}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
              <div className="mt-12 p-3 bg-gray-100 rounded-md">
        <div className="space-y-4">
        {videoSrc ? (
          <div className="relative">
            <video
              ref={exampleVideoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
              onTimeUpdate={updateVideoProgress}
            />

            {/* 프로그레스 바 */}
            <div className="w-full h-1 bg-gray-200 mt-2">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${videoProgress}%` }}
              ></div>
            </div>
          </div>
          

        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-200 rounded">
            <p>비디오 로딩 중...</p>
          </div>
        )}
        </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-100 rounded-md">

          {/* 비디오 입력 영역 */}
          <div className="space-y-4">
            <VideoInput
              width={640}
              height={480}
              autoStart={true}
              showControls={true}
              className="h-full"
              currentSign={lesson}
              currentResult={displayConfidence}
            />
            <Button
              onClick={togglePlaybackSpeed}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              {isSlowMotion ? '일반 속도' : '천천히 보기'}
              {isSlowMotion ? '(1x)' : '(0.5x)'}
            </Button>

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
          <div className="mt-8">
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


