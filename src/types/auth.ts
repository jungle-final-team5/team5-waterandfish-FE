// src/types/auth.ts (새 파일 생성)
// 표준화된 API 응답 형식
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthUrlResponse {
  auth_url: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    email: string;
    nickname: string;
    handedness: string | null;
    streak_days: number;
    overall_progress: number;
    description: string | null;
  };
}

export interface UserData {
  _id: string;
  email: string;
  nickname: string;
  handedness: string | null;
  streak_days: number;
  overall_progress: number;
  description: string | null;
  provider?: string; // 소셜 로그인 제공자
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateUserRequest {
  nickname?: string;
  handedness?: string;
  description?: string;
}