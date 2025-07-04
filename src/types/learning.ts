export interface Lesson {
  id: string;
  word: string;
  category: string;
  type: 'letter' | 'word' | 'sentence';
  difficulty?: 'easy' | 'medium' | 'hard';
  videoUrl?: string;
  description?: string;
}

export interface Chapter {
  id: string;
  title: string;
  type: 'word' | 'sentence';
  signs: Lesson[];
  categoryId: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  icon: string;
}

export interface QuizResult {
  signId: string;
  isCorrect: boolean;
  timeSpent: number;
  needsReview: boolean;
}

export interface LearningSession {
  id: string;
  categoryId: string;
  chapterId: string;
  type: 'learning' | 'quiz';
  completedSigns: string[];
  quizResults: QuizResult[];
  startTime: Date;
  endTime?: Date;
}

// 새로운 RESTful API 타입들
export interface CategoryResponse {
  id: string;
  name: string;
  description: string;
  order: number;
  chapters?: Chapter[];
  progress?: number;
  completed_lessons?: number;
  total_lessons?: number;
  status?: string;
}

export interface ChapterResponse {
  id: string;
  title: string;
  description: string;
  category_id: string;
  order: number;
  type: string;
  lessons?: Lesson[];
  progress?: number;
}

export interface LessonResponse {
  id: string;
  sign: string;
  description: string;
  type: string;
  order: number;
  chapter_id: string;
  url: string;
  status?: string;
  score?: number;
}

export interface ProgressResponse {
  overall_progress: number;
  total_lessons: number;
  completed_lessons: number;
  completed_chapters: number;
  total_chapters: number;
  categories: CategoryResponse[];
}

export interface SearchResult {
  lesson_id: string;
  sign_text: string;
  score?: number;
  type?: string;
  category?: string;
  chapter?: string;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  study_dates: string[];
  streak_data: { [date: string]: boolean };
}

export interface BadgeData {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  earned_date?: string;
  criteria?: string;
}

// 요청 타입들
export interface CreateCategoryRequest {
  name: string;
  description: string;
  order: number;
}

export interface CreateChapterRequest {
  title: string;
  description: string;
  category_name: string;
  order: number;
  type: string;
}

export interface CreateLessonRequest {
  sign: string;
  description: string;
  type: string;
  order: number;
  chapter: string;
  url: string;
}

export interface UpdateProgressRequest {
  status: 'started' | 'in_progress' | 'completed';
  score?: number;
}
