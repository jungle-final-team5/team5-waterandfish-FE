
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
