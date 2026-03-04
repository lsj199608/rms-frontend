import axios from 'axios';

const fallbackApiBase = () => {
    if (typeof window === 'undefined') {
        return 'http://localhost:9090';
    }

    const apiHost = window.location.hostname.includes("rms")?`${window.location.hostname}`:`${window.location.hostname}:9090`;
    return `${window.location.protocol}//${apiHost}`;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? fallbackApiBase(),
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
