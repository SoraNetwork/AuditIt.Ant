import { defineStore } from 'pinia';
import apiClient from '../services/api';
import router from '../router';

interface AuthState {
  token: string | null;
  user: Record<string, any> | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async loginWithDingtalkCode(code: string) {
      try {
        const response = await apiClient.post('/auth/dingtalk-login', { code });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 登录成功后，跳转到主页
        router.push('/');
      } catch (error) {
        console.error('钉钉登录失败:', error);
        // 可选：在这里处理登录失败的逻辑，例如显示错误消息
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    },
    checkAuth() {
      if (!this.token) {
        router.push('/login');
      }
    }
  },
});
