import { useState, useEffect, useRef, useCallback } from 'react';
import { signClassifierClient, ClassificationResult, LandmarksData } from '../services/SignClassifierClient';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLearningData } from '@/hooks/useLearningData';
import { useVideoStreaming } from '@/hooks/useVideoStreaming';
import { useMediaPipeHolistic } from '@/hooks/useMediaPipeHolistic';
import { useGlobalWebSocketStatus } from '@/contexts/GlobalWebSocketContext';
import { useClassifierClient } from '@/hooks/useClassifierClient';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import QuizTimer from '@/components/QuizTimer';
import SessionHeader from '@/components/SessionHeader';
import API from '@/components/AxiosInstance';
import { Chapter } from '@/types/learning';
import { getConnectionByUrl, disconnectWebSockets } from '@/hooks/useWebsocket';
import VideoInput from '@/components/PlayerWindow';
import StreamingControls from '@/components/StreamingControls';
import { Button } from '@/components/ui/button';

// 재시도 설정
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1초
  maxDelay: 5000, // 5초
};

const QuizSession = () => {
  const { categoryId, chapterId, sessionType } = useParams();
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [transmissionCount, setTransmissionCount] = useState(0);

  const [timerValue, setTimerValue] = useState(15);
  const timeref = useRef<HTMLDivElement | null>(null);
  const times = useRef(15);


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

  // 분류 로그 및 결과 수신 처리
  const [logs, setLogs] = useState<any[]>([]);

  const { showStatus } = useGlobalWebSocketStatus();

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevConnectionIdRef = useRef<string>('');

  const { findCategoryById, findChapterById, findHierarchyByChapterId } = useLearningData();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [category, setCategory] = useState<any>(null);

  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isRequestedBadge, setIsRequestedBadge] = useState<boolean>(false);

  const [sessionComplete, setSessionComplete] = useState(false);

  // 퀴즈 타이머 관련 (위로 이동)
  const [timerActive, setTimerActive] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResults, setQuizResults] = useState<{ signId: string, correct: boolean, timeSpent: number }[]>([]);
  const [isQuizReady, setIsQuizReady] = useState(false); // 퀴즈 준비 상태 추가
  const [timeSpent, setTimeSpent] = useState(0); // 실제 사용한 시간 추적
  // 랜드마크 버퍼링 관련 상태
  const [landmarksBuffer, setLandmarksBuffer] = useState<LandmarksData[]>([]);
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const BUFFER_DURATION = 1000; // 2초
  const QUIZ_TIME_LIMIT = 15;

  //===============================================
  // 랜드마크 버퍼링 및 전송 처리
  //===============================================

  //===============================================
  // 랜드마크 버퍼링 및 전송 처리
  //===============================================

  const [isMovingNextSign, setIsMovingNextSign] = useState(false);
  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 랜드마크 감지 시 호출되는 콜백 (useCallback으로 먼저 정의)
  const handleLandmarksDetected = useCallback((landmarks: LandmarksData) => {
    // 녹화 중일 때만 버퍼에 추가
    if (isRecording && isConnected) {
      setLandmarksBuffer(prev => {
        const newBuffer = [...prev, landmarks];
        return newBuffer;
      });
    } else {
      // console.log(`⚠️ 랜드마크 버퍼링 건너뜀 - 녹화: ${isRecording}, 연결: ${isConnected}`);
    }
  }, [isRecording, isConnected]);

  const togglePlaybackSpeed = () => {
    setIsSlowMotion(prev => !prev);
  };

  // 랜드마크 버퍼링 및 전송 처리
  // MediaPipe holistic hook 사용
  const {
    videoRef,
    canvasRef,
    isInitialized,
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

      // 2초마다 버퍼 전송
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
              sendMessage(JSON.stringify(landmarksSequence), currentConnectionId);
            }
            else {
              // console.log('❌ 동작 속도 빠름. 시퀸스 전송 건너뜀');
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
      // 1. 레슨 상태 업데이트
      API.post(`/progress/chapters/${chapterId}/lessons`, {
        lesson_ids: lessons.map((l) => l.id),
        status: 'study',
      })
        .then(() => {
          // 2. 챕터 완료(진도 증가) API 호출
          return API.post('/study/sessions/complete', { chapter_id: chapterId });
        })
        .then(() => {
          // 3. 완료 페이지로 이동
          navigate(`/complete/chapter/${chapterId}/${1}`);
        });
      // eslint-disable-next-line
      // 버퍼링 타이머 정리
      if (bufferIntervalRef.current) {
        clearInterval(bufferIntervalRef.current);
        bufferIntervalRef.current = null;
      }
    }
  }, []);

  //===============================================

  // connectionId 변경 시 
  useEffect(() => {
    if (currentConnectionId &&
      currentConnectionId !== prevConnectionIdRef.current &&
      prevConnectionIdRef.current !== '') {
      // console.log('[QuizSession] connectionId 변경 감지:', prevConnectionIdRef.current, '->', currentConnectionId);
    }
    if (currentConnectionId) {
      prevConnectionIdRef.current = currentConnectionId;
    }
  }, [currentConnectionId]);

  useEffect(() => {
    return () => {
      disconnectWebSockets();
    }
  }, []);

  //===============================================
  // 퀴즈 관련 처리
  //===============================================


  // handleNextSign 함수 수정
  const handleNextSign = useCallback(async (latestResults = quizResults) => {
    // console.log('🔄 다음 수어로 이동:', currentSignIndex + 1);
    // console.log('현재 퀴즈 결과:', latestResults);

    // 타이머 상태 초기화
    setTimerActive(false);
    setQuizStarted(false);
    setIsRecording(false);
    setIsQuizReady(false);

    if (lessons && currentSignIndex < lessons.length - 1) {
      setCurrentSignIndex(currentSignIndex + 1);
      setFeedback(null);
      // 다음 수어로 업데이트
      const nextLesson = lessons[currentSignIndex + 1];
      setCurrentSign(nextLesson);
      setCurrentSignId(nextLesson?.id || '');
    } else {
      setSessionComplete(true);
      disconnectWebSockets();
      // 백엔드 퀴즈 제출 API 사용 (최신 결과 사용)
      try {
        const results = latestResults.map(result => ({
          lessonId: result.signId,
          correct: result.correct,
          timeSpent: result.timeSpent
        }));
        await API.post(`/quiz/chapter/${chapterId}/submit`, {
          results: results
        });
        // console.log('퀴즈 결과 제출 완료');
      } catch (error) {
        console.error('퀴즈 결과 제출 실패:', error);
      }
    }
  }, [currentSignIndex, lessons, chapterId]);

  // FeedbackDisplay 완료 콜백 함수
  const handleFeedbackComplete = () => {
    // console.log('🎉 FeedbackDisplay 완료, 다음 수어로 이동');
    handleNextSign();
  };

  // 컴포넌트 마운트 시 자동 초기화
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized) {
        // console.log('🚀 자동 초기화 시작...');
        await initializeSession();
      }
    };

    initialize();

    return () => {
      stopCamera();
      if (transmissionIntervalRef.current) {
        clearInterval(transmissionIntervalRef.current);
      }
    };
  }, [isInitialized]);

  // 현재 수어에 대한 ws url 출력
  useEffect(() => {
    if (currentSignId) {
      // console.log('[QuizSession] currentSignId:', currentSignId);
      const wsUrl = lessonMapper[currentSignId] || '';
      // console.log('[QuizSession] currentWsUrl:', wsUrl);

      if (wsUrl) {
        // WebSocket 연결 시도
        // console.log('[QuizSession] WebSocket 연결 시도:', wsUrl);

        // 연결 상태 확인
        const connection = getConnectionByUrl(wsUrl);
        if (connection) {
          // console.log('[QuizSession] currentConnectionId:', connection.id);
        } else {
          console.warn(`[QuizSession] No connection found for targetUrl: ${wsUrl}, 재시도 시작`);
          retryWsConnection(wsUrl);
        }
      } else {
        console.warn('[QuizSession] currentSignId에 대한 WebSocket URL이 없음:', currentSignId);
      }
    }
  }, [currentSignId, lessonMapper, retryWsConnection, retryLessonMapper]);


  // 퀴즈 모드에서 정답 판정 (80% 이상이면 정답)
  useEffect(() => {
    if (currentResult && timerActive && currentResult.prediction === currentSign?.word) {
      const { confidence, probabilities } = currentResult;
      const target = currentSign?.word;
      let percent: number | undefined = undefined;

      if (currentResult.prediction === target) {
        percent = confidence * 100;
      } else if (probabilities && target && probabilities[target] != null) {
        percent = probabilities[target] * 100;
      }

      if (percent >= 80.0) {
        // console.log("✅ 정답! 시간 내에 성공");
        setTimerActive(false);
        setFeedback("correct");

        // 퀴즈 결과 저장 (정답)
        if (currentSign) {
          // 새 결과 객체 생성
          const newResult = {
            signId: currentSign.id,
            correct: true,
            timeSpent: QUIZ_TIME_LIMIT - timeSpent
          };

          // 상태 업데이트와 동시에 로컬 변수에도 저장
          setQuizResults(prev => {
            const updatedResults = [...prev, newResult];

            // 상태 업데이트 후 3초 뒤에 다음 문제로 이동
            setTimeout(() => {
              // console.log("업데이트된 퀴즈 결과 (정답):", updatedResults);
              handleNextSign(updatedResults); // 업데이트된 결과를 인자로 전달
            }, 3000);

            return updatedResults;
          });
        }
      }
    }
  }, [currentResult, timerActive, currentSign, timeSpent, handleNextSign]);

  // 챕터 아이디를 통해 챕터 첫 준비
  useEffect(() => {
    if (chapterId) {
      const loadChapter = async () => {
        try {
          const chapData = await findHierarchyByChapterId(chapterId);
          const categoryData = await findCategoryById(chapData.category_id);
          // console.log(categoryData);
          // console.log(chapData.lessons);
          setLessons(chapData.lessons);

          // lessonMapper도 함께 로드
          if (chapData.lesson_mapper) {
            setLessonMapper(chapData.lesson_mapper);
            // console.log('[QuizSession] lessonMapper 로드됨:', chapData.lesson_mapper);
          } else {
            // lessonMapper가 없으면 별도로 로드
            try {
              const mapperResponse = await API.get(`/chapters/${chapterId}/lesson_mapper`);
              if (mapperResponse.data && Object.keys(mapperResponse.data).length > 0) {
                setLessonMapper(mapperResponse.data as { [key: string]: string });
                // console.log('[QuizSession] lessonMapper 별도 로드 성공:', mapperResponse.data);
              }
            } catch (error) {
              console.error('[QuizSession] lessonMapper 로드 실패:', error);
            }
          }
        } catch (error) {
          console.error('챕터 데이터 로드 실패:', error);
        }
      };
      loadChapter();
    }
  }, [categoryId, chapterId]);

  // 챕터 목록 준비 된 후 initialize
  useEffect(() => {
    setCurrentSignIndex(0);
    setFeedback(null);
  }, []);

  // lessons 배열이 변경될 때마다 현재 수어 업데이트
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const currentLesson = lessons[currentSignIndex];
      setCurrentSign(currentLesson);
      setCurrentSignId(currentLesson?.id || '');
    }
  }, [lessons, currentSignIndex]);

  // 시간 초과 시 호출
  const handleTimeUp = useCallback(() => {
    // console.log('⏰ 시간 초과! 오답 처리');
    setIsRecording(false);
    setTimerActive(false);
    setFeedback('incorrect');

    if (currentSign) {
      // 새 결과 객체 생성
      const newResult = {
        signId: currentSign.id,
        correct: false,
        timeSpent: QUIZ_TIME_LIMIT
      };

      // 상태 업데이트와 동시에 로컬 변수에도 저장
      setQuizResults(prev => {
        const updatedResults = [...prev, newResult];

        // 상태 업데이트 후 3초 뒤에 다음 문제로 이동
        setTimeout(() => {
          // console.log("업데이트된 퀴즈 결과:", updatedResults);
          handleNextSign(updatedResults); // 업데이트된 결과를 인자로 전달
        }, 3000);

        return updatedResults;
      });

      // console.log(currentSign.id);
      // console.log("틀린거 저장 완료하다");
    }
  }, [currentSign]);

  // 퀴즈 시작 함수
  const handleStartQuiz = () => {
    if (currentSign) {
      // console.log('🎯 퀴즈 시작:', currentSign.word);
      setQuizStarted(true);
      setIsQuizReady(true);
      setIsRecording(true);
      setTimeSpent(0); // 시간 리셋

      // 타이머 시작을 약간 지연시켜 상태 업데이트가 완료된 후 시작
      setTimeout(() => {
        setTimerActive(true);
        // console.log('⏰ 타이머 활성화됨');
      }, 100);
    }
  };

  useEffect(() => {
    if (currentResult) {
      if (!quizStarted) {
        handleStartQuiz();
      }
    }
    else {
      setDisplayConfidence('인식이 시작되면 퀴즈가 시작됩니다.');
    }
  }, [currentResult, quizStarted]);

  // 진행률 계산
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      setProgress((currentSignIndex / lessons.length) * 100);
    }
  }, [currentSignIndex, lessons]);

  // 타이머 키 리셋은 handleNextSign에서만 처리

  // 최근 학습 반영: 세션 진입 시점에 호출
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.id);
      API.post('/progress/lessons/events', { lesson_ids: lessonIds, mode: 'quiz' });
    }
  }, [lessons]);

  if (sessionComplete) {
    const totalQuestions = lessons.length;
    const correctCount = quizResults.filter(result => result.correct).length;
    const wrongCount = totalQuestions - correctCount;

    // 뱃지 체크는 SessionComplete에서 단 한 번 다루는 걸로 옮김
    navigate(`/complete/chapter/${chapterId}/${2}`, {
      state: {
        totalQuestions: lessons.length,
        correctCount: quizResults.filter(result => result.correct).length,
        wrongCount: totalQuestions - correctCount
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        currentMode={"퀴즈"}
        chapterId={chapterId}
        currentSignIndex={currentSignIndex}
        progress={progress}
        categoryId={categoryId}
        navigate={navigate}
        feedback={feedback}
      />



      <div className="grid lg:grid-cols-2 gap-12">
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-8 w-full h-full">
            {/* 퀴즈 타이머 */}
            {isQuizReady && (
              <div className="mb-6 w-full">
                <QuizTimer
                  duration={QUIZ_TIME_LIMIT}
                  onTimeUp={handleTimeUp}
                  isActive={timerActive}
                  onTimeChange={setTimeSpent}
                />
              </div>
            )}

            <div className="text-center w-full">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">
                이 수어를 맞춰보세요!
              </h2>
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {currentSign?.word || '로딩 중...'}
              </div>
              <p className="text-gray-600 mb-6">
                {currentSignIndex + 1} / {lessons.length}
              </p>

              {/* 퀴즈 진행 중 표시 */}
              {isQuizReady && (
                <div className="text-green-600 font-semibold text-lg">
                  ⏱️ 퀴즈 진행 중...
                </div>
              )}
            </div>
          </div>
        </div>


        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          {/* 웹캠 및 분류 결과 */}
          <div className="space-y-4">
            <VideoInput
              width={640}
              height={480}
              autoStart={true}
              showControls={true}
              className="h-full"
              currentSign={currentSign}
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
          <div className="mt-8">
            <div className="mb-2 text-sm text-gray-600">
              디버그: feedback={feedback}, prediction={currentResult?.prediction}
            </div>
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

export default QuizSession;