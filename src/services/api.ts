import axios from 'axios';

// 표준화된 API 응답 형식
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 토큰 갱신 상태 관리
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: any = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// API 인스턴스 생성
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키를 포함하여 요청
});

// 응답 인터셉터 - 새로운 표준 형식 처리
API.interceptors.response.use(
  (response) => {
    // 표준화된 응답 형식인지 확인
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data) {
      // 표준화된 형식이면 data 부분만 반환
      const apiResponse = data as any;
      return {
        ...response,
        data: apiResponse.data || apiResponse
      };
    }
    // 기존 형식이면 그대로 반환
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 & 재시도 플래그가 없는 경우만 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 401 에러 감지 - 토큰 갱신 시작');

      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 새로운 리프레시 엔드포인트 사용
        await API.post('/api/v1/auth/refresh');
        processQueue(null);

        // 토큰 갱신 성공 시 원래 요청 재시도
        return API(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// API 래퍼 함수들
export const apiClient = {
  // 인증 관련
  auth: {
    login: (data: { email: string; password: string }) => 
      API.post('/api/v1/auth/login', data),
    
    register: (data: { email: string; password: string; nickname: string }) => 
      API.post('/api/v1/auth/register', data),
    
    logout: () => 
      API.post('/api/v1/auth/logout'),
    
    refresh: () => 
      API.post('/api/v1/auth/refresh'),
    
    deleteAccount: (password: string) => 
      API.request({
        method: 'DELETE',
        url: '/api/v1/auth/account',
        data: { password },
        headers: { 'Content-Type': 'application/json' }
      }),
    
    getGoogleAuthUrl: () => 
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/oauth/google`,
    
    getKakaoAuthUrl: () => 
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/oauth/kakao`,
  },

  // 사용자 관련
  users: {
    getMe: () => 
      API.get('/api/v1/users/me'),
    
    updateMe: (data: { nickname?: string; handedness?: string; description?: string }) => 
      API.put('/api/v1/users/me', data),
    
    updatePassword: (data: { current_password: string; new_password: string }) => 
      API.put('/api/v1/users/me/password', data),
    
    getProfile: () => 
      API.get('/api/v1/users/me/profile'),
    
    searchUsers: (query: string, limit = 10, offset = 0) => 
      API.get('/api/v1/users/search', { params: { q: query, limit, offset } }),
  },

  // 배지 관련
  badges: {
    getAll: () => 
      API.get('/api/v1/badges/'),
    
    getEarned: () => 
      API.get('/api/v1/badges/earned'),
    
    getById: (badgeId: number) => 
      API.get(`/api/v1/badges/${badgeId}`),
    
    earn: (badgeId: number) => 
      API.post(`/api/v1/badges/${badgeId}/earn`),
    
    getLeaderboard: (limit = 10, offset = 0) => 
      API.get('/api/v1/badges/stats/leaderboard', { params: { limit, offset } }),
    
    getStats: () => 
      API.get('/api/v1/badges/stats/summary'),
  },

  // 검색 관련
  search: {
    lessons: (query: string, limit = 10, offset = 0, contentType?: string) => 
      API.get('/api/v1/search/lessons', { 
        params: { q: query, limit, offset, content_type: contentType } 
      }),
    
    suggest: (query: string, limit = 5) => 
      API.get('/api/v1/search/lessons/suggest', { params: { q: query, limit } }),
    
    getPopular: (limit = 10) => 
      API.get('/api/v1/search/lessons/popular', { params: { limit } }),
    
    getRecent: (limit = 10) => 
      API.get('/api/v1/search/lessons/recent', { params: { limit } }),
    
    getStats: () => 
      API.get('/api/v1/search/stats'),
  },

  // 학습 관련
  learning: {
    getCategories: (includeProgress = true) => 
      API.get('/api/v1/learning/categories', { params: { include_progress: includeProgress } }),
    
    createCategory: (data: { name: string; description: string; order: number }) => 
      API.post('/api/v1/learning/categories', data),
    
    getCategory: (categoryId: string) => 
      API.get(`/api/v1/learning/categories/${categoryId}`),
    
    createChapter: (data: { title: string; description: string; category_name: string; order: number; type: string }) => 
      API.post('/api/v1/learning/chapters', data),
    
    getChapter: (chapterId: string) => 
      API.get(`/api/v1/learning/chapters/${chapterId}`),
    
    createLesson: (data: { sign: string; description: string; type: string; order: number; chapter: string; url: string }) => 
      API.post('/api/v1/learning/lessons', data),
    
    getLesson: (lessonId: string) => 
      API.get(`/api/v1/learning/lessons/${lessonId}`),
    
    getProgress: () => 
      API.get('/api/v1/learning/progress'),
    
    updateLessonProgress: (lessonId: string, data: { status: string; score?: number }) => 
      API.post(`/api/v1/learning/progress/lessons/${lessonId}`, data),
  },

  // 스트릭 관련
  streaks: {
    get: () => 
      API.get('/api/v1/streaks/'),
    
    complete: () => 
      API.post('/api/v1/streaks/complete'),
  },
};

// 기존 API 인스턴스도 export (하위 호환성)
export default API; 