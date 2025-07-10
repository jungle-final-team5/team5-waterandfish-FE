import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Search, 
  RotateCcw, 
  Trophy, 
  Calendar,
  Target,
  User,
  LogOut,
  Bell
} from 'lucide-react';
import BadgeModal from '@/components/BadgeModal';
import StreakModal from '@/components/StreakModal';
import ProgressModal from '@/components/ProgressModal';
import HandPreferenceModal from '@/components/HandPreferenceModal';
import OnboardingTour from '@/components/OnboardingTour';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { useToast } from '@/hooks/use-toast';
import { useLearningData } from '@/hooks/useLearningData';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { useOnboarding } from '@/hooks/useOnboarding';
import API from '@/components/AxiosInstance';
import { useStreakData } from "@/hooks/useStreakData";
import { useBadgeSystem } from '@/hooks/useBadgeSystem';
import { useAuth } from '@/hooks/useAuth';

// 최근 학습 정보 타입
interface RecentLearning {
  category: string | null;
  chapter: string | null;
}

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
    completed_lessons: number;
    total_lessons: number;
    status: string;
  }>;
}

interface RecommendedSign {
  word: string;
  description?: string;
  videoUrl?: string;
  category?: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, categoriesLoading } = useLearningData();
  const { showStreakAchievement } = useNotifications();
  const { unreadCount } = useNotificationHistory();
  const { checkBadges } = useBadgeSystem();
    const { isOnboardingActive, currentStep, nextStep, previousStep, skipOnboarding, completeOnboarding } = useOnboarding();
  const { currentStreak } = useStreakData();
  const { logout } = useAuth();
  
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isHandPreferenceModalOpen, setIsHandPreferenceModalOpen] = useState(false);
  const [nickname, setNickname] = useState<string>('학습자');
  
  // 진도율 상태 추가
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // 첫 방문 확인 및 손 선호도 모달 표시
  useEffect(() => {
    const hasSetHandPreference = localStorage.getItem('hasSetHandPreference');
    if (!hasSetHandPreference) {
      setIsHandPreferenceModalOpen(true);
    }
  }, []);

  // 추천 수어 상태 추가
  const [recommendedSign, setRecommendedSign] = useState<RecommendedSign | null>(null);

  const [recentLearning, setRecentLearning] = useState<RecentLearning | null>(null);

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) setNickname(storedNickname);
    API.get<{ success: boolean; data: RecentLearning; message: string }>('/progress/recent-learning')
      .then(res => {
        if (res.data.data && res.data.data.category && res.data.data.chapter) {
          setRecentLearning(res.data.data);
        } else {
          setRecentLearning(null);
        }
      })
      .catch(() => setRecentLearning(null));
  }, []);

  // 진도율 데이터 가져오기
  useEffect(() => {
    const fetchProgressOverview = async () => {
      try {
        setProgressLoading(true);
        const response = await API.get<{ success: boolean; data: ProgressOverview; message: string }>('/progress/overview');
        setProgressOverview(response.data.data);
      } catch (error) {
        console.error('진도율 데이터 가져오기 실패:', error);
        setProgressOverview(null);
      } finally {
        setProgressLoading(false);
      }
    };
    fetchProgressOverview();
  }, []);

  useEffect(() => {
    const fetchDailySign = async () => {
      try {
        const res = await API.get<{ success: boolean; data: { lessons: RecommendedSign[] } }>(
          '/recommendations/daily-sign'
        );
        if (res.data.success && res.data.data && Array.isArray(res.data.data.lessons) && res.data.data.lessons.length > 0) {
          setRecommendedSign(res.data.data.lessons[0]);
        } else {
          setRecommendedSign(null);
        }
      } catch (e) {
        setRecommendedSign(null);
      }
    };
    fetchDailySign();
  }, []);

  // 자음/모음만 있는지 판별하는 함수
  function isletterOnly(text: string) {
    return /^[\u3131-\u314E\u314F-\u3163]+$/.test(text);
  }

  // 오늘 날짜 기반 seed 생성 (KST 기준)
  function getTodaySeed() {
    const now = new Date();
    // KST는 UTC+9
    now.setHours(now.getHours() + 9);
    return now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  }

  // seed 기반 랜덤 인덱스 생성
  function seededRandom(seed: string, max: number) {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    }
    return Math.abs(hash) % max;
  }

  // 전체 진도율 (API에서 가져온 데이터 사용)
  const overallProgress = progressOverview?.overall_progress || 0;

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'recent':
        navigate('/category');
        break;
      case 'streak':
        setIsStreakModalOpen(true);
        break;
      case 'badges':
        setIsBadgeModalOpen(true);
        break;
      case 'progress':
        setIsProgressModalOpen(true);
        break;
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 로그아웃 시도...');
      // 백엔드 로그아웃 API 호출 (쿠키 삭제)
      const response = await API.post('auth/logout');
      console.log('✅ 로그아웃 API 성공:', response.data);
    } catch (error) {
      console.error('❌ 로그아웃 API 호출 실패:', error);
      // API 실패해도 프론트엔드에서는 로그아웃 처리
    }
    // 인증 상태 초기화
    logout();
    // localStorage 클리어
    localStorage.clear();
    console.log('localStorage 클리어 완료');
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    navigate('/');
  };

  const currentTime = new Date().getHours();
  const getGreeting = () => {
    if (currentTime < 12) return '좋은 아침입니다';
    if (currentTime < 18) return '좋은 오후입니다';
    return '좋은 저녁입니다';
  };

  // handedness가 없을 때만 온보딩 투어 표시
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setShouldShowOnboarding(user.handedness === null || user.handedness === undefined || user.handedness === "");
      } catch {
        setShouldShowOnboarding(false);
      }
    } else {
      setShouldShowOnboarding(false);
    }
  }, [isOnboardingActive]);

  // 뱃지 개수 상태 추가
  const [badgeCount, setBadgeCount] = useState<number>(0);

  // 뱃지 개수 불러오기
  useEffect(() => {
    const fetchBadgeCount = async () => {
      try {
        const res = await API.get('/badge/earned');
        setBadgeCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch (e) {
        setBadgeCount(0);
      }
    };
    fetchBadgeCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/100 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br bg-violet-300 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🐟</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-violet-600">
                  수어지교
                </span>
                <div className="text-xs text-gray-500 mt-0.5">인터렉티브 수어 학습 플랫폼</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationDrawer>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-blue-50 transition-colors relative"
                  data-tour="notification-button"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  알림
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </NotificationDrawer>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/profile')}
                className="hover:bg-blue-50 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                마이페이지
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="hover:bg-red-50 text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-violet-600 mb-3">

            {getGreeting()}, {nickname}님! 👋

          </h1>
          <p className="text-gray-600 text-lg">오늘도 수어 학습을 시작해볼까요?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Button
            onClick={() => navigate('/search')}
            className="h-28 bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 flex-col space-y-3 transform hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg"
          >
            <Search className="h-10 w-10" />
            <div>
              <span className="text-xl font-semibold">수어 검색</span>
              <div className="text-blue-100 text-sm mt-1">원하는 수어를 찾아보세요</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/category')}
            variant="outline"
            className="h-28 hover:bg-violet-50 border-2 border-violet-200 hover:border-violet-300 flex-col space-y-3 transform hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg"
          >
            <BookOpen className="h-10 w-10 text-violet-600" />
            <div>
              <span className="text-xl font-semibold text-violet-700">학습하기</span>
              <div className="text-violet-600 text-sm mt-1">새로운 수어를 배워보세요</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/review')}
            variant="outline"
            className="h-28 hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-300 flex-col space-y-3 transform hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg"
            data-tour="review-button"
          >
            <RotateCcw className="h-10 w-10 text-purple-600" />
            <div>
              <span className="text-xl font-semibold text-purple-700">복습하기</span>
              <div className="text-purple-600 text-sm mt-1">학습한 내용을 복습해보세요</div>
            </div>
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* 최근 학습 */}
          <div 
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group border border-blue-100"
            onClick={() => {
              if (recentLearning && recentLearning.chapter) {
                navigate(`/learn/chapter/${encodeURIComponent(recentLearning.chapter)}/guide`);
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">최근 학습</h3>
              <BookOpen className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            {recentLearning && recentLearning.category && recentLearning.chapter ? (
              <>
                <p className="text-sm text-gray-600 mb-2">{recentLearning.category}</p>
                <p className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{recentLearning.chapter}</p>
                <div className="mt-4 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  클릭해서 계속 학습하기 →
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-6">최근 학습 기록이 없습니다</p>
            )}
          </div>

          {/* 연속 학습 */}
          <div 
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group border border-green-100"
            onClick={() => handleCardClick('streak')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">연속 학습</h3>
              <Calendar className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600 mb-2">연속 학습 일수</p>
            <p className="text-3xl font-bold text-green-600 group-hover:animate-pulse">{currentStreak}일 🔥</p>
            <div className="mt-4 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
              달력에서 학습 기록 확인하기 →
            </div>
          </div>

          {/* 획득 뱃지 */}
          <div 
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group border border-yellow-100"
            onClick={() => handleCardClick('badges')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-yellow-600 transition-colors">획득한 뱃지</h3>
              <Trophy className="h-6 w-6 text-yellow-600 group-hover:scale-110 group-hover:rotate-12 transition-all" />
            </div>
            <p className="text-sm text-gray-600 mb-2">총 뱃지 개수</p>
            <p className="text-3xl font-bold text-yellow-600 group-hover:animate-bounce">{badgeCount}개 🏆</p>
            <div className="mt-4 text-xs text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">
              새로운 뱃지를 획득해보세요! →
            </div>
          </div>

          {/* 전체 진도율 */}
          <div 
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group border border-purple-100"
            onClick={() => handleCardClick('progress')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">전체 진도율</h3>
              <Target className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600 mb-2">전체 과정</p>
            {progressLoading ? (
              <div className="flex items-center space-x-3">
                <div className="text-3xl font-bold text-purple-600 animate-pulse">...</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <p className="text-3xl font-bold text-purple-600">{progressOverview?.overall_progress || 0}%</p>
                <div className="flex-1 bg-gray-200 rounded-full h-3 group-hover:bg-purple-100 transition-colors">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full group-hover:animate-pulse transition-all duration-500" 
                    style={{ width: `${progressOverview?.overall_progress || 0}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div className="mt-4 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {progressOverview ? `${progressOverview.completed_chapters}/${progressOverview.total_chapters} 챕터 완료` : '진도율을 확인해보세요! →'}
            </div>
          </div>
        </div>

        {/* Enhanced Today's Sentence */}
        <div className="bg-violet-600 rounded-2xl p-8 text-white mb-10 hover:bg-violet-700 transition-all duration-300 transform hover:scale-[1.02] shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-3 flex items-center">
                ✨ 오늘의 추천 수어
              </h3>

              <p className="text-3xl font-bold mb-4">
                {recommendedSign ? `"${String(recommendedSign.word)}"` : '...'}
              </p>
              <p className="text-blue-100 mb-6">
                {recommendedSign && recommendedSign.category && typeof recommendedSign.category === 'object' && recommendedSign.category !== null && 'name' in recommendedSign.category
                  ? String((recommendedSign.category as { name?: unknown }).name ?? '랜덤 추천 수어를 배워보세요')
                  : '랜덤 추천 수어를 배워보세요'}
              </p>

            </div>
          </div>
          <Button 
            variant="secondary"
            onClick={() => {
              if (recommendedSign && recommendedSign.id) {
                navigate(`/learn/${recommendedSign.id}`);
              } else if (recommendedSign && recommendedSign.word) {
                // 임시로 word 기반으로 이동 (기존 방식 유지)
                navigate(`/learn/word/${encodeURIComponent(recommendedSign.word)}`);
              } else {
                alert('추천 수어 정보가 없습니다.');
              }
            }}
            className="bg-white/90 hover:bg-white/100 border-white/90 hover:scale-105 transition-all duration-200 backdrop-blur-sm"
            disabled={!recommendedSign}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            지금 배우기
          </Button>
        </div>

        {/* Enhanced Recommended Learning */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Target className="h-6 w-6 mr-3 text-blue-600" />
            맞춤 추천 학습
          </h3>
          {progressLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {(progressOverview?.categories ?? []).slice(0, 2).map((category, index) => (
                <div 
                  key={category.id}
                  className={`border-2 rounded-xl p-6 hover:scale-[1.02] cursor-pointer transition-all duration-200 transform shadow-sm ${
                    category.status === 'completed' 
                      ? 'border-green-200 hover:bg-green-50 hover:border-green-400' 
                      : 'border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                  onClick={() => navigate(`/learn/word/${encodeURIComponent(category.name)}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 text-lg">{category.name}</h4>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      category.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-2xl">
                        {category.status === 'completed' ? '✅' : '📚'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        category.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {category.status === 'completed' ? '완료! ✓' : `진도: ${category.progress}%`}
                      </span>
                      <div className={`w-20 rounded-full h-2 ${
                        category.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <div 
                          className={`h-2 rounded-full ${
                            category.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${category.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className={`${
                        category.status === 'completed' 
                          ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } hover:scale-105 transition-all`}
                      variant={category.status === 'completed' ? 'outline' : 'default'}
                    >
                      {category.status === 'completed' ? '복습하기' : '계속하기'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <BadgeModal 
        isOpen={isBadgeModalOpen} 
        onClose={() => setIsBadgeModalOpen(false)} 
      />

      <StreakModal 
        isOpen={isStreakModalOpen} 
        onClose={() => setIsStreakModalOpen(false)} 
      />

      <ProgressModal 
        isOpen={isProgressModalOpen} 
        onClose={() => setIsProgressModalOpen(false)} 
      />

      <HandPreferenceModal 
        isOpen={isHandPreferenceModalOpen} 
        onClose={() => setIsHandPreferenceModalOpen(false)} 
      />

      {/* 온보딩 투어 */}
      {isOnboardingActive && shouldShowOnboarding && (
        <OnboardingTour
          currentStep={currentStep}
          onNext={nextStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
          onPrevious={previousStep}
        />
      )}
    </div>
  );
};

export default Home;