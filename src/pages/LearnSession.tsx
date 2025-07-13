import { Button } from '@/components/ui/button';
import { Category, Chapter, Lesson } from '@/types/learning';
import { useLearningData } from '@/hooks/useLearningData';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useVideoStreaming } from '@/hooks/useVideoStreaming';
import { ClassificationResult, signClassifierClient, LandmarksData } from '@/services/SignClassifierClient';
import { useGlobalWebSocketStatus } from '@/contexts/GlobalWebSocketContext';
import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';

import API from '@/components/AxiosInstance';
import useWebsocket, { getConnectionByUrl, disconnectWebSockets } from '@/hooks/useWebsocket';
import VideoInput from '@/components/VideoInput';
import SessionHeader from '@/components/SessionHeader';
import LearningDisplay from '@/components/LearningDisplay';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import StreamingControls from '@/components/StreamingControls';
import SessionInfo from '@/components/SessionInfo';
import SystemStatus from '@/components/SystemStatus';
import FeatureGuide from '@/components/FeatureGuide';
import { useMediaPipeHolistic } from '@/hooks/useMediaPipeHolistic';

// 재시도 설정
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1초
  maxDelay: 5000, // 5초
};

const LearnSession = () => {
  const { categoryId, chapterId } = useParams();
  // ...existing code...
  const navigate = useNavigate();
  const location = useLocation();
  const [transmissionCount, setTransmissionCount] = useState(0);
  // URL state에서 lesson_mapper 가져오기
  const [lesson_mapper, setLessonMapper] = useState<{ [key: string]: string }>(location.state?.lesson_mapper || {});
  const [currentWsUrl, setCurrentWsUrl] = useState<string>('');
  const [currentConnectionId, setCurrentConnectionId] = useState<string>('');

  // 재시도 관련 상태
  const [retryAttempts, setRetryAttempts] = useState({
    lessonMapper: 0,
    wsConnection: 0,
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const studyListRef = useRef<string[]>([]);
  const [isBufferingPaused, setIsBufferingPaused] = useState(false);

  // WebGL 지원 확인
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        setWebglSupported(!!gl);
      } catch (err) {
        setWebglSupported(false);
      }
    };

    checkWebGL();
  }, []);

  // lesson_mapper 재시도 함수
  const retryLessonMapper = useCallback(async () => {
    if (retryAttempts.lessonMapper >= RETRY_CONFIG.maxAttempts) {
      console.error('[LearnSession] lesson_mapper 재시도 횟수 초과');
      alert('데이터를 불러오는데 실패했습니다. 페이지를 새로고침하거나 다시 시도해주세요.');
      setIsRetrying(false);
      return;
    }

    setIsRetrying(true);
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(2, retryAttempts.lessonMapper),
      RETRY_CONFIG.maxDelay
    );

    console.log(`[LearnSession] lesson_mapper 재시도 ${retryAttempts.lessonMapper + 1}/${RETRY_CONFIG.maxAttempts} (${delay}ms 후)`);

    retryTimeoutRef.current = setTimeout(() => {
      // 이전 페이지로 돌아가서 다시 데이터 받아오기
      if (location.state?.lesson_mapper && Object.keys(location.state.lesson_mapper).length > 0) {
        setLessonMapper(location.state.lesson_mapper);
        setRetryAttempts(prev => ({ ...prev, lessonMapper: 0 }));
        // WebSocket 연결도 성공했거나 재시도가 필요없으면 전체 재시도 상태 해제
        if (retryAttempts.wsConnection === 0 && currentConnectionId) {
          setIsRetrying(false);
        }
        console.log('[LearnSession] lesson_mapper 재시도 성공');
      } else {
        setRetryAttempts(prev => ({ ...prev, lessonMapper: prev.lessonMapper + 1 }));
        retryLessonMapper();
      }
    }, delay);
  }, [retryAttempts.lessonMapper, retryAttempts.wsConnection, location.state, currentConnectionId]);

  // WebSocket 연결 재시도 함수
  const retryWsConnection = useCallback(async (targetUrl: string) => {
    if (retryAttempts.wsConnection >= RETRY_CONFIG.maxAttempts) {
      console.error('[LearnSession] WebSocket 연결 재시도 횟수 초과');
      alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      navigate("/");
      setIsRetrying(false);
      return;
    }

    setIsRetrying(true);
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(2, retryAttempts.wsConnection),
      RETRY_CONFIG.maxDelay
    );

    console.log(`[LearnSession] WebSocket 연결 재시도 ${retryAttempts.wsConnection + 1}/${RETRY_CONFIG.maxAttempts} (${delay}ms 후)`);

    retryTimeoutRef.current = setTimeout(() => {
      const connection = getConnectionByUrl(targetUrl);
      if (connection) {
        setCurrentConnectionId(connection.id);
        setRetryAttempts(prev => ({ ...prev, wsConnection: 0 }));
        // lesson_mapper도 성공했거나 재시도가 필요없으면 전체 재시도 상태 해제
        if (retryAttempts.lessonMapper === 0 && Object.keys(lesson_mapper).length > 0) {
          setIsRetrying(false);
        }
        console.log('[LearnSession] WebSocket 연결 재시도 성공:', connection.id);
      } else {
        setRetryAttempts(prev => ({ ...prev, wsConnection: prev.wsConnection + 1 }));
        retryWsConnection(targetUrl);
      }
    }, delay);
  }, [retryAttempts.wsConnection, retryAttempts.lessonMapper, lesson_mapper]);

  // lesson_mapper 디버그 로그
  useEffect(() => {
    console.log('[LearnSession] lesson_mapper:', lesson_mapper);
    console.log('[LearnSession] lesson_mapper keys:', Object.keys(lesson_mapper));

    // lesson_mapper가 비어있으면 재시도
    if (Object.keys(lesson_mapper).length === 0 && !isRetrying) {
      console.log('[LearnSession] lesson_mapper가 비어있음, 재시도 시작');
      retryLessonMapper();
    }
  }, [lesson_mapper, isRetrying, retryLessonMapper]);

  // WebSocket 훅
  const { connectionStatus, wsList, broadcastMessage, sendMessage } = useWebsocket();

  // WebSocket 연결 상태 모니터링
  useEffect(() => {
    // connectionStatus가 변경될 때마다 isConnected 업데이트
    const isWsConnected = connectionStatus === 'connected' && wsList.length > 0;
    setIsConnected(isWsConnected);
    console.log(`🔌 WebSocket 연결 상태: ${connectionStatus}, 연결된 소켓: ${wsList.length}개, isConnected: ${isWsConnected}`);
  }, [connectionStatus, wsList.length]);

  // 분류 로그 및 결과 수신 처리
  const [logs, setLogs] = useState<any[]>([]);
  const [displayConfidence, setDisplayConfidence] = useState<string>('');

  const { showStatus } = useGlobalWebSocketStatus();

  const [isConnected, setIsConnected] = useState<boolean>(false); // 초기값에 의해 타입 결정됨.
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [maxConfidence, setMaxConfidence] = useState(0.0);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  //const {findCategoryById, findChapterById, addToReview, markSignCompleted, markChapterCompleted, markCategoryCompleted, getChapterProgress } = useLearningData();
  const { findCategoryById, findChapterById, findHierarchyByChapterId } = useLearningData();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  const [animData, setAnimData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const currentSign = lessons[currentSignIndex];
  const currentSignId = lessons[currentSignIndex]?.id;
  const [isRecording, setIsRecording] = useState(false);

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  // 랜드마크 버퍼링 관련 상태
  const [landmarksBuffer, setLandmarksBuffer] = useState<LandmarksData[]>([]);
  const bufferIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const BUFFER_DURATION = 1000; // 2초

  // sessionComplete 시 소켓 연결 해제
  // sessionComplete 시 소켓 연결 해제, 동시에 챕터 단위 진행도 업데이트
  useEffect(() => {
    if (sessionComplete) {
      disconnectWebSockets();
      API.post(`/progress/chapters/${chapterId}/lessons`,
        { lesson_ids: studyListRef.current, status: "study" })
    }
  }, [sessionComplete]);

  //const category = categoryId ? findCategoryById(categoryId) : null;
  const [isMovingNextSign, setIsMovingNextSign] = useState(false);
  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectTimer = useRef<NodeJS.Timeout | null>(null);


  // 비디오 스트리밍 훅
  const {
    isStreaming,
    streamingStatus,
    currentStream,
    streamInfo,
    streamingConfig,
    streamingStats,
    // canvasRef,
    // videoRef,
    startStreaming,
    stopStreaming,
    setStreamingConfig,
    handleStreamReady,
    handleStreamError,
  } = useVideoStreaming({
    connectionStatus,
    broadcastMessage,
    sendMessage,
    connectionId: currentConnectionId,
  });

  // 랜드마크 감지 시 호출되는 콜백 (useCallback으로 먼저 정의)
  const handleLandmarksDetected = useCallback((landmarks: LandmarksData) => {
    console.log(`🎯 랜드마크 감지됨 - 녹화: ${isRecording}, 연결: ${isConnected}`);

    // 녹화 중일 때만 버퍼에 추가
    if (isRecording && isConnected) {
      setLandmarksBuffer(prev => {
        const newBuffer = [...prev, landmarks];
        console.log(`📥 랜드마크 버퍼에 추가됨 (총 ${newBuffer.length}개)`);
        return newBuffer;
      });
    } else {
      console.log(`⚠️ 랜드마크 버퍼링 건너뜀 - 녹화: ${isRecording}, 연결: ${isConnected}`);
    }
  }, [isRecording, isConnected]);


  // MediaPipe holistic hook 사용
  const {
    videoRef,
    canvasRef,
    isInitialized,
    isProcessing,
    lastLandmarks,
    startCamera,
    stopCamera,
    retryInitialization,
    error,
    inspect_sequence
  } = useMediaPipeHolistic({
    onLandmarks: handleLandmarksDetected,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
    enableLogging: false // MediaPipe 내부 로그 숨김
  });


  // 랜드마크 버퍼링 및 전송 처리
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
              console.log('✅ 동작 속도 정상');
              if (isBufferingPaused) {
                setIsBufferingPaused(false);
              }
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

  // 이전 connectionId 추적을 위한 ref
  const prevConnectionIdRef = useRef<string>('');

  // connectionId 변경 시 비디오 스트리밍 갱신
  useEffect(() => {
    // 실제로 connectionId가 변경되었을 때만 처리
    if (currentConnectionId &&
      currentConnectionId !== prevConnectionIdRef.current &&
      prevConnectionIdRef.current !== '') {

      console.log('[LearnSession] connectionId 변경 감지:', prevConnectionIdRef.current, '->', currentConnectionId);

      // 스트리밍 중일 때만 재시작
      if (isStreaming) {
        console.log('[LearnSession] 스트리밍 재시작 시작');

        // 기존 스트리밍 중지 후 새 connectionId로 재시작
        stopStreaming();

        // 잠시 대기 후 재시작 (연결 정리 시간 확보)
        const restartTimeout = setTimeout(() => {
          startStreaming();
          console.log('[LearnSession] 스트리밍 재시작 완료');
        }, 100);

        return () => clearTimeout(restartTimeout);
      } else {
        console.log('[LearnSession] 스트리밍 중이 아니므로 재시작하지 않음');
      }
    }

    // connectionId 업데이트
    if (currentConnectionId) {
      prevConnectionIdRef.current = currentConnectionId;
    }
  }, [currentConnectionId, startStreaming, stopStreaming]);

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

  // 다음 수어(레슨)으로 넘어가는 내용
  const handleNextSign = async () => {
    setIsMovingNextSign(false);
    if (lessons && currentSignIndex < lessons.length - 1) {
      setCurrentSignIndex(currentSignIndex + 1);
      setFeedback(null);
    } else {
      setSessionComplete(true);
    }
  };

  // FeedbackDisplay 완료 콜백 함수. Feedback 복구 시 해당 메서드 실행하게끔 조치
  const handleFeedbackComplete = () => {
    setFeedback("correct");
    console.log('🎉 FeedbackDisplay 완료, 다음 수어로 이동');

    handleNextSign();
  };

  // 애니메이션 재생 루틴 [완료]
  const loadAnim = async () => {
    try {
      const id = currentSign.id;
      console.log(id);
      const response = await API.get(`/anim/${id}`);
      setAnimData(response.data);
    } catch (error) {
      console.error('애니메이션 불러오는데 실패했습니다 : ', error);
    }
  };

  // 카메라 및 MediaPipe 초기화
  const initializeSession = async () => {
    if (!isInitialized) {
      console.log('⚠️ MediaPipe가 아직 초기화되지 않음');
      return false;
    }

    try {
      console.log('📹 카메라 시작 중...');
      const cameraStarted = await startCamera();

      if (cameraStarted) {
        console.log('✅ 세션 초기화 완료');
        return true;
      } else {
        console.log('[LearnSession] ❌ 카메라 시작 실패');
        return false;
      }
    } catch (error) {
      console.error('❌ 세션 초기화 실패:', error);
      return false;
    }
  };

  // 컴포넌트 마운트 시 자동 초기화
  useEffect(() => {
    const initialize = async () => {
      // MediaPipe 초기화 대기
      if (isInitialized) {
        console.log('🚀 자동 초기화 시작...');
        // await attemptConnection();
        await initializeSession();
      }
    };

    initialize();

    // 언마운트 시 정리 (disconnectWebSockets는 sessionComplete에서만 호출)
    return () => {
      signClassifierClient.disconnect();
      stopCamera();
      if (transmissionIntervalRef.current) {
        clearInterval(transmissionIntervalRef.current);
      }
      // disconnectWebSockets()는 여기서 호출하지 않음
    };
  }, [isInitialized]);

  const poseLength = animData && animData.pose ? animData.pose.length : 0;

  // 자음 모음쪽으로 네비게이팅 합니다. 이거 따로 빼야함
  useEffect(() => {
    API.get<{ success: boolean; data: { title: string }; message: string }>(`/chapters/${chapterId}/session`)
      .then(res => {
        const title = res.data.data.title;
        if (title == '자음') {
          navigate("/test/letter/consonant/study");
        } else if (title == '모음') {
          navigate("/test/letter/vowel/study");
        }
        else {
          localStorage.removeItem("studyword");
          setCurrentSignIndex(0);
          setFeedback(null);
        }
      })
      .catch(err => {
        console.error('타입 조회 실패:', err);
        navigate("/not-found");
      });
  }, [chapterId, categoryId, navigate]);


  // 수어 변경 시점마다 애니메이션 자동 변경 [완료]
  useEffect(() => {
    loadAnim();
  }, [currentSign]);

  // 애니메이션 자동 재생 처리 및 프레임 조절 [완료]
  useEffect(() => {
    if (animData) {
      animationIntervalRef.current = setInterval(() => {
        if (currentFrame < animData.pose.length - 1) {
          setCurrentFrame(prev => prev + 1);
        } else {
          setCurrentFrame(0);
        }
      }, 1000 / 30);
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [animData, currentFrame]);

  // 현재 수어에 대한 ws url 출력
  useEffect(() => {
    if (currentSignId) {
      console.log('[LearnSession] currentSignId:', currentSignId);
      const wsUrl = lesson_mapper[currentSignId] || '';
      setCurrentWsUrl(wsUrl);
      console.log('[LearnSession] currentWsUrl:', wsUrl);

      if (wsUrl) {
        const connection = getConnectionByUrl(wsUrl);
        if (connection) {
          setCurrentConnectionId(connection.id);
          setRetryAttempts(prev => ({ ...prev, wsConnection: 0 })); // 성공 시 재시도 카운터 리셋
          console.log('[LearnSession] currentConnectionId:', connection.id);
        } else {
          console.warn(`[LearnSession] No connection found for targetUrl: ${wsUrl}, 재시도 시작`);
          retryWsConnection(wsUrl);
        }
      } else {
        console.warn('[LearnSession] currentSignId에 대한 WebSocket URL이 없음:', currentSignId);
        // lesson_mapper에 해당 ID가 없으면 lesson_mapper 재시도
        if (Object.keys(lesson_mapper).length === 0) {
          retryLessonMapper();
        }
      }
    }
  }, [currentSignId, lesson_mapper, retryWsConnection, retryLessonMapper]);

  useEffect(() => {
    if (wsList && wsList.length > 0) {
      // 각 소켓에 대해 핸들러 등록
      const handlers: { ws: WebSocket; fn: (e: MessageEvent) => void }[] = [];
      setMaxConfidence(0);

      wsList.forEach(ws => {
        const handleMessage = (event: MessageEvent) => {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'classification_result': {

                // 버퍼링 일시정지 중에 None 감지 시 버퍼링 재개
                if (isBufferingPaused && msg.data && msg.data.prediction !== "None") {
                  setDisplayConfidence("빠른 동작 감지");
                  return;
                } else if (isBufferingPaused && msg.data && msg.data.prediction === "None") {
                  setIsBufferingPaused(false);
                  return;
                }


                console.log('받은 분류 결과:', msg.data);
                if (feedback && msg.data.prediction === "None") {
                  setCurrentResult(msg.data);
                  break;
                }
                const { prediction, confidence, probabilities } = msg.data;
                const target = currentSign?.word;
                let percent: number | undefined = undefined;
                if (prediction === target) {
                  percent = confidence * 100;
                } else if (probabilities && target && probabilities[target] != null) {
                  percent = probabilities[target] * 100;
                }
                if (percent != null) {
                  setDisplayConfidence(`${percent.toFixed(1)}%`);
                }
                setCurrentResult(msg.data);
                if (percent >= 80.0) {
                  setFeedback("correct");
                  studyListRef.current.push(currentSign.id);
                  console.log("PASSED");
                }
                break;
              }
              default:
                break;
            }
          } catch (e) {
            console.error('WebSocket 메시지 파싱 오류:', e);
          }
        };
        ws.addEventListener('message', handleMessage);
        handlers.push({ ws, fn: handleMessage });
      });

      // 정리: 컴포넌트 언마운트 혹은 wsList 변경 시 리스너 해제
      return () => {
        handlers.forEach(({ ws, fn }) => {
          ws.removeEventListener('message', fn);
        });
      };
    }
  }, [wsList, isBufferingPaused]);


  // 챕터 아이디를 통해 챕터 첫 준비 [완료]
  useEffect(() => {
    if (chapterId) {
      const loadChapter = async () => {
        try {
          const chapData = await findHierarchyByChapterId(chapterId);
          const categoryData = await findCategoryById(chapData.category_id);
          console.log(categoryData);

          console.log(chapData.lessons);
          setLessons(chapData.lessons);
          //setCategory(hierachy)
        } catch (error) {
          console.error('챕터 데이터 로드 실패:', error);
        }
      };
      loadChapter();
    }
  }, [categoryId, chapterId]);

  // 챕터 목록 준비 된 후 initialize [작업 중]
  useEffect(() => {
    setCurrentSignIndex(0);
    setFeedback(null);
    setCurrentResult(null); // 이전 분류 결과 초기화

    // 컴포넌트 언마운트 시 정리 작업 실시 
    return () => {
      // 재시도 타이머 정리
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  if (sessionComplete) // 모든 내용이 완료 된 경우
  {
    navigate(`/complete/chapter/${chapterId}/${1}`);
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        isQuizMode={false}
        currentSign={"쑤퍼노바"}
        chapter={"chaptar"}
        currentSignIndex={1}
        progress={1}
        categoryId={undefined}
        navigate={navigate}
      />

      <div className="grid lg:grid-cols-2 gap-12">
        {<LearningDisplay
          data={animData}
          currentFrame={currentFrame}
          totalFrame={150}
        />}
        <div className="mt-4 p-3 bg-gray-100 rounded-md">

          {/* 비디오 입력 영역 */}
          <div className="space-y-4">
            <VideoInput
              width={640}
              height={480}
              autoStart={true}
              showControls={true}
              onStreamReady={handleStreamReady}
              onStreamError={handleStreamError}
              className="h-full"
              currentSign={currentSign}
              currentResult={displayConfidence}
            />

            <StreamingControls
              isStreaming={isStreaming}
              streamingStatus={streamingStatus}
              streamingConfig={streamingConfig}
              currentStream={currentStream}
              connectionStatus={connectionStatus}
              onStartStreaming={startStreaming}
              onStopStreaming={stopStreaming}
              onConfigChange={setStreamingConfig}
              transitionSign={handleNextSign}
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
            <FeedbackDisplay
              feedback={feedback}
              prediction={currentResult.prediction}
              onComplete={feedback === 'correct' ? handleFeedbackComplete : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnSession;

