import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // .env 파일에서 주소 가져오기
  timeout: 5000, // 5초 안에 응답 없으면 취소
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 (예: 모든 요청에 자동으로 토큰 심기)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. 응답 인터셉터 (에러 처리 시 타입을 활용)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 서버에서 에러 메시지를 보낼 때의 타입을 정의하면 더 안전합니다.
    console.error('API Error:', error.response?.data?.message || '알 수 없는 에러');
    return Promise.reject(error);
  }
);

export default api;