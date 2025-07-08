import { useState, useEffect, useRef, useCallback } from 'react';
import { signClassifierClient, ClassificationResult } from '../services/SignClassifierClient';
import { useNavigate, useParams } from 'react-router-dom';
import { useLearningData } from '@/hooks/useLearningData';
import { useVideoStream } from '../hooks/useVideoStream';
import { Button } from '@/components/ui/button';

import HandDetectionIndicator from '@/components/HandDetectionIndicator';
import { createPoseHandler } from '@/components/detect/usePoseHandler';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import QuizTimer from '@/components/QuizTimer';
import SessionHeader from '@/components/SessionHeader';
import WebcamSection from '@/components/WebcamSection';
import NotFound from './NotFound';
import API from '@/components/AxiosInstance';
import { Chapter } from '@/types/learning';

// 주요 변경 점 | 7월 6일 자정 작업
// 변수 및 의존성 재확인 : 전부 다 아님
// anim 관련 메서드 전체 제거


// 7월 6일 오후 2시 반영
// function foo() {}; 는 foo를 호출 할 useEffect 위에 있던 아래 있던 상관 없이 호출 가능하다. (Function Declaration)
// 하지만,
// const foo = () => {}; 형식은 반드시 foo를 호출하는 useEffect 보다 우선 되어야 사용 가능하다. (Function Expression)
// 이 부분에 대한 배치에 대한 헷갈림을 방지하기 위해 아래와 같이 전체적 형식을 구성하고자 한다

// import 문
// definition default Function Expression : 여기서는 const QuizSession = () => {
  // [get, set 형식의 변수 선언]
  // [이 페이지 (Quiz.tsx)에서 사용 할 Function Expression 선언]
  // useEffect 나열
  // 조건에 따른 return (페이지에 표시 할 것 결정)
// const QuizSession 정의 내용 종료 }
// export default QuizSession;

// isQuizMode 제거

// 퀴즈 정의 : QUIZ_TIME_LIMIT초 안에 주어지는 제스처대로 못하면 실패
  // 다음 Lesson(단어)로 넘어가고 다시 QUIZ_TIME_LIMIT 시간을 센다.
    // Lesson 리스트가 끝날 때 까지 반복



// [7월 8일] QUIZ 할 일
  // 퀴즈쪽 시스템 살리면서 기존 코드랑 교체 필요
  

const QuizSession = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isMovingNextSign, setIsMovingNextSign] = useState(false);

  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null); 
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const navigate = useNavigate();
  const { categoryId, chapterId, sessionType } = useParams();
  const {videoRef, canvasRef, state, startStream, stopStream, captureFrameAsync } = useVideoStream();
  const { findCategoryById, findChapterById, addToReview, markSignCompleted, markChapterCompleted, markCategoryCompleted, getChapterProgress } = useLearningData();

  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const [quizResults, setQuizResults] = useState<{ signId: string, correct: boolean, timeSpent: number }[]>([]);
  const QUIZ_TIME_LIMIT = 15; // 15초 제한
  const category = categoryId ? findChapterById(categoryId) : null;
  const [chapter, setChapter] = useState<Chapter | undefined | null>(null);
  //const [chapter, setChapter] = useState<any>(null);
  const currentSign = chapter?.signs[currentSignIndex];

  const transmissionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectTimer = useRef<NodeJS.Timeout | null>(null);
  const initialPose = useRef<boolean>(false);


  // 이 함수로, 사용자가 퀴즈 컨텐츠 (다? 레슨 단위?) 하고 백엔드에 결과 기록 요청한다.
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

  // 시간 초과 시 호출
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

  // 다음 수어(레슨)으로 넘어가는 내용
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

  // FeedbackDisplay 완료 콜백 함수
  const handleFeedbackComplete = () => {
    console.log('🎉 FeedbackDisplay 완료, 다음 수어로 이동');
    handleNextSign();
  };

    const handleRetry = () => {
      setFeedback(null);
      setIsRecording(false);
      setTimerActive(false);
      setQuizStarted(false);
      setCurrentResult(null); // 이전 분류 결과 초기화
      console.log('🔄 다시 시도:', currentSign?.word);
  };


  // 챕터 아이디를 통해 챕터 첫 준비
  // categoryID, chapterID
  useEffect(() => {
    if (chapterId) {
      const loadChapter = async () => {
        try {
          const chapterData = await findChapterById(chapterId);
          setChapter(chapterData);
        } catch (error) {
          console.error('챕터 데이터 로드 실패:', error);
        }
      };
      loadChapter();
    }
  }, [categoryId, chapterId]);


  
  // [단 한 번만 실행] 자동 연결 및 스트림 시작
  useEffect(() => {

    // 언마운트 루틴
    return () => {
      signClassifierClient.disconnect();
      stopStream();
      if (transmissionIntervalRef.current) {
        clearInterval(transmissionIntervalRef.current);
      }
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 연결 상태 변경 시 자동 재연결

  useEffect(() => {
    if (chapter) {
      setProgress((currentSignIndex / chapter.signs.length) * 100);
    }
  }, [currentSignIndex, chapter]);
  


  // 퀴즈 모드에서 새로운 문제가 시작될 때 자동으로 타이머 시작
  useEffect(() => {
    if (currentSign && !feedback) {
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
  }, [currentSignIndex, currentSign, feedback]);


  // // 렌더링 시점에 실행
  // // 이거 원문에도 내용이 없는데 뭐야?
  // if (connectionError) {
  //   return (
  //     <div>Connection Error. gogo home baby</div>
  //     // <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //     //   <Card className="max-w-md w-full mx-4">
  //     //     <CardHeader className="text-center">
  //     //       <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
  //     //       <CardTitle>연결 오류</CardTitle>
  //     //     </CardHeader>
  //     //     <CardContent className="text-center space-y-4">
  //     //       <p className="text-gray-600">{connectionErroMessage}</p>
  //     //       <Button
  //     //         onClick={() => window.location.reload()}
  //     //         className="bg-blue-600 hover:bg-blue-700"
  //     //       >
  //     //         <RefreshCw className="h-4 w-4 mr-2" />
  //     //         페이지 새로고침
  //     //       </Button>
  //     //       <Button
  //     //         variant="outline"
  //     //         onClick={() => navigate('/home')}
  //     //       >
  //     //         홈으로 돌아가기
  //     //       </Button>
  //     //     </CardContent>
  //     //   </Card>
  //     // </div>
  //   );
  // }


  // if (!chapter || !currentSign) {
  //   return (
  //    <NotFound/>);
  // }

  // // 여기는 완료 했을 때 표시된다 
  // if (sessionComplete) {
  //   const correctAnswers = quizResults.filter(r => r.correct).length;
  //   const totalQuestions = quizResults.length;

  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <Card className="max-w-md w-full mx-4">
  //         <CardHeader className="text-center">
  //           <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
  //           <CardTitle>
  //             {'퀴즈 완료!'}
  //           </CardTitle>
  //         </CardHeader>
  //         <CardContent className="text-center space-y-4">
  //           {(
  //             <div className="bg-blue-50 p-4 rounded-lg">
  //               <h3 className="font-semibold mb-2">결과</h3>
  //               <p className="text-2xl font-bold text-blue-600">
  //                 {correctAnswers}/{totalQuestions}
  //               </p>
  //               <p className="text-sm text-gray-600">
  //                 정답률: {Math.round((correctAnswers / totalQuestions) * 100)}%
  //               </p>
  //             </div>
  //           )}
  //           <p className="text-gray-600">
  //             '{chapter.title}' 퀴즈를 완료했습니다!
  //           </p>
  //           <div className="flex space-x-3">
  //             <Button
  //               variant="outline"
  //               onClick={async () => {
  //                 try {
  //                   await sendQuizResult();
  //                   navigate(`/learn/category/${categoryId}`);
  //                 } catch (error) {
  //                   console.error("결과 전송 실패:", error);
  //                   // 필요 시 에러 처리 추가 가능
  //                 }
  //               }}
  //             >
  //               챕터 목록
  //             </Button>
  //             <Button onClick={async () => {
  //               try {
  //                 await sendQuizResult();
  //                 navigate('/home');

  //               } catch (error) {
  //                 console.error("결과 전송 실패:", error);
  //                 // 필요 시 에러 처리 추가 가능
  //               }
  //             }}>
  //               홈으로
  //             </Button>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 손 감지 상태 표시 인디케이터 */}
      <HandDetectionIndicator
        isHandDetected={isHandDetected}
        isConnected={isConnected}
        isStreaming={state.isStreaming}
      />

      <SessionHeader
        isQuizMode={true}
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
            <div className="mb-6">
              <QuizTimer
                duration={QUIZ_TIME_LIMIT}
                onTimeUp={handleTimeUp}
                isActive={timerActive}
              />
            </div>
          
          {/* 퀴즈이기 때문에 시범을 안보여준다! */}
          <div className="grid lg:grid-cols-2 gap-12">
              {/* <QuizDisplay
                currentSign={currentSign}
                quizStarted={quizStarted}
                feedback={feedback}
                handleNextSign={handleNextSign}
              /> */}

            {/* 웹캠 및 분류 결과 */}
            <WebcamSection
              isQuizMode={true}
              isConnected={isConnected}
              isConnecting={isConnecting}
              isTransmitting={isTransmitting}
              state={state}
              videoRef={videoRef}
              canvasRef={canvasRef}
              currentResult={currentResult}
              connectionError={"just error"}
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

export default QuizSession;