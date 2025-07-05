import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, BookOpen, Star, Target, TrendingUp } from 'lucide-react';
import API from '@/components/AxiosInstance';

// 진도율 정보 타입
interface ProgressOverview {
  overall_progress: number;
  total_lessons: number;
  completed_chapters: number;
  total_chapters: number;
  categories: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    completed_chapters: number;
    total_chapters: number;
    completed_lessons: number;
    total_lessons: number;
    status: string;
  }>;
}

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProgressModal = ({ isOpen, onClose }: ProgressModalProps) => {
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchProgressOverview = async () => {
        try {
          setLoading(true);
          const response = await API.get<ProgressOverview>('/progress/overview');
          setProgressOverview(response.data);
        } catch (error) {
          setProgressOverview(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProgressOverview();
    }
  }, [isOpen]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-2">
              📊 학습 진도 현황
            </DialogTitle>
            <p className="text-center text-gray-600">데이터를 불러오는 중...</p>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!progressOverview) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-2">
              📊 학습 진도 현황
            </DialogTitle>
            <p className="text-center text-gray-600">데이터를 불러올 수 없습니다.</p>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">진도율 데이터를 가져오는데 실패했습니다.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const completedCategories = (progressOverview.categories ?? []).filter(cat => cat.status === 'completed').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2">
            📊 학습 진도 현황
          </DialogTitle>
          <p className="text-center text-gray-600">현재까지의 학습 성과를 확인해보세요</p>
        </DialogHeader>

        {/* 전체 통계 요약 */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">{progressOverview.overall_progress}%</div>
              <p className="text-purple-100">전체 진도율</p>
            </div>
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-blue-200 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">{progressOverview.completed_chapters}</div>
              <p className="text-purple-100">완료한 챕터</p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-green-200 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">{completedCategories}</div>
              <p className="text-purple-100">완료한 카테고리</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">전체 진행률</span>
              <span className="text-2xl font-bold">{progressOverview.overall_progress}%</span>
            </div>
            <Progress value={progressOverview.overall_progress} className="h-4 bg-purple-300/50" />
            <p className="text-purple-100 text-sm mt-2">
              {progressOverview.total_lessons}개 수어 중 {Math.round((progressOverview.overall_progress / 100) * progressOverview.total_lessons)}개 완료
              <br />
              {progressOverview.total_chapters}개 챕터 중 {progressOverview.completed_chapters}개 완료
            </p>
          </div>
        </div>

        {/* 카테고리별 상세 진도 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-bold text-gray-800 flex items-center">
              <Target className="h-6 w-6 mr-3 text-blue-600" />
              카테고리별 상세 진도
            </h4>
            <div className="text-sm text-gray-500">
              총 {(progressOverview.categories ?? []).length}개 카테고리
            </div>
          </div>
          {(progressOverview.categories ?? []).map((category) => (
            <div 
              key={category.id} 
              className={`bg-white border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm`}>
                    📚
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xl font-bold text-gray-800 mb-1">{category.name}</h5>
                    <p className="text-gray-600 mb-2">{category.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📚 {category.completed_chapters}/{category.total_chapters} 챕터</span>
                      <span>⏰ {category.status === 'completed' ? '완료됨' : category.status === 'in_progress' ? '진행중' : '시작 전'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold text-gray-700 mb-1`}>
                    {category.progress}%
                  </div>
                  {category.status === 'completed' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Trophy className="h-4 w-4 mr-1" />
                      완료!
                    </div>
                  )}
                  {category.status === 'in_progress' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      진행중
                    </div>
                  )}
                  {category.status === 'not_started' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      시작 전
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">진행률</span>
                  <span className="text-sm font-bold text-gray-800">{category.progress}%</span>
                </div>
                <Progress value={category.progress} className="h-3" />
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-gray-600">
                    다음 목표: {category.progress < 100 ? `${Math.min(category.progress + 20, 100)}% 달성` : '완료됨'}
                  </div>
                  <Button 
                    size="sm" 
                    className={`${category.status === 'not_started' ? 'bg-blue-600 hover:bg-blue-700' : 
                      category.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 
                      'bg-purple-600 hover:bg-purple-700'} hover:scale-105 transition-all`}
                    onClick={() => {
                      navigate(`/category/${category.id}/chapters`);
                      onClose();
                    }}
                  >
                    {category.status === 'not_started' ? '시작하기' : 
                     category.status === 'completed' ? '복습하기' : '계속하기'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 학습 동기부여 메시지 */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {progressOverview.overall_progress >= 80 ? '정말 대단해요!' : 
               progressOverview.overall_progress >= 50 ? '절반을 넘었네요!' : 
               '좋은 시작이에요!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {progressOverview.overall_progress >= 80 ? '거의 모든 과정을 완료하셨네요. 정말 훌륭합니다!' : 
               progressOverview.overall_progress >= 50 ? '벌써 절반 이상 완료하셨어요. 계속 화이팅!' : 
               '꾸준히 학습하시면 금세 실력이 늘 거예요!'}
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Button onClick={onClose} size="lg" className="px-12 hover:scale-105 transition-transform">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressModal;




