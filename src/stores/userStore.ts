import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { UserStatus } from './authStore';

export interface AdminUser {
  id: string;
  name: string;
  status: UserStatus;
  lastDingTalkId?: string | null;
  dingTalkUserId?: string | null;
  mobile?: string | null;
  jobNumber?: string | null;
  jobTitle?: string | null;
  lastDingTalkSyncAt?: string | null;
  lastLoginAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  roles: string[];
  permissions: string[];
}

interface UserState {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('adminUser', {
  state: (): UserState => ({
    users: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchUsers(filters: { keyword?: string; status?: UserStatus; role?: string; limit?: number } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.keyword) params.append('keyword', filters.keyword);
        if (filters.status) params.append('status', filters.status);
        if (filters.role) params.append('role', filters.role);
        params.append('limit', String(filters.limit ?? 200));

        const response = await apiClient.get<AdminUser[]>(`/users?${params.toString()}`);
        this.users = response.data;
      } catch (err: any) {
        this.error = '获取用户失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(id: string, status: UserStatus, notes?: string): Promise<AdminUser> {
      const response = await apiClient.put<AdminUser>(`/users/${id}/status`, { status, notes });
      this.replaceInList(response.data);
      return response.data;
    },

    async updateRoles(id: string, roleIds: number[]): Promise<AdminUser> {
      const response = await apiClient.put<AdminUser>(`/users/${id}/roles`, { roleIds });
      this.replaceInList(response.data);
      return response.data;
    },

    async syncDingTalkUsers(payload: { deactivateMissing?: boolean; defaultRoleName?: string } = { deactivateMissing: true }) {
      const response = await apiClient.post<{
        pulled: number;
        created: number;
        updated: number;
        deactivated: number;
        skipped: number;
        messages: string[];
      }>('/users/sync-dingtalk', payload);
      await this.fetchUsers({ status: 'Active', limit: 300 });
      return response.data;
    },

    replaceInList(user: AdminUser) {
      const idx = this.users.findIndex(u => u.id === user.id);
      if (idx !== -1) this.users[idx] = user;
    },
  },
});
