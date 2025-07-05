import { useParams, useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import WebcamView from '@/components/WebcamView';

const LearningGuide = () => {
  const { categoryId: paramCategoryId, chapterId, sessionType } = useParams();
  const navigate = useNavigate();
  const { getCategoryById, getChapterById, categories } = useLearningData();

  // categoryId가 없으면 categories에서 chapterId로 categoryId를 추출
  let categoryId = paramCategoryId;
  if (!categoryId && chapterId && categories.length > 0) {
    for (const cat of categories) {
      if (cat.chapters.some(chap => chap.id === chapterId)) {
        categoryId = cat.id;
        break;
      }
    }
  }

  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const chapter = (categoryId && chapterId) ? getChapterById(categoryId, chapterId) : undefined;

  if (!category || !chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/home')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const startLearning = () => {
    navigate(`/learn/chapter/${chapterId}`);
  };

  const goBack = () => {
    navigate(`/category/${categoryId}/chapters`);
  };

  const isQuiz = sessionType === 'quiz';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {isQuiz ? '퀴즈 시작 가이드' : '학습 시작 가이드'}
                </h1>
                <p className="text-sm text-gray-600">{category.title} - {chapter.title}</p>
              </div>
            </div>
            <Badge variant={isQuiz ? "secondary" : "default"} className="text-sm">
              {isQuiz ? '퀴즈 모드' : '학습 모드'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 가이드 정보 */}
          <div className="space-y-6">
            {/* 챕터 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                  {chapter.title} 안내
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {isQuiz 
                    ? `${chapter.title} 챕터에서 학습한 내용을 퀴즈로 확인해보세요. 총 ${chapter.signs.length}개의 수어 동작이 출제됩니다.`
                    : `${chapter.title} 챕터에서 ${chapter.signs.length}개의 수어 동작을 학습합니다. 각 동작을 천천히 따라하며 연습해보세요.`
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {chapter.signs.slice(0, 5).map((sign, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {sign.word}
                    </Badge>
                  ))}
                  {chapter.signs.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{chapter.signs.length - 5}개 더
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 학습 전 준비사항 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  {isQuiz ? '퀴즈 시작 전 준비사항' : '학습 시작 전 준비사항'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">카메라 준비</h4>
                      <p className="text-sm text-gray-600">
                        웹캠과 적정 거리(약 1-1.5m)를 유지하세요. 상체가 모두 보이도록 위치를 조정해주세요.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">조용한 환경</h4>
                      <p className="text-sm text-gray-600">
                        정확한 인식을 위해 주변에 다른 사람이 없는 공간에서 진행해주세요.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">충분한 조명</h4>
                      <p className="text-sm text-gray-600">
                        손의 움직임이 선명하게 보일 수 있도록 충분한 조명을 확보해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 학습 팁 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  {isQuiz ? '퀴즈 진행 팁' : '학습 진행 팁'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  {isQuiz ? (
                    <>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        시간 제한이 있으니 미리 동작을 연습해두세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        정확한 동작이 중요합니다. 천천히 정확하게 해주세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        틀린 문제는 자동으로 복습 목록에 추가됩니다
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        동작을 천천히 따라하며 자연스럽게 익혀보세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        어려운 동작은 반복 연습을 통해 익숙해질 수 있습니다
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        설명 기능을 활용해 동작의 의미를 이해해보세요
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 웹캠 미리보기 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>카메라 미리보기</CardTitle>
                <p className="text-sm text-gray-600">
                  현재 카메라 화면을 확인하고 위치를 조정해보세요
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <WebcamView />
              </CardContent>
            </Card>

            {/* 시작 버튼 */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    {isQuiz 
                      ? '모든 준비가 완료되었다면 퀴즈를 시작해보세요!'
                      : '모든 준비가 완료되었다면 학습을 시작해보세요!'
                    }
                  </p>
                  <Button 
                    onClick={startLearning} 
                    size="lg" 
                    className="w-full"
                  >
                    {isQuiz ? '퀴즈 시작하기' : '학습 시작하기'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningGuide;