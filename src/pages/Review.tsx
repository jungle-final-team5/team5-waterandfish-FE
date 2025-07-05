import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Trash2, Play } from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import { useEffect, useState } from 'react';
import API from '@/components/AxiosInstance';
import { Lesson } from '@/types/learning';


const Review = () => {
  const navigate = useNavigate();
  const [reviewSigns, setReviewSigns] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const username = "zxcv";
  useEffect(() => {
    if (!username) return;

    async function fetchFailedLessons() {
      setLoading(true);
      setError(null);

      try {
        const res = await API.get(`/progress/lessons/failures/${username}`);
        console.log("응답 데이터:", res.data);
        setReviewSigns(res.data as Lesson[]);
      } catch (err: unknown) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFailedLessons();
  }, [username]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
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
              <h1 className="text-xl font-bold text-gray-800">복습하기</h1>
              <p className="text-sm text-gray-600">틀렸던 수어들을 다시 연습해보세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {reviewSigns.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">복습할 내용이 없습니다</h2>
            <p className="text-gray-500 mb-6">퀴즈에서 틀린 문제들이 여기에 표시됩니다.</p>
            <Button onClick={() => navigate('/learn')}>
              학습하러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                복습 목록 ({reviewSigns.length}개)
              </h2>
              <Button 
                variant="outline" 
                // onClick={() => {
                //   reviewSigns.forEach(sign => removeFromReview(sign.id));
                // }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                모두 삭제
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewSigns.map((sign) => (
                <Card key={sign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{sign.word}</CardTitle>
                    <p className="text-sm text-gray-600">
                      카테고리: {sign.category}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/learn/${sign.word}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        연습하기
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        // onClick={() => removeFromReview(sign.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Review;
