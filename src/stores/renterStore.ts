import { defineStore } from 'pinia';
import apiClient from '../services/api';

export interface Renter {
  id: string;
  name: string;
  phone?: string | null;
  idCardNo?: string | null;
  xianyuId?: string | null;
  taobaoId?: string | null;
  xiaohongshuId?: string | null;
  defaultAddress?: string | null;
  notes?: string | null;
  createdAt?: string;
  lastUpdated?: string;
}

export type CreateRenterPayload = Omit<Renter, 'id' | 'createdAt' | 'lastUpdated'>;
export type UpdateRenterPayload = Partial<CreateRenterPayload>;

interface RenterState {
  renters: Renter[];
  loading: boolean;
  error: string | null;
}

export const useRenterStore = defineStore('renter', {
  state: (): RenterState => ({
    renters: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchRenters(keyword = '', limit = 100) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (keyword.trim()) params.append('keyword', keyword.trim());
        params.append('limit', String(limit));
        const response = await apiClient.get<Renter[]>(`/renters?${params.toString()}`);
        this.renters = response.data;
      } catch (err: any) {
        this.error = '获取租客失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async createRenter(payload: CreateRenterPayload): Promise<Renter> {
      const response = await apiClient.post<Renter>('/renters', payload);
      this.renters.unshift(response.data);
      return response.data;
    },

    async updateRenter(id: string, payload: UpdateRenterPayload): Promise<Renter> {
      const response = await apiClient.put<Renter>(`/renters/${id}`, payload);
      const index = this.renters.findIndex(r => r.id === id);
      if (index !== -1) this.renters[index] = response.data;
      return response.data;
    },

    async deleteRenter(id: string): Promise<void> {
      await apiClient.delete(`/renters/${id}`);
      this.renters = this.renters.filter(r => r.id !== id);
    },
  },
});
