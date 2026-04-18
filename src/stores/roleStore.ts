import { defineStore } from 'pinia';
import apiClient from '../services/api';

export interface Permission {
  code: string;
  category: string;
  description?: string | null;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  isBuiltIn: boolean;
  permissions: string[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  description?: string;
  permissions?: string[];
}

interface RoleState {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

export const useRoleStore = defineStore('role', {
  state: (): RoleState => ({
    roles: [],
    permissions: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchRoles() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get<Role[]>('/roles');
        this.roles = response.data;
      } catch (err: any) {
        this.error = '获取角色失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchPermissions() {
      try {
        const response = await apiClient.get<Permission[]>('/permissions');
        this.permissions = response.data;
      } catch (err: any) {
        this.error = '获取权限失败: ' + (err.response?.data?.message || err.message);
      }
    },

    async createRole(payload: CreateRolePayload): Promise<Role> {
      const response = await apiClient.post<Role>('/roles', payload);
      this.roles.unshift(response.data);
      return response.data;
    },

    async updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
      const response = await apiClient.put<Role>(`/roles/${id}`, payload);
      const idx = this.roles.findIndex(r => r.id === id);
      if (idx !== -1) this.roles[idx] = response.data;
      return response.data;
    },

    async deleteRole(id: number): Promise<void> {
      await apiClient.delete(`/roles/${id}`);
      this.roles = this.roles.filter(r => r.id !== id);
    },
  },
});
