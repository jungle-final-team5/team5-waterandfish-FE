import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

import ExampleAnim from '@/components/ExampleAnim';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import QuizTimer from '@/components/QuizTimer';
import { useLearningData } from '@/hooks/useLearningData';
import { Lesson } from '@/types/learning';
import { signClassifierClient, ClassificationResult } from '../services/SignClassifierClient';
import { useVideoStream } from '../hooks/useVideoStream';
import { useBadgeSystem } from '@/hooks/useBadgeSystem';
import SessionHeader from '@/components/SessionHeader';
import QuizDisplay from '@/components/QuizDisplay';
import LearningDisplay from '@/components/LearningDisplay';
import WebcamSection from '@/components/WebcamSection';
import { createPoseHandler } from '@/components/detect/usePoseHandler';
import HandDetectionIndicator from '@/components/HandDetectionIndicator';
import API from '@/components/AxiosInstance';

const Session = () => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { videoRef, canvasRef, state, startStream, stopStream, captureFrameAsync } = useVideoStream();
  const [transmissionCount, setTransmissionCount] = useState(0);
  const [isCrossed, setIsCrossed] = useState(false);
  const initialPose = useRef<boolean>(false);
  const [isHandDetected, setIsHandDetected] = useState(false);

  const navigate = useNavigate();
  const { categoryId, chapterId, sessionType } = useParams();
  const { getCategoryById, getChapterById, addToReview, markSignCompleted, markChapterCompleted, markCategoryCompleted, getChapterProgress } = useLearningData();
  const { checkBadges } = useBadgeSystem();
  const [animData, setAnimData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [quizResults, setQuizResults] = useState<{ signId: string, correct: boolean, timeSpent: number }[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true); // 자동 재생 활성화
  const [animationSpeed, setAnimationSpeed] = useState(30);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const isQuizMode = sessionType === 'quiz';
  const QUIZ_TIME_LIMIT = 15; // 15초 제한

  const category = categoryId ? getCategoryById(categoryId) : null;
  const chapter = categoryId && chapterId ? getChapterById(categoryId, chapterId) : null;
  const currentSign = chapter?.signs[currentSignIndex];
  const [isMovingNextSign, setIsMovingNextSign] = useState(false);
  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectTimer = useRef<NodeJS.Timeout | null>(null);

  const signs = chapter?.signs;
  useEffect(() => {
    API.get<{ success: boolean; data: { type: string }; message: string }>(`/learn/chapter/${chapterId}`)
      .then(res => {
        const type = res.data.data.type;
        if (type == '자음') {
          navigate("/test/letter/consonant/study");
        } else if (type == '모음') {
          navigate("/test/letter/vowel/study");
        }
        else {
          localStorage.removeItem("studyword");
          setCurrentSignIndex(0);
          setQuizResults([]);
          setFeedback(null);
        }
      })
      .catch(err => {
        console.error('타입 조회 실패:', err);
        navigate("/not-found");
      });
  }, [chapterId, categoryId, sessionType, navigate]);
  const sendQuizResult = async () =>{
    try {
      if (!quizResults.length) return;
      const simplifiedResults = quizResults.map(({ signId, correct }) => ({
        signId,
        correct,
      }));
      await API.post(`/quiz/chapter/${chapterId}/submit`, simplifiedResults);
    } catch (error) {
      console.error("퀴즈 결과 전송 실패:", error);
    }
  }
  const sendStudyResult = async () =>{
    try {
      const stored = localStorage.getItem("studyword");
      if (!stored) return;
      const stwords: string[] = JSON.parse(stored);
      await API.post(`/learn/chapter/${chapterId}/progress`, stwords);
      localStorage.removeItem("studyword");
    checkBadges(""); // 레슨, 즉 단위 단위에 대한 적용
    } catch (error) {
      console.error("학습 결과 전송 실패:", error);
    }
  }
  // 서버 연결 시도 함수
  const attemptConnection = async (attemptNumber: number = 1): Promise<boolean> => {
    console.log(`🔌 서버 연결 시도 ${attemptNumber}...`);
    setIsConnecting(true);
    const success = await signClassifierClient.connect();
    setIsConnected(success);
    setIsConnecting(false);
    
    if (success) {
      console.log('✅ 서버 연결 성공');
      return true;
    } else {
      console.log(`❌ 서버 연결 실패 (시도 ${attemptNumber})`);
      return false;
    }
  };

  // MediaPipe pose detection 설정
  useEffect(() => {
    if (!state.isStreaming || !videoRef.current) return;

    console.log('🎯 MediaPipe pose detection 시작');
    const pose = createPoseHandler((rightShoulder, rightWrist, isHandDetected) => {
      if(detectTimer.current) {
        return;
      }
      const shoulderVisibility = rightShoulder as typeof rightShoulder & { visibility: number } ;
      const wristVisibility = rightWrist as typeof rightWrist & { visibility: number };
      if ((shoulderVisibility.visibility ?? 0) < 0.5 || (wristVisibility.visibility ?? 0 ) < 0.5) {
        setIsHandDetected(false);
        initialPose.current = false;
        setIsCrossed(false);
        return;
      }
      // 손 감지 상태 업데이트      
      if (isHandDetected && rightWrist && rightShoulder) {
        if (rightWrist.x < rightShoulder.x) {
          initialPose.current = true;
          console.log('🤚 초기 포즈 감지됨 (손이 어깨 왼쪽)');
        }
        if (initialPose.current && rightWrist.x > rightShoulder.x) {
          if (!detectTimer.current) {
            setIsCrossed(true);
            console.log('✋ 손이 어깨를 가로질렀습니다');
            detectTimer.current = setTimeout(() => {
              detectTimer.current = null;
            }, 5000);
          }
        }
      } 
    });

    // 비디오가 준비되면 MediaPipe에 연결
    const video = videoRef.current;
    if (video.readyState >= 2) {
      console.log('📹 비디오 준비됨, MediaPipe 연결 시작');
      
      const processFrame = async () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          await pose.send({ image: video });
        }
        if (state.isStreaming) {
          requestAnimationFrame(processFrame);
        }
      };
      
      processFrame();
    } else {
      // 비디오가 준비될 때까지 대기
      const onVideoReady = async () => {
        console.log('📹 비디오 준비됨, MediaPipe 연결 시작');
        
        const processFrame = async () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            await pose.send({ image: video });
          }
          if (state.isStreaming) {
            requestAnimationFrame(processFrame);
          }
        };
        
        processFrame();
      };
      
      video.addEventListener('loadeddata', onVideoReady);
      return () => {
        video.removeEventListener('loadeddata', onVideoReady);
      };
    }
  }, [state.isStreaming, videoRef.current]);

  // 자동 연결 및 스트림 시작
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 분류 결과 콜백 설정
        signClassifierClient.onResult((result) => {
          if(isMovingNextSign==false) {  
            setCurrentResult(result);
            console.log('분류 결과:', result);
          }
        });

        // 연결 재시도 로직
        const maxAttempts = 5;
        let connected = false;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          connected = await attemptConnection(attempt);
          
          if (connected) {
            break;
          }
          
          if (attempt < maxAttempts) {
            console.log(`🔄 ${attempt}/${maxAttempts} 재시도 중... (3초 후)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        
        if (connected) {
          // 비디오 스트림 시작
          setTimeout(async () => {
            try {
              await startStream();
              console.log('🎥 비디오 스트림 시작 요청 완료');
            } catch (error) {
              console.error('비디오 스트림 시작 실패:', error);
              setConnectionError('카메라 접근에 실패했습니다. 페이지를 새로고침해주세요.');
            }
          }, 500);
        } else {
          console.error('❌ 최대 연결 시도 횟수 초과');
          setConnectionError('서버 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
      } catch (error) {
        console.error('세션 초기화 실패:', error);
        setConnectionError('연결 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      }
    };

    initializeSession();

    return () => {
      signClassifierClient.disconnect();
      stopStream();
      if (transmissionIntervalRef.current) {
        clearInterval(transmissionIntervalRef.current);
      }
    };
  }, []);

  // 비디오 스트림 준비 완료 시 전송 시작 (클로저 문제 해결)
  useEffect(() => {
    console.log('📊 스트림 상태 변경:', {
      isStreaming: state.isStreaming,
      hasStream: !!state.stream,
      isConnected,
      isTransmitting
    });

    // 모든 조건이 준비되었고 아직 전송 중이 아닐 때 전송 시작
    if (state.isStreaming && state.stream && isConnected && !isTransmitting) {
      const checkVideoElement = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          console.log('✅ 비디오 엘리먼트 준비 완료, 전송 시작');
          console.log('비디오 readyState:', videoRef.current.readyState);
          handleStartTransmission();
        } else {
          console.log('⏳ 비디오 엘리먼트 준비 중...', {
            hasVideoRef: !!videoRef.current,
            readyState: videoRef.current?.readyState
          });
          setTimeout(checkVideoElement, 100);
        }
      };
      
      // 약간의 지연 후 비디오 엘리먼트 체크
      setTimeout(checkVideoElement, 200);
    }
  }, [state.isStreaming, state.stream, isConnected, isTransmitting]);

  // 연결 상태 변경 시 자동 재연결
  useEffect(() => {
    if (isConnected === false) {
      console.log('🔄 연결이 끊어짐, 자동 재연결 시도...');
      const reconnect = async () => {
        try {
          setIsConnecting(true);
          const success = await attemptConnection(1);
          setIsConnected(success);
          setIsConnecting(false);
          
          if (success) {
            console.log('✅ 자동 재연결 성공');
            // 재연결 성공 시 비디오 스트림도 재시작
            if (!state.isStreaming) {
              await startStream();
            }
          } else {
            console.log('❌ 자동 재연결 실패');
          }
        } catch (error) {
          console.error('자동 재연결 실패:', error);
          setIsConnecting(false);
        }
      };
      
      // 5초 후 재연결 시도
      const timeoutId = setTimeout(reconnect, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, isConnecting, connectionError, state.isStreaming]);

useEffect(() => {
  if (currentSign?.videoUrl) {
    loadData(currentSign?.videoUrl);
  }
}, [currentSign?.videoUrl]);

  useEffect(() => {
    if (chapter) {
      setProgress((currentSignIndex / chapter.signs.length) * 100);
    }
  }, [currentSignIndex, chapter]);
  // 연결 상태 주기적 확인
  useEffect(() => {
    const checkConnectionStatus = () => {
      const currentStatus = signClassifierClient.getConnectionStatus();
      if (currentStatus !== isConnected) {
        console.log(`🔗 연결 상태 변경: ${isConnected} → ${currentStatus}`);
        setIsConnected(currentStatus);
        
        // 연결이 끊어진 경우 전송 중지
        if (!currentStatus && isTransmitting) {
          console.log('🔴 연결 끊어짐, 전송 중지');
          setIsTransmitting(false);
          if (transmissionIntervalRef.current) {
            clearInterval(transmissionIntervalRef.current);
            transmissionIntervalRef.current = null;
          }
        }
      }
    };

    const interval = setInterval(checkConnectionStatus, 2000); // 2초마다 확인
    return () => clearInterval(interval);
  }, [isConnected, isTransmitting]);
  
  const handleStartTransmission = () => {
    console.log('🚀 전송 시작 시도...');
    console.log('연결 상태:', isConnected);
    console.log('스트림 상태:', state);
    
    // 이미 전송 중이면 중단
    if (isTransmitting) {
      console.log('⚠️ 이미 전송 중입니다.');
      return;
    }
    
    if (!isConnected) {
      console.log('서버에 연결되지 않음');
      return;
    }

    if (!state.isStreaming || !state.stream) {
      console.log('비디오 스트림이 준비되지 않음');
      return;
    }

    if (!videoRef.current || videoRef.current.readyState < 2) {
      console.log('비디오 엘리먼트가 준비되지 않음');
      return;
    }

    setIsTransmitting(true);
    setTransmissionCount(0);

    console.log('✅ 전송 시작!');
    transmissionIntervalRef.current = setInterval(async () => {
      const frame = await captureFrameAsync();
      if (frame) {
        const success = signClassifierClient.sendVideoChunk(frame);
        if (success) {
          setTransmissionCount(prev => prev + 1);
        } else {
          console.log('⚠️ 프레임 전송 실패');
        }
      } else {
        console.log('⚠️ 프레임 캡처 실패');
      }
    }, 100);
  };

  // 분류 결과와 정답 비교 로직 (4-8, 4-9 구현)
  useEffect(() => {
    if (!currentResult || !currentSign || isMovingNextSign) {
      return; // 분류 결과가 없거나 이미 피드백이 있으면 무시
    }

    // 분류 1위와 정답 수어 비교
    const isCorrect = (currentResult.prediction.toLowerCase() === currentSign.word.toLowerCase()) && isCrossed;
    const confidence = currentResult.confidence;

    console.log('🎯 분류 결과 비교:', {
      prediction: currentResult.prediction,
      answer: currentSign.word,
      isCorrect,
      confidence: (confidence * 100).toFixed(1) + '%'
    });
    console.log('currentResult', currentResult);
    console.log('currentSign', currentSign);

    // 신뢰도가 일정 수준 이상일 때만 결과 처리 (오탐지 방지)
    if (confidence >= 0.5) {
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setIsRecording(false);
      setTimerActive(false);

      // 학습 진도 업데이트
      if (isCorrect && currentSign) {
        markSignCompleted(currentSign.id);
        const currentId = currentSign.id;
        const prevCompleted = JSON.parse(localStorage.getItem('studyword') || '[]');
        const filtered = prevCompleted.filter((id: string) => id !== currentId);
        filtered.push(currentId);
        localStorage.setItem('studyword', JSON.stringify(filtered));
      }

      if (isQuizMode && currentSign) {
        const timeSpent = QUIZ_TIME_LIMIT - (timerActive ? QUIZ_TIME_LIMIT : 0);
        setQuizResults(prev => [...prev, {
          signId: currentSign.id,
          correct: isCorrect,
          timeSpent
        }]);

        if (!isCorrect) {
          addToReview(currentSign);
        }
      }

      // 정답이면 피드백 표시 (자동 진행은 FeedbackDisplay의 onComplete에서 처리)
      if (isCorrect) {
        setIsMovingNextSign(true);
        console.log('🎉 정답! FeedbackDisplay에서 진행 관리합니다.');
        // 자동 진행 로직 제거 - FeedbackDisplay의 onComplete에서 처리
      } else if (!isQuizMode) {
        // 학습 모드에서 오답일 때는 자동 진행하지 않음 (수동으로 처리)
      } else {
        // 퀴즈 모드에서 오답일 때는 3초 후 자동 진행
        setTimeout(() => {
          handleNextSign();
        }, 3000);
      }
    }
  }, [currentResult, currentSign, feedback, isQuizMode, timerActive]);

  // 퀴즈 모드에서 새로운 문제가 시작될 때 자동으로 타이머 시작
  useEffect(() => {
    if (isQuizMode && currentSign && !feedback) {
      setQuizStarted(true);
      setTimerActive(true);
      setIsRecording(true);

      // 15초 후 자동으로 시간 초과 처리
      const timer = setTimeout(() => {
        if (isRecording && timerActive) {
          handleTimeUp();
        }
      }, QUIZ_TIME_LIMIT * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentSignIndex, isQuizMode, currentSign, feedback]);

  // 애니메이션 재생/정지 처리
  useEffect(() => {
    if (isPlaying && animData) {
      animationIntervalRef.current = setInterval(() => {
        if (currentFrame < animData.pose.length - 1) {
          setCurrentFrame(prev => prev + 1);
        } else {
          setCurrentFrame(0);
        }
      }, 1000 / animationSpeed);
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
  }, [isPlaying, animationSpeed, animData, currentFrame]);

const loadData = useCallback(async (videoUrl: string) => {
  if (!videoUrl) {
    console.warn("videoUrl 없음, loadData 실행 중단");
    return;
  }

  try {
    // TODO : result에서 백엔드로 가져오도록 수정
    const response = await fetch(`/result/${videoUrl}`);
    

    const landmarkData = await response.json();
    setAnimData(landmarkData);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }
}, []);

  const handleStartRecording = () => {
    setIsRecording(true);
    setFeedback(null);
    setCurrentResult(null); // 이전 분류 결과 초기화

    if (isQuizMode) {
      setTimerActive(true);
    }

    console.log('🎬 수어 녹화 시작:', currentSign?.word);
  };

  const handleTimeUp = () => {
    setIsRecording(false);
    setTimerActive(false);
    setFeedback('incorrect');

    if (currentSign) {
      setQuizResults(prev => [...prev, {
        signId: currentSign.id,
        correct: false,
        timeSpent: QUIZ_TIME_LIMIT
      }]);
      addToReview(currentSign);
    }

    // 퀴즈 모드에서는 시간 초과 시에도 자동으로 다음 문제로 이동
    setTimeout(() => {
      handleNextSign();
    }, 3000); // 3초로 통일
  };

  const handleNextSign = async () => {
    setIsMovingNextSign(false);
    if (chapter && currentSignIndex < chapter.signs.length - 1) {
      setCurrentSignIndex(currentSignIndex + 1);
      setFeedback(null);
      setTimerActive(false);
      setQuizStarted(false);
    } else {
      // 챕터 완료 처리
      if (chapter) {
        const chapterProgress = getChapterProgress(chapter);
        if (chapterProgress.percentage === 100) {
          markChapterCompleted(chapter.id);
        }

        // 카테고리 완료 확인
        if (category) {
          const allChaptersCompleted = category.chapters.every(ch => {
            const progress = getChapterProgress(ch);
            return progress.percentage === 100;
          });
          if (allChaptersCompleted) {
            markCategoryCompleted(category.id);
          }
        }
      }
      setSessionComplete(true);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setIsRecording(false);
    setTimerActive(false);
    setQuizStarted(false);
    setAutoStarted(false);
    setCurrentResult(null); // 이전 분류 결과 초기화
    console.log('🔄 다시 시도:', currentSign?.word);
  };

  // FeedbackDisplay 완료 콜백 함수
  const handleFeedbackComplete = () => {
    console.log('🎉 FeedbackDisplay 완료, 다음 수어로 이동');
    handleNextSign();
  };

  // useEffect는 항상 호출, 내부에서 sessionComplete 조건 체크
  useEffect(() => {
    if (sessionComplete) {
      API.post('/user/daily-activity/complete')
        .then(() => {
          console.log("오늘 활동 기록 완료!(퀴즈/세션)");
        })
        .catch((err) => {
          console.error("오늘 활동 기록 실패(퀴즈/세션):", err);
        });
    }
    // eslint-disable-next-line
  }, [sessionComplete]);

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <CardTitle>연결 오류</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{connectionError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              페이지 새로고침
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category || !chapter || !currentSign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">세션을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/learn')}>돌아가기</Button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const correctAnswers = quizResults.filter(r => r.correct).length;
    const totalQuestions = quizResults.length;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle>
              {isQuizMode ? '퀴즈 완료!' : '학습 완료!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isQuizMode && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">결과</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {correctAnswers}/{totalQuestions}
                </p>
                <p className="text-sm text-gray-600">
                  정답률: {Math.round((correctAnswers / totalQuestions) * 100)}%
                </p>
              </div>
            )}
            <p className="text-gray-600">
              '{chapter.title}' {isQuizMode ? '퀴즈를' : '학습을'} 완료했습니다!
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (isQuizMode) {
                      await sendQuizResult();
                    } else {
                      await sendStudyResult();
                    }
                    navigate(`/learn/category/${categoryId}`);
                  } catch (error) {
                    console.error("결과 전송 실패:", error);
                    // 필요 시 에러 처리 추가 가능
                  }
                }}
              >
                챕터 목록
              </Button>
              <Button onClick={async () => {
                try {
                  if (isQuizMode) {
                    await sendQuizResult();
                  } else {
                    await sendStudyResult();
                  }
                  navigate('/home');
                } catch (error) {
                  console.error("결과 전송 실패:", error);
                  // 필요 시 에러 처리 추가 가능
                }
              }}>
                홈으로
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 손 감지 상태 표시 인디케이터 */}
      <HandDetectionIndicator 
        isHandDetected={isHandDetected}
        isConnected={isConnected}
        isStreaming={state.isStreaming}
      />
      
      <SessionHeader 
        isQuizMode={isQuizMode}
        currentSign={currentSign}
        chapter={chapter}
        currentSignIndex={currentSignIndex}
        progress={progress}
        categoryId={categoryId}
        navigate={navigate}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 퀴즈 타이머 */}
          {isQuizMode && timerActive && (
            <div className="mb-6">
              <QuizTimer
                duration={QUIZ_TIME_LIMIT}
                onTimeUp={handleTimeUp}
                isActive={timerActive}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-12">
            {/* 퀴즈 모드에서는 예시 영상 대신 텍스트만 표시 */}
            {isQuizMode ? (
              <QuizDisplay 
                currentSign={currentSign}
                quizStarted={quizStarted}
                feedback={feedback}
                handleNextSign={handleNextSign}
              />
            ) : (
              <LearningDisplay 
                data={animData}
                currentFrame={currentFrame}
                currentSign={currentSign}
              />
            )}

            {/* 웹캠 및 분류 결과 */}
            <WebcamSection 
              isQuizMode={isQuizMode}
              isConnected={isConnected}
              isConnecting={isConnecting}
              isTransmitting={isTransmitting}
              state={state}
              videoRef={videoRef}
              canvasRef={canvasRef}
              currentResult={currentResult}
              connectionError={connectionError}
              isRecording={isRecording}
              feedback={feedback}
              handleStartRecording={handleStartRecording}
              handleNextSign={handleNextSign}
              handleRetry={handleRetry}
            />
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
      </main>
    </div>
  );
};

export default Session;