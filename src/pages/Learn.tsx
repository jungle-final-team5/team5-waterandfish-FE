import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const Learn = () => {
  const [animData, setAnimData] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const navigate = useNavigate();
  const { keyword } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [progress, setProgress] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true); // 자동 재생 활성화
  const [animationSpeed, setAnimationSpeed] = useState(30);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
    loadData();
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

    const loadData = async () => {
    try {
      // 첫 번째 JSON 파일만 로드
      const response = await fetch('/result/KETI_SL_0000000414_landmarks.json');
      const landmarkData = await response.json();
      setAnimData(landmarkData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  // 예시: 오늘의 추천 수어/검색결과 리스트 (실제 데이터는 props/context로 받을 수 있음)
  const exampleSigns = [
    { word: '안녕하세요', category: '일상 인사말' },
    { word: '감사합니다', category: '일상 인사말' },
    { word: '사랑해요', category: '감정 표현' },
    { word: '미안합니다', category: '일상 인사말' },
    { word: '잘 지내세요', category: '일상 인사말' },
  ];

  // 현재 keyword에 맞는 카테고리 찾기
  const selectedSign = exampleSigns.find(sign => sign.word === keyword);
  const category = selectedSign ? selectedSign.category : '기타';

  // 샘플 학습 데이터
  const learningData = {
    category: category,
    keyword: keyword,
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
                <h1 className="text-xl font-bold text-gray-800">{learningData.keyword}</h1>
                <p className="text-sm text-gray-600">{learningData.category}</p>
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
              
              <WebcamView isRecording={isRecording} />
              
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
              <FeedbackDisplay feedback={feedback} />
            </div>
          )}

          {/* Completion */}
          {currentStepData.type === 'complete' && (
            <div className="text-center py-12">
              <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">학습 완료!</h2>
              <p className="text-gray-600 mb-6">'{learningData.keyword}' 수어를 성공적으로 학습했습니다.</p>
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

      {/* 오늘의 추천 수어/검색결과 예시 리스트 */}
      <div className="max-w-2xl mx-auto mt-12">
        <h3 className="text-lg font-bold mb-4">오늘의 추천 수어 / 검색 결과</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {exampleSigns.map(sign => (
            <Button
              key={sign.word}
              variant="outline"
              onClick={() => navigate(`/learn/word/${encodeURIComponent(sign.word)}`)}
              className="h-auto p-3 hover:bg-violet-50 border-gray-200"
            >
              <div className="text-center">
                <div className="font-medium text-gray-800">{sign.word}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Learn;
