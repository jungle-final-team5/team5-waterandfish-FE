
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Search, 
  RotateCcw, 
  Trophy, 
  Calendar,
  Target,
  User,
  Settings
} from 'lucide-react';
<<<<<<< Updated upstream
=======
import BadgeModal from '@/components/BadgeModal';
import API from '@/components/AxiosInstance';
>>>>>>> Stashed changes
type UserResponse = {
  id: number;
  email: string;
  nickname: string;
};
<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
import API from '../components/AxiosInstance'
const Home = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get<UserResponse>('/user/');
        setNickname(res.data.nickname);
      } catch (err) {
        if (err.response?.status === 401){
          try {
          await API.post('/auth/refresh');
        // refresh 성공하면 다시 원래 요청 재시도
        const res = await API.get<UserResponse>('/user/');
        setNickname(res.data.nickname);
      } catch (refreshErr) {
        navigate('/login')
      }
        }
      }
    };
=======
const Home = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [todaySentence, setTodaySentence] = useState<string>('로딩 중...');
  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await API.get<UserResponse>('/user/');
      setNickname(res.data.nickname);
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          await API.post('/auth/refresh');
          const res = await API.get<UserResponse>('/user/');
          setNickname(res.data.nickname);
        } catch {
          navigate('/login');
        }
      }
    }
  };

  const fetchRandomSentence = async () => {
    try {
      const res = await API.get<{ sentence: string }>('/api/random-sentence');
      setTodaySentence(res.data.sentence);
    } catch {
      setTodaySentence('문장을 불러오지 못했습니다.');
    }
  };

  fetchUser();
  fetchRandomSentence();
}, [navigate]);
>>>>>>> Stashed changes

    fetchUser();
  }, []);
  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'recent':
        navigate('/learn');
        break;
      case 'streak':
        // 연속 학습 통계 페이지로 이동 (현재는 학습 페이지로)
        navigate('/learn');
        break;
      case 'badges':
        // 뱃지 페이지로 이동 (현재는 홈 유지)
        console.log('뱃지 페이지 준비중');
        break;
      case 'progress':
        navigate('/learn');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🤟</span>
              </div>
              <span className="text-xl font-bold text-gray-800">SignSense</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            안녕하세요, {nickname || '학습자'}님! 👋
          </h1>
          <p className="text-gray-600">오늘도 수어 학습을 시작해볼까요?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Button
            onClick={() => navigate('/search')}
            className="h-24 bg-blue-600 hover:bg-blue-700 flex-col space-y-2 transform hover:scale-105 transition-all duration-200"
          >
            <Search className="h-8 w-8" />
            <span className="text-lg">수어 검색</span>
          </Button>

          <Button
            onClick={() => navigate('/learn')}
            variant="outline"
            className="h-24 hover:bg-blue-50 flex-col space-y-2 transform hover:scale-105 transition-all duration-200"
          >
            <BookOpen className="h-8 w-8" />
            <span className="text-lg">학습하기</span>
          </Button>

          <Button
            onClick={() => navigate('/review')}
            variant="outline"
            className="h-24 hover:bg-green-50 flex-col space-y-2 transform hover:scale-105 transition-all duration-200"
          >
            <RotateCcw className="h-8 w-8" />
            <span className="text-lg">복습하기</span>
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 최근 학습 */}
          <div 
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('recent')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">최근 학습</h3>
              <BookOpen className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600 mb-2">기본 인사말</p>
            <p className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">안녕하세요</p>
            <div className="mt-3 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              클릭해서 계속 학습하기 →
            </div>
          </div>

          {/* 연속 학습 */}
          <div 
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('streak')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">연속 학습</h3>
              <Calendar className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600 mb-2">연속 학습 일수</p>
            <p className="text-2xl font-bold text-green-600 group-hover:animate-pulse">7일 🔥</p>
            <div className="mt-3 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
              연속 기록을 계속 이어가세요! →
            </div>
          </div>

          {/* 획득 뱃지 */}
          <div 
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('badges')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-yellow-600 transition-colors">획득한 뱃지</h3>
              <Trophy className="h-5 w-5 text-yellow-600 group-hover:scale-110 group-hover:rotate-12 transition-all" />
            </div>
            <p className="text-sm text-gray-600 mb-2">총 뱃지 개수</p>
            <p className="text-2xl font-bold text-yellow-600 group-hover:animate-bounce">3개 🏆</p>
            <div className="mt-3 text-xs text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">
              새로운 뱃지를 획득해보세요! →
            </div>
          </div>

          {/* 전체 진도율 */}
          <div 
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('progress')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">전체 진도율</h3>
              <Target className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-sm text-gray-600 mb-2">전체 과정</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-purple-600">35%</p>
              <div className="flex-1 bg-gray-200 rounded-full h-2 group-hover:bg-purple-100 transition-colors">
                <div className="bg-purple-600 h-2 rounded-full group-hover:animate-pulse transition-all duration-500" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
              더 많은 과정을 완료해보세요! →
            </div>
          </div>
        </div>

        {/* 오늘의 문장 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-8 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02]">
          <h3 className="text-xl font-semibold mb-2">오늘의 문장</h3>
          <p className="text-2xl font-bold mb-4">"수고하셨습니다"</p>
          <Button 
            variant="secondary"
            onClick={() => navigate('/learn/수고하셨습니다')}
            className="hover:scale-105 transition-transform duration-200"
          >
            지금 배우기
          </Button>
        </div>

        {/* 추천 학습 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">추천 학습</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]">
              <h4 className="font-medium text-gray-800 mb-2">일상 인사말</h4>
              <p className="text-sm text-gray-600 mb-3">기본적인 인사 표현을 배워보세요</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">진도: 70%</span>
                <Button size="sm" variant="outline" className="hover:scale-105 transition-transform">계속하기</Button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-green-300 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]">
              <h4 className="font-medium text-gray-800 mb-2">감정 표현</h4>
              <p className="text-sm text-gray-600 mb-3">다양한 감정을 수어로 표현해보세요</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">진도: 완료</span>
                <Button size="sm" variant="outline" className="hover:scale-105 transition-transform">복습하기</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
