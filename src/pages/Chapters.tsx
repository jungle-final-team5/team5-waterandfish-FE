import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, MessageSquare, Play, CheckCircle, RotateCcw } from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import { useEffect, useRef, useState } from 'react';
import {Lesson,Chapter,Category} from '../types/learning';
import { useBadgeSystem } from '@/hooks/useBadgeSystem';
import API from '@/components/AxiosInstance';

// 챕터별 상태 계산 함수
function getChapterStatus(chapter: Chapter) {
  // TODO: 실제 status 계산 로직이 필요하다면 signs의 다른 필드나 별도 상태 관리 필요
  return 'not_started';
}

const Chapters = () => {
  const { checkBadges } = useBadgeSystem();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const updateRecentLearning = async (lessonIds: string[]) => {
    try {
      await API.post('/review/mark-reviewed', { lesson_ids: lessonIds });
    } catch (err) {
      console.error('최근학습 이벤트 기록 실패:', err);
    }
  };
  // 챕터 학습/퀴즈 시작 시 최근 학습 반영 (user_id를 body에 포함)
  const handleStartChapter = async (chapterId: string, lessonIds: string[], path: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id;
      await API.post('/progress/lessons/events', { user_id: userId, lesson_ids: lessonIds });
      navigate(path);
    } catch (err) {
      console.error('최근학습 이벤트 기록 실패:', err);
      navigate(path); // 실패해도 이동
    }
  };
  useEffect(() => {
    if (!categoryId) return;
    API.get<{ success: boolean; data: Category; message: string }>(`/category/${categoryId}/chapters`)
      .then(res => setCategoryData(res.data.data))
      .catch(err => console.error('카테고리 정보 불러오기 실패:', err));
  }, [categoryId]);
  const isCompleted = useRef(false);
  if (!categoryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">카테고리를 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/category')}>돌아가기</Button>
        </div>
      </div>
    );
  }

  const sortedChapters = (categoryData.chapters as Chapter[]).slice();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/category')}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              카테고리로
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {/* {category.icon}  */}
                {categoryData.title}
              </h1>
              <p className="text-sm text-gray-600">{categoryData.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {sortedChapters.map((chapter, index) => {
            const lessonIds = (chapter.signs || []).map((lesson: Lesson) => lesson.id);
            const chapterStatus = getChapterStatus(chapter);
            return (
              <Card key={chapter.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {chapter.type === 'word' ? (
                        <FileText className="h-6 w-6 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-6 w-6 text-green-600" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>챕터 {index + 1}: {chapter.title}</span>
                          {chapterStatus === 'reviewed' && (
                            <Badge className="bg-green-500 text-white text-xs flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              완료
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-normal text-gray-600">
                          {chapter.type === 'word' ? '단어' : '문장'} • {chapter.signs.length}개 수어
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 진도 표시 */}
                  {/* <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">학습 진도</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {chapterProgress.completed}/{chapterProgress.total} ({chapterProgress.percentage}%)
                      </span>
                    </div>
                    <Progress value={chapterProgress.percentage} className="h-2" />
                  </div> */}

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {chapter.signs.map((lesson) => (
                      <div 
                        key={lesson.id}
                        className="text-center p-2 bg-gray-100 rounded text-sm"
                      >
                        {lesson.word}
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-3 items-center">
                    <Button
                      onClick={() => handleStartChapter(
                        chapter.id,
                        lessonIds,
                        `/learn/chapter/${chapter.id}/guide`
                      )}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      학습하기
                    </Button>
                    {(chapterStatus === 'study' || chapterStatus === 'quiz_wrong' || chapterStatus === 'reviewed') && (
                      <Button
                        variant="outline"
                        onClick={() => handleStartChapter(
                          chapter.id,
                          lessonIds,
                          `/learn/chapter/${chapter.id}/guide`
                        )}
                      >
                        퀴즈 풀기
                      </Button>
                    )}
                    {chapterStatus === 'quiz_wrong' && (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          await updateRecentLearning(lessonIds);
                          navigate(`/learn/guide/${categoryId}/${chapter.id}/learning`);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        복습하기
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Chapters;