import { defineStore } from 'pinia';
import apiClient from '../services/api';
import router from '../router';
import { useUiStore } from './uiStore';

export type UserStatus = 'Active' | 'Left';

export interface User {
  id: string;
  name: string;
  dingTalkId?: string;
  corpId?: string;
  status?: UserStatus;
  lastLoginAt?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
}

function readPermissions(): string[] {
  try {
    const raw = localStorage.getItem('permissions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: unknown) => String(p));
  } catch {
    return [];
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    permissions: readPermissions(),
  }),
  getters: {
    isAuthenticated: state => !!state.token,
    permissionSet: state => new Set(state.permissions),
  },
  actions: {
    hasPermission(code: string): boolean {
      return this.permissionSet.has(code);
    },
    hasAnyPermission(codes: string[]): boolean {
      if (codes.length === 0) return true;
      return codes.some(c => this.permissionSet.has(c));
    },
    hasAllPermissions(codes: string[]): boolean {
      if (codes.length === 0) return true;
      return codes.every(c => this.permissionSet.has(c));
    },

    async loginWithLegacyCode(code: string) {
      try {
        const response = await apiClient.post('/auth/dingtalk-login', { code });
        this.setAuthData(response.data.token, response.data.user, response.data.permissions || []);
        router.push('/');
      } catch (error: any) {
        this.clearAuthData();
        if (error?.response?.status === 403) {
          throw new Error('账号已停用或离职，禁止登录');
        }
        throw new Error('登录失败，请重试');
      }
    },

    async loginWithSsoCode(code: string) {
      try {
        const response = await apiClient.post('/auth/dingtalk-sso-login', { code });
        this.setAuthData(response.data.token, response.data.user, response.data.permissions || []);
        router.push('/');
      } catch (error: any) {
        this.clearAuthData();
        if (error?.response?.status === 403) {
          throw new Error('账号已停用或离职，禁止登录');
        }
        throw new Error('登录失败，请重试');
      }
    },

    setAuthData(token: string, user: User, permissions: string[]) {
      this.token = token;
      this.user = user;
      this.permissions = permissions;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('permissions', JSON.stringify(permissions));
    },

    clearAuthData() {
      this.token = null;
      this.user = null;
      this.permissions = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    },

    logout(message?: string) {
      const uiStore = useUiStore();
      this.clearAuthData();
      if (message) {
        uiStore.showNotification(message, 'error');
      }
      router.push('/login');
    },
  },
});
