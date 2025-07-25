import React, { useRef, useLayoutEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Users,
  Volume2,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import WebcamView from '@/components/WebcamView';
import VideoInput from '@/components/PlayerWindow';
import { useGlobalWebSocketStatus } from '@/contexts/GlobalWebSocketContext';
import WebcamPreview from '@/components/WebcamPreview';

const SessionBegin = () => {
  const { chapterId: paramChapterId, modeNum: num } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useLearningData();
  const chapterId = paramChapterId;
  const modeNum = num ? parseInt(num, 10) : undefined;

  // URL state에서 lesson_mapper 가져오기
  const lesson_mapper = location.state?.lesson_mapper || {};
  const { connectedCount, totalCount } = useGlobalWebSocketStatus();

  // 캠/학습팁 높이 동기화용 훅 (최상단에서 선언)
  const [leftTopHeight, setLeftTopHeight] = useState<number | undefined>(undefined);
  const leftTopRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    function updateHeight() {
      if (leftTopRef.current) {
        setLeftTopHeight(leftTopRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 서버 상태 카드 높이 동기화용 훅
  const [serverCardHeight, setServerCardHeight] = useState<number | undefined>(undefined);
  const serverCardRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    function updateHeight() {
      if (serverCardRef.current) {
        setServerCardHeight(serverCardRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  console.log('chapterId', chapterId);
  if (!chapterId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/home')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (location.state && location.state.origin) {
      navigate(location.state.origin);
    } else {
      navigate('/category');
    }
  };

  // (배움/퀴즈) 페이지로 이동하여 해당하는 챕터의 (배움/퀴즈) 컨텐츠 시작
  const startContents = () => {
    if (modeNum === 1) {
      navigate(`/learn/chapter/${chapterId}`, { state: { lesson_mapper } });
    }
    else if (modeNum === 2) {
      navigate(`/quiz/chapter/${chapterId}`, { state: { lesson_mapper } });
    }
    else {
      navigate(`/review/chapter/${chapterId}`, { state: { lesson_mapper } });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col ">
      <header className="bg-white shadow-sm border-b ">
        <div className="w-full px-4 py-4 ">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/home`)}
              className="hover:bg-blue-50 text-base sm:text-lg lg:text-xl"
            >
              <ArrowLeft className="h-1 w-1 mr-2" />
              뒤로
            </Button>
          </div>
        </div>
      </header >

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full ">

          {/* 가이드 정보 (왼쪽) */}
          <div className="flex flex-col pr-2 h-full space-y-4">

            {/* 학습 전 준비사항 */}
            <Card className="flex-1 border border-gray-300 rounded-xl  flex flex-col">
              <CardHeader className="">
                <CardTitle className="items-center text-base sm:text-lg lg:text-xl">
                  <AlertCircle className="h-6 w-6 mr-2 text-orange-600" />
                  {modeNum === 1 && ('학습 시작 전 준비사항')}
                  {modeNum === 2 && ('퀴즈 시작 전 준비사항')}
                  {modeNum === 3 && ('복습 시작 전 준비사항')}
                </CardTitle>
              </CardHeader>
              <CardContent className=" flex flex-col flex-1">
                <div className=" flex flex-col h-full">
                  <div className="flex items-start space-x-4">
                    <Camera className="h-6 w-6 text-blue-600 mt-1 animate-pulse" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900">카메라 준비</h4>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        카메라와 눈높이가 비슷하게 위치해야 합니다. 손을 무릎에 올렸을 때 카메라에 보이지 않도록 준비해주세요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 ">
                    <User className="h-6 w-6 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900">화면에 다른 사람이 보이지 않는 공간</h4>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        정확한 인식을 위해 주변에 다른 사람이 보이지 않는 공간에서 진행해주세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Lightbulb className="h-6 w-6 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900">충분한 조명</h4>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        손의 움직임이 선명하게 보일 수 있도록 충분한 조명을 확보해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 학습 팁 */}
            <Card className="flex-1 border border-gray-300 rounded-xl  flex flex-col ">
              <CardHeader className="">
                <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl ">
                  <span className="mr-2 text-xl sm:text-2xl" role="img" aria-label="sparkles">✨</span>
                  학습 팁
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 ">
                <ul className="space-y-2 text-sm sm:text-base lg:text-lg text-gray-700  h-full">
                  {modeNum === 1 && (
                    <>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        동작을 천천히 따라하며 자연스럽게 익혀보세요
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        어려운 동작은 반복 연습을 통해 익숙해질 수 있습니다
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        수어 동작은 무릎에서 시작하고 무릎에서 끝나야 합니다.
                      </li>
                    </>
                  )}
                  {modeNum === 2 && (
                    <>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></span>
                        시간 제한이 있으니 미리 동작을 연습해두세요
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></span>
                        정확한 동작이 중요합니다. 천천히 정확하게 해주세요
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></span>
                        수어 동작은 무릎에서 시작하고 무릎에서 끝나야 합니다.
                      </li>
                    </>
                  )}
                  {modeNum === 3 && (
                    <>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        ULTIMATE SIGN LANGUAGE PLAYER가 되기 위해
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        복습을 하다니 정말 의지가 뚜렷한 모습이 있어 보기 좋습니다
                      </li>
                      <li className="flex items-start text-sm sm:text-base lg:text-lg">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                        죄송해요 말밖에 할게 없네요 해브어 굿 데이
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* 수어 분류 서버 연결 상태 안내 - 왼쪽 컬럼 마지막 */}
            <Card className="border border-gray-300 rounded-xl ">
              <CardContent className="py-6 px-4">
                <div className="text-center space-y-4">
                  {connectedCount !== totalCount && (
                    <>
                      <div className="flex items-center justify-center mb-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        수어 분류 서버에 연결중입니다
                      </p>
                    </>
                  )}
                  {connectedCount === totalCount && (
                    <>
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        수어 분류 서버에 연결되었습니다
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 캠 프리뷰 + 세션 시작 버튼 */}
          <div className="flex flex-col h-full w-full">
            <div className="flex-1 border border-gray-300 rounded-xl overflow-hidden w-full mb-4">
              <WebcamPreview width={704} height={528} />
            </div>
            <Button
              disabled={connectedCount !== totalCount}
              onClick={startContents}
              size="lg"
              className="w-full h-24 border border-gray-300 rounded-xl flex justify-center text-2xl sm:text-3xl lg:text-4xl font-bold bg-indigo-900 hover:bg-black text-white transition-colors"
            >
              세션 시작
              <ArrowRight className="h-6 w-6 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionBegin;