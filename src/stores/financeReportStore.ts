import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { RentalStatus, SettlementPreview } from './rentalStore';

export interface FinanceReportStatusSummary {
  status: RentalStatus;
  count: number;
  totalOrderAmount: number;
  accountedAmount: number;
}

export interface FinanceReportCategorySummary {
  category: '已完成' | '在租' | '未开始' | string;
  count: number;
  totalOrderAmount: number;
  accountedAmount: number;
}

export interface FinanceReportSummary {
  from: string;
  to: string;
  rentalCount: number;
  activeRentalCount: number;
  closedRentalCount: number;
  totalOrderAmount: number;
  totalDeposit: number;
  totalShippingFee: number;
  totalOtherFee: number;
  accountedAmount: number;
  categories: FinanceReportCategorySummary[];
  statuses: FinanceReportStatusSummary[];
  paymentAccounts: FinanceReportPaymentAccountSummary[];
}

export interface FinanceReportPaymentAccountSummary {
  paymentAccount: string;
  count: number;
  totalOrderAmount: number;
  accountedAmount: number;
}

export interface FinanceReportDetail {
  rentalId: string;
  rentalNumber: string;
  status: RentalStatus;
  renterId: string;
  renterName?: string | null;
  assignedTo?: string | null;
  startDate: string;
  expectedEndDate: string;
  createdAt: string;
  totalPrice: number;
  deposit: number;
  totalShippingFee: number;
  otherFee: number;
  accountedAmount: number;
  itemCount: number;
  platformOrderNo?: string | null;
  paymentAccount?: string | null;
}

interface FinanceReportState {
  summary: FinanceReportSummary | null;
  details: FinanceReportDetail[];
  loading: boolean;
  error: string | null;
}

export const useFinanceReportStore = defineStore('financeReport', {
  state: (): FinanceReportState => ({
    summary: null,
    details: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchReports(from?: string, to?: string) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);

        const query = params.toString();
        const [summary, details] = await Promise.all([
          apiClient.get<FinanceReportSummary>(`/finance-reports/summary${query ? `?${query}` : ''}`),
          apiClient.get<FinanceReportDetail[]>(`/finance-reports/details${query ? `?${query}` : ''}`),
        ]);

        this.summary = summary.data;
        this.details = details.data;
      } catch (err: any) {
        this.error = '获取财务报表失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchSettlements(from?: string, to?: string): Promise<SettlementPreview[]> {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const response = await apiClient.get<SettlementPreview[]>(`/finance-reports/settlements?${params.toString()}`);
      return response.data;
    },
  },
});
