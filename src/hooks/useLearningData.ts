import { useState, useEffect } from 'react';
import API from '@/components/AxiosInstance';
import { Category, Chapter, Lesson, QuizResult } from '@/types/learning';

interface LearningProgress {
  completedSigns: Set<string>;
  completedChapters: Set<string>;
  completedCategories: Set<string>;
}

export const useLearningData = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewSigns, setReviewSigns] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LearningProgress>(() => {
    const saved = localStorage.getItem('learningProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        completedSigns: new Set(parsed.completedSigns || []),
        completedChapters: new Set(parsed.completedChapters || []),
        completedCategories: new Set(parsed.completedCategories || [])
      };
    }
    return {
      completedSigns: new Set(),
      completedChapters: new Set(),
      completedCategories: new Set()
    };
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await API.get<{ success: boolean; data: Category[]; message: string }>('/category');
        setCategories(response.data.data);
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const progressData = {
      completedSigns: Array.from(progress.completedSigns),
      completedChapters: Array.from(progress.completedChapters),
      completedCategories: Array.from(progress.completedCategories)
    };
    localStorage.setItem('learningProgress', JSON.stringify(progressData));
  }, [progress]);

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  const getChapterById = (categoryId: string, chapterId: string): Chapter | undefined => {
    const category = getCategoryById(categoryId);
    return category?.chapters.find(chapter => chapter.id === chapterId);
  };

  const addToReview = (sign: Lesson) => {
    setReviewSigns(prev => {
      if (!prev.find(s => s.id === sign.id)) {
        return [...prev, sign];
      }
      return prev;
    });
  };

  const removeFromReview = (signId: string) => {
    setReviewSigns(prev => prev.filter(s => s.id !== signId));
  };

  const markSignCompleted = (signId: string) => {
    setProgress(prev => ({
      ...prev,
      completedSigns: new Set([...prev.completedSigns, signId])
    }));
  };

  const markChapterCompleted = (chapterId: string) => {
    setProgress(prev => ({
      ...prev,
      completedChapters: new Set([...prev.completedChapters, chapterId])
    }));
  };

  const markCategoryCompleted = (categoryId: string) => {
    setProgress(prev => ({
      ...prev,
      completedCategories: new Set([...prev.completedCategories, categoryId])
    }));
  };

  const getChapterProgress = (chapter: Chapter): { completed: number; total: number; percentage: number } => {
    const completed = chapter.signs.filter(sign => progress.completedSigns.has(sign.id)).length;
    const total = chapter.signs.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getCategoryProgress = (category: Category): { completed: number; total: number; percentage: number } => {
    const allSigns = category.chapters.flatMap(chapter => chapter.signs);
    const completed = allSigns.filter(sign => progress.completedSigns.has(sign.id)).length;
    const total = allSigns.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const isChapterCompleted = (chapterId: string): boolean => {
    return progress.completedChapters.has(chapterId);
  };

  const isCategoryCompleted = (categoryId: string): boolean => {
    return progress.completedCategories.has(categoryId);
  };

  // 관리자 기능들
  const addCategory = (categoryData: { title: string; description: string; icon: string },id: string) => {
    const newCategory: Category = {
      id,
      ...categoryData,
      chapters: []
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (categoryId: string, categoryData: { title: string; description: string; icon: string }) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, ...categoryData }
        : cat
    ));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const addChapter = (categoryId: string, chapterData: { title: string; type: 'word' | 'sentence'; signs: Lesson[] },cid : string) => {
    const newChapter: Chapter = {
      id: cid,
      ...chapterData,
      categoryId
    };
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, chapters: [...cat.chapters, newChapter] }
        : cat
    ));
  };

  const updateChapter = (categoryId: string, chapterId: string, chapterData: { title: string; type: 'word' | 'sentence'; signs: Lesson[] }) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? {
            ...cat, 
            chapters: cat.chapters.map(chapter => 
              chapter.id === chapterId 
                ? { ...chapter, ...chapterData }
                : chapter
            )
          }
        : cat
    ));
  };

  const deleteChapter = (categoryId: string, chapterId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, chapters: cat.chapters.filter(chapter => chapter.id !== chapterId) }
        : cat
    ));
  };

  return {
    categories,
    loading,
    reviewSigns,
    progress,
    getCategoryById,
    getChapterById,
    addToReview,
    removeFromReview,
    markSignCompleted,
    markChapterCompleted,
    markCategoryCompleted,
    getChapterProgress,
    getCategoryProgress,
    isChapterCompleted,
    isCategoryCompleted,
    addCategory,
    updateCategory,
    deleteCategory,
    addChapter,
    updateChapter,
    deleteChapter
  };
};