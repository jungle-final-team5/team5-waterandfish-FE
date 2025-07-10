import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Camera, 
  CheckCircle, 
  XCircle,
  BookOpen
} from 'lucide-react';
import WebcamView from '@/components/WebcamView';
import ExampleAnim from '@/components/ExampleAnim';
import FeedbackDisplay from '@/components/FeedbackDisplay';
import API from "@/components/AxiosInstance";
import { useLearningData } from '@/hooks/useLearningData';
import { Lesson } from '@/types/learning';
import { Hands } from '@mediapipe/hands';
import VideoInput from '@/components/VideoInput';

interface LessonApiResponse {
  success: boolean;
  data: Lesson;
  message?: string;
}

type ApiSign = Lesson & { sign_text: string };

const Learn = () => {

  const [animData, setAnimData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const navigate = useNavigate();
  const { wordId } = useParams();
  const decodedWord = wordId ? decodeURIComponent(wordId) : '';

  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [progress, setProgress] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true); // 자동 재생 활성화
  const [animationSpeed, setAnimationSpeed] = useState(30);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { categories } = useLearningData();

  const [fetchedSign, setFetchedSign] = useState<Lesson | undefined>(undefined);

  const normalize = (str: string) => str ? str.normalize('NFC').trim().toLowerCase() : '';

  // 모든 수어(flatten)
  const allSigns = (categories ?? [])
    .flatMap(cat =>
      (cat.chapters ?? []).flatMap(chap =>
        (chap.lessons ?? []).map(sign => ({
          ...sign,
          categoryTitle: cat.title,
          categoryId: cat.id
        }) as Lesson & { categoryTitle: string; categoryId: string })
      )
    );

  // word로 수어 찾기
  const selectedSign = allSigns.find(
    sign => sign.word && normalize(sign.word) === normalize(decodedWord)
  );

  const signToShow = selectedSign;

  // 추천 수어/검색결과 리스트 (실제 데이터 기반, 최대 6개)
  const exampleSigns = allSigns.slice(0, 6);

  const loadAnim = async () => {
    try {
      const id = "686269ddcba901ab2b745002";
      const response = await API.get(`/anim/${id}`);
      setAnimData(response.data);
    } catch (error) {
      console.error('애니메이션 불러오는데 실패했습니다 : ', error);
    }
  };

  useEffect(() => {
    loadAnim();
  }, []);

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

  useEffect(() => {
    console.log('allSigns:', allSigns);
    console.log('decodedWord:', decodedWord);
    console.log('selectedSign:', selectedSign);
  }, [allSigns, decodedWord, selectedSign]);

  // 샘플 학습 데이터
  const learningData = {
    keyword: signToShow?.word ?? wordId,
    steps: [
      {
        title: '예시 보기',
        description: '정확한 수어 동작을 확인해보세요',
        type: 'example'
      },
      {
        title: '따라하기',
        description: '웹캠을 보며 수어를 따라해보세요',
        type: 'practice'
      },
      {
        title: '완료',
        description: '학습을 완료했습니다!',
        type: 'complete'
      }
    ]
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setFeedback(null);
    
    // 3초 후 랜덤 피드백 (실제로는 ML 모델 결과)
    setTimeout(() => {
      const isCorrect = Math.random() > 0.3;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      setIsRecording(false);
      
      if (isCorrect && currentStep < learningData.steps.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setProgress(((currentStep + 1) / learningData.steps.length) * 100);
        }, 2000);
      }
    }, 3000);
  };

  const handleNextStep = () => {
    if (currentStep < learningData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / learningData.steps.length) * 100);
      setFeedback(null);
    }
  };

  const DEBUG_FEEDBACK_OFF = () => {
       setFeedback(null);
  };

  const handleRetry = () => {
    setFeedback(null);
    setIsRecording(false);
  };

  const currentStepData = learningData.steps[currentStep];

  useEffect(() => {
    if (currentStepData.type === 'complete') {
      API.post('/user/daily-activity/complete')
        .then(() => {
          console.log("오늘 활동 기록 완료!");
        })
        .catch((err) => {
          console.error("오늘 활동 기록 실패:", err);
        });
    }
    // eslint-disable-next-line
  }, [currentStepData.type]);

  if (!categories || categories.length === 0) {
    return <div className="text-center mt-10">수어 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-xl font-bold text-gray-800">{signToShow?.word ?? decodedWord ?? ''}</h1>
                {/* <p className="text-sm text-gray-600">{category}</p> */}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {currentStep + 1} / {learningData.steps.length}
              </div>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {learningData.steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === currentStep ? 'bg-blue-600 text-white' :
                    index < currentStep ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < learningData.steps.length - 1 && (
                    <div className={`w-16 h-1 ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>{currentStepData.title}</span>
              </CardTitle>
              <p className="text-gray-600">{currentStepData.description}</p>
            </CardHeader>
          </Card>

          {/* Learning Interface */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Example Video Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">수어 예시</h3>
                <ExampleAnim data={animData} currentFrame={currentFrame} showCylinders={true} showLeftHand={true} showRightHand={true}/>
              {currentStepData.type === 'example' && (
                <div className="flex justify-center">
                  <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                    이해했어요, 다음 단계로
                  </Button>
                </div>
              )}
            </div>

            {/* Practice Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentStepData.type === 'practice' ? '따라하기' : '웹캠 미리보기'}
              </h3>
              
             <VideoInput
              width={640}
              height={480}
              autoStart={false}
              showControls={true}
              onStreamReady={null}
              onStreamError={null}
              className="h-full"
              currentSign={null}
              currentResult={null}
            />
              
              {currentStepData.type === 'practice' && (
                <div className="flex justify-center space-x-4">
                  {!isRecording && !feedback && (
                    <Button 
                      onClick={handleStartRecording}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      시작하기
                    </Button>
                  )}
                  
                  {isRecording && (
                    <Button disabled className="bg-red-600">
                      <div className="animate-pulse flex items-center">
                        <div className="w-3 h-3 bg-white rounded-full mr-2" />
                        인식 중...
                      </div>
                    </Button>
                  )}
                  
                  {feedback && (
                    <div className="flex space-x-2">
                      <Button onClick={handleRetry} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        다시 시도
                      </Button>
                      {feedback === 'correct' && currentStep < learningData.steps.length - 1 && (
                        <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-700">
                          다음 단계
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Display */}
          {feedback && (
            <div className="mt-8">
              <FeedbackDisplay feedback={feedback} prediction={"none"} onComplete={DEBUG_FEEDBACK_OFF} />
            </div>
          )}

          {/* Completion */}
          {currentStepData.type === 'complete' && (
            <div className="text-center py-12">
              <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">학습 완료!</h2>
              <p className="text-gray-600 mb-6">'{signToShow?.word ?? wordId}' 수어를 성공적으로 학습했습니다.</p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/home')} variant="outline">
                  홈으로 돌아가기
                </Button>
                <Button onClick={() => navigate('/category')} className="bg-blue-600 hover:bg-blue-700">
                  다른 학습하기
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Learn;
