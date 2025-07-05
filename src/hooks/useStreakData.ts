import { useEffect, useState } from "react";
import API from "@/components/AxiosInstance";

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
        const res = await API.get<{ success: boolean; data: StreakApiResponse }>("/attendance/streak");
        setStudyDates(res.data.data.studyDates);
        setCurrentStreak(res.data.data.currentStreak);
        setLongestStreak(res.data.data.longestStreak);
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