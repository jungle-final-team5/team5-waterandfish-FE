import axios from 'axios';

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

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30초 타임아웃
  headers: {
    // 'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // 쿠키를 포함하여 요청
});

// 요청 인터셉터 - 요청 로깅 및 헤더 설정
API.interceptors.request.use(
  (config) => {
    // 개발 환경에서만 로깅
    if (import.meta.env.DEV) {
      console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API 요청 설정 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리 및 에러 핸들링
API.interceptors.response.use(
  (response) => {
    // 개발 환경에서만 로깅
    if (import.meta.env.DEV) {
      console.log(`✅ API 응답: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 네트워크 오류 처리
    if (!error.response) {
      console.error('🔌 네트워크 연결 오류:', error.message);
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.'));
      }
      return Promise.reject(new Error('네트워크 연결을 확인해주세요.'));
    }

    // CORS 오류 특별 처리
    if (error.response.status === 0 || error.message.includes('CORS')) {
      console.error('🚫 CORS 오류 감지');
      return Promise.reject(new Error('서버 연결에 문제가 있습니다. 관리자에게 문의하세요.'));
    }

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
        // 백엔드에서 자동으로 리프레시 토큰을 사용해 새 액세스 토큰 발급
        await API.post('/auth/refresh');
        processQueue(null);

        console.log('✅ 토큰 갱신 성공');
        // 토큰 갱신 성공 시 원래 요청 재시도
        return API(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        console.log('❌ 토큰 갱신 실패 - 로그아웃 처리');
        processQueue(refreshError, null);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 기타 HTTP 에러 처리
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = '서버 오류가 발생했습니다.';

      switch (status) {
        case 400:
          errorMessage = data?.detail || '잘못된 요청입니다.';
          break;
        case 403:
          errorMessage = '접근 권한이 없습니다.';
          break;
        case 404:
          errorMessage = '요청한 리소스를 찾을 수 없습니다.';
          break;
        case 422:
          errorMessage = data?.detail || '입력 데이터가 올바르지 않습니다.';
          break;
        case 429:
          errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 500:
          errorMessage = '서버 내부 오류가 발생했습니다.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
          break;
      }

      console.error(`❌ API 오류 [${status}]:`, errorMessage);
      error.message = errorMessage;
    }
    
    return Promise.reject(error);
  }
);

export default API;