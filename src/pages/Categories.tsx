import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api';
import { Category } from '@/types/learning';

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const isCompleted = useRef(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiClient.learning.getCategories();
        console.log("응답 데이터:", response.data);
        
        // 데이터가 배열인지 확인
        if (Array.isArray(response.data)) {
          setCategories(response.data as Category[]);
        } else if (response.data && typeof response.data === 'object') {
          // 중첩된 구조인 경우: {categories: Array(4), total: 4}
          const dataObj = response.data as any;
          if (Array.isArray(dataObj.categories)) {
            console.log("카테고리 배열:", dataObj.categories);
            setCategories(dataObj.categories as Category[]);
          } else {
            console.error('예상치 못한 데이터 구조:', response.data);
            setCategories([]);
          }
        } else {
          console.error('예상치 못한 데이터 구조:', response.data);
          setCategories([]);
        }
      } catch (err: any) {
        console.error('카테고리 불러오기 실패:', err);
        setCategories([]);
        if (err.response) {
          console.error('서버 응답 에러:', err.response.status, err.response.data);
        } else if (err.request) {
          console.error('요청은 전송됐지만 응답 없음:', err.request);
        } else {
          console.error('요청 설정 에러:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const startCategoryProgress = async (categoryId: string, path: string) => {
    alert('startCategoryProgress');
    try {
      // 새로운 API 엔드포인트 사용 (백엔드에서 해당 엔드포인트 확인 필요)
      // await apiClient.learning.updateProgress(categoryId, { status: 'started' });
      navigate(path);
    } catch (err) {
      console.error("프로그레스 초기화 실패:", err);
      alert("학습을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 배열인지 확인하고 안전하게 정렬
  const sortedCategories = Array.isArray(categories) 
    ? categories.slice().sort((a, b) => {
        // 안전한 속성 접근
        const orderA = (a as any).order_index || (a as any).order || 0;
        const orderB = (b as any).order_index || (b as any).order || 0;
        if (orderA !== orderB) return orderA - orderB;
        
        // title이 없을 경우를 대비해 안전하게 처리
        const titleA = a.title || (a as any).name || '';
        const titleB = b.title || (b as any).name || '';
        return titleA.localeCompare(titleB);
      })
    : [];

  console.log("정렬된 카테고리:", sortedCategories);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">카테고리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-800">학습 카테고리</h1>
              <p className="text-sm text-gray-600">배우고 싶은 주제를 선택하세요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">카테고리가 없습니다</h3>
            <p className="text-gray-500">아직 학습할 수 있는 카테고리가 준비되지 않았습니다.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCategories.map((category) => {
              return (
                <Card 
                  key={category.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => startCategoryProgress(category.id, `/learn/category/${category.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {category.icon && <span className="text-3xl">{category.icon}</span>}
                        <span>{category.title}</span>
                      </div>
                      {/* {isCompleted && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          완료
                        </Badge>
                      )} */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    
                    {/* 진도 표시 (향후 구현) */}
                    {/* <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">진도</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {categoryProgress.completed}/{categoryProgress.total} ({categoryProgress.percentage}%)
                        </span>
                      </div>
                      <Progress value={categoryProgress.percentage} className="h-2" />
                    </div> */}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {category.chapters?.length || 0}개 챕터
                      </span>
                      <Button size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {isCompleted.current ? '복습하기' : '시작하기'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Categories;