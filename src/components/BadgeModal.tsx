
import API from '@/components/AxiosInstance';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star, Target, Calendar, Zap, Book, Heart, Crown, Flame, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// API 응답 타입 정의
interface ApiBadge {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  color: string;
}

interface EarnedBadge {
  badge_id: number;
  timestamp: string;
  user_id?: number;
  acquire?: string;
}

// 화면에 표시할 뱃지 타입 정의
interface BadgeType {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
  earnedDate: string | null;
}

const BadgeModal = ({ isOpen, onClose }: BadgeModalProps) => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [earnedData, setEarnedData] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return formatted;
    } catch (error) {
      return dateString; // 오류 발생 시 원래 문자열 반환
    }
  };
  
  // 아이콘 매핑 함수
  const getIconForBadge = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'trophy': <Trophy className="h-8 w-8 text-yellow-600" />,
      'calendar': <Calendar className="h-8 w-8 text-green-600" />,
      'target': <Target className="h-8 w-8 text-blue-600" />,
      'medal': <Medal className="h-8 w-8 text-purple-600" />,
      'award': <Award className="h-8 w-8 text-red-600" />,
      'star': <Star className="h-8 w-8 text-orange-600" />,
      'zap': <Zap className="h-8 w-8 text-yellow-500" />,
      'book': <Book className="h-8 w-8 text-indigo-600" />,
      'heart': <Heart className="h-8 w-8 text-pink-600" />,
      'crown': <Crown className="h-8 w-8 text-amber-600" />,
      'flame': <Flame className="h-8 w-8 text-red-500" />,
      'shield': <Shield className="h-8 w-8 text-teal-600" />
    };
    
    return iconMap[iconName.toLowerCase()] || <Trophy className="h-8 w-8 text-gray-600" />;
  };
  
  // 뱃지와 획득 정보 비교 함수
  const compareBadgesWithEarned = (allBadges: ApiBadge[], earnedBadges: EarnedBadge[]): BadgeType[] => {
    return allBadges.map(badge => {
      const earnedBadge = earnedBadges.find(earned => earned.badge_id === badge.id);
      
      const result = {
        ...badge,
        icon: getIconForBadge(badge.icon_url || 'trophy'),
        earned: !!earnedBadge,
        earnedDate: earnedBadge ? earnedBadge.acquire : null
        
      };

      return result;
    });
  };

  const earnedBadges = badges.filter(badge => badge.earned);
  const unearnedBadges = badges.filter(badge => !badge.earned);

  // 모든 뱃지 목록과 획득한 뱃지 정보를 가져오는 함수
  const fetchBadgeData = async () => {
    setLoading(true);
    try {
      // 1. 모든 뱃지 목록 가져오기
      const allBadgesResponse = await API.get<ApiBadge[]>('/badge/');
      // 2. 사용자가 획득한 뱃지 목록 가져오기
      const earnedBadgesResponse = await API.get<EarnedBadge[]>('/badge/earned');
      setEarnedData(earnedBadgesResponse.data);
      
      
      // 3. 두 데이터 비교하여 상태 업데이트
      const processedBadges = compareBadgesWithEarned(
        allBadgesResponse.data, 
        earnedBadgesResponse.data
      );      
      setBadges(processedBadges);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('뱃지 데이터 불러오기 실패');
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('서버 응답 에러:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('요청은 전송됐지만 응답 없음:', error.request);
        } else {
          console.error('요청 설정 에러:', error.message);
        }
      } else {
        console.error('알 수 없는 오류:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadgeData();
  }, []);

  return (
    loading ? (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">뱃지 정보를 불러오는 중...</p>
          </div>
        </DialogContent>
      </Dialog>
    ) : (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            🏆 획득한 뱃지
          </DialogTitle>
        </DialogHeader>
        
        {/* Earned Badges */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
            획득한 뱃지 ({earnedBadges.length}개)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {earnedBadges.map((badge) => (
              <div 
                key={badge.id}
                className={`${badge.color} rounded-xl p-6 transform hover:scale-105 transition-all duration-200`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{badge.name}</h4>
                      <Badge variant="secondary" className="text-xs">획득</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-500">
                      획득일: {formatDate(badge.earnedDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unearned Badges */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="h-5 w-5 text-gray-400 mr-2" />
            도전 가능한 뱃지 ({unearnedBadges.length}개)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {unearnedBadges.map((badge) => (
              <div 
                key={badge.id}
                className="bg-gray-100 rounded-xl p-6 opacity-60 transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 filter grayscale">
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-600">{badge.name}</h4>
                      <Badge variant="outline" className="text-xs">미획득</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-400">
                      계속 학습하여 이 뱃지를 획득해보세요!
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    )
  );
};

export default BadgeModal;