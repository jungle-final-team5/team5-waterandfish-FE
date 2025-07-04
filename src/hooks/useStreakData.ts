import { useEffect, useState } from "react";
import { apiClient } from "@/services/api";

interface StreakApiResponse {
  studyDates: string[];
  currentStreak: number;
  longestStreak: number;
}

export function useStreakData() {
  const [studyDates, setStudyDates] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      setLoading(true);
      try {
        const response = await apiClient.streaks.get();
        const data = response.data as StreakApiResponse;
        setStudyDates(data.studyDates);
        setCurrentStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);
      } catch (e) {
        setStudyDates([]);
        setCurrentStreak(0);
        setLongestStreak(0);
      } finally {
        setLoading(false);
      }
    }
    fetchStreak();
  }, []);

  return { studyDates, currentStreak, longestStreak, loading };
} 