import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import API from '@/components/AxiosInstance';

interface Badge {
  id: number;
  name: string;
  description: string;
  condition: (stats: LearningStats) => boolean;
  earned: boolean;
  earnedDate: string | null;
}

interface LearningStats {
  totalLessonsCompleted: number;
  consecutiveDays: number;
  correctAnswers: number;
  categoriesCompleted: number;
  chaptersCompleted: number;
  reviewsCompleted: number;
  fastAnswers: number;
}

export interface BadgeCheckResponse {
  earnedBadges: {
    id: number;
    name: string;
    description: string;
    earnedDate: string;
  }[];
  updatedStats?: Partial<LearningStats>;
}

export const useBadgeSystem = () => {
  const { showBadgeEarned } = useNotifications();
  const [loading, setLoading] = useState<boolean>(false);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalLessonsCompleted: 0,
    consecutiveDays: 7,
    correctAnswers: 15,
    categoriesCompleted: 1,
    chaptersCompleted: 2,
    reviewsCompleted: 50,
    fastAnswers: 25
  });
  
  const checkBadges = useCallback(async (action: string) => {
    setLoading(true);
    try {
    const response = await API.post<BadgeCheckResponse>('/badge/check-badges', {
      input_str: action // 또는 원하는 문자열 값
    });      
      const { earnedBadges, updatedStats } = response.data;
      
      // 획득한 뱃지가 있으면 알림 표시
      if (earnedBadges && earnedBadges.length > 0) {
        earnedBadges.forEach(badge => {
          showBadgeEarned(badge.name, badge.description);
        });
      }
      
      // 통계 업데이트가 있으면 적용
      if (updatedStats) {
        setLearningStats(prev => ({ ...prev, ...updatedStats }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to check badges:', error);
      return { earnedBadges: [] };
    } finally {
      setLoading(false);
    }
  }, [showBadgeEarned]);

  return {
    checkBadges
  };
};