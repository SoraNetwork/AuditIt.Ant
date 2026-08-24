import { defineStore } from 'pinia';
import apiClient from '../services/api';

export interface SettlementSettings {
  technicianPercent: number;
  creatorPercent: number;
  shipperPercent: number;
  itemOwnerPercent: number;
  defaultPaymentAccount?: string | null;
  paymentAccountPresets?: string[];
  updatedAt?: string;
  updatedBy?: string | null;
}

interface SettlementState {
  settings: SettlementSettings | null;
  loading: boolean;
  error: string | null;
}

export const useSettlementStore = defineStore('settlement', {
  state: (): SettlementState => ({
    settings: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchSettings(): Promise<SettlementSettings> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get<SettlementSettings>('/finance-reports/settlement-settings');
        this.settings = response.data;
        return response.data;
      } catch (err: any) {
        this.error = '获取结算单设置失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(payload: SettlementSettings): Promise<SettlementSettings> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put<SettlementSettings>('/finance-reports/settlement-settings', {
          technicianPercent: Number(payload.technicianPercent || 0),
          creatorPercent: Number(payload.creatorPercent || 0),
          shipperPercent: Number(payload.shipperPercent || 0),
          itemOwnerPercent: Number(payload.itemOwnerPercent || 0),
          defaultPaymentAccount: payload.defaultPaymentAccount?.trim() || null,
          paymentAccountPresets: (payload.paymentAccountPresets || [])
            .map(value => value.trim())
            .filter(Boolean),
        });
        this.settings = response.data;
        return response.data;
      } catch (err: any) {
        this.error = '保存结算单设置失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
