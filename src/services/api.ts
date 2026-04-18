import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5880/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    if (status === 401) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        authStore.logout('会话已过期，请重新登录');
      }
    }

    if (status === 403) {
      const uiStore = useUiStore();
      const message = error.response?.data?.message || error.response?.data || '没有权限执行该操作';
      uiStore.showNotification(String(message), 'warning');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
