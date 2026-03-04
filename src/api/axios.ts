import axios from 'axios';

export const API_BASE_URL: string =
    import.meta.env.VITE_API_URL?.trim() || 'http://localhost:9090';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
