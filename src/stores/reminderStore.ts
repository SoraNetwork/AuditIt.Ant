import { defineStore } from 'pinia';
import apiClient from '../services/api';

export type ReminderType = 'RentalDueSoon' | 'RentalOverdue' | 'Manual';
export type ReminderLevel = 'Info' | 'Warning' | 'Critical';

export interface Reminder {
  id: number;
  type: ReminderType;
  level: ReminderLevel;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  title: string;
  message?: string | null;
  targetUser?: string | null;
  dueAt: string;
  createdAt: string;
  dismissedAt?: string | null;
  dismissedBy?: string | null;
}

export interface CreateReminderPayload {
  title: string;
  message?: string;
  level?: ReminderLevel;
  targetUsers?: string[];
  dueAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface ReminderState {
  reminders: Reminder[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useReminderStore = defineStore('reminder', {
  state: (): ReminderState => ({
    reminders: [],
    unreadCount: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchReminders(opts: { unreadOnly?: boolean; targetUser?: string; limit?: number } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (opts.unreadOnly !== undefined) params.append('unreadOnly', String(opts.unreadOnly));
        if (opts.targetUser) params.append('targetUser', opts.targetUser);
        if (opts.limit) params.append('limit', String(opts.limit));
        const response = await apiClient.get<Reminder[]>(`/reminders?${params.toString()}`);
        this.reminders = response.data;
        this.unreadCount = response.data.filter(r => !r.dismissedAt).length;
      } catch (err: any) {
        this.error = '获取提醒失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await apiClient.get<Reminder[]>(`/reminders?unreadOnly=true&limit=200`);
        this.unreadCount = response.data.filter(r => !r.dismissedAt).length;
      } catch {
        // no-op
      }
    },

    async dismiss(id: number) {
      await apiClient.post(`/reminders/${id}/dismiss`);
      const idx = this.reminders.findIndex(r => r.id === id);
      if (idx !== -1) {
        this.reminders[idx].dismissedAt = new Date().toISOString();
      }
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    },

    async dismissAll(targetUser?: string) {
      const params = new URLSearchParams();
      if (targetUser) params.append('targetUser', targetUser);
      await apiClient.post(`/reminders/dismiss-all?${params.toString()}`);
      const now = new Date().toISOString();
      this.reminders.forEach(r => {
        if (!r.dismissedAt) r.dismissedAt = now;
      });
      this.unreadCount = 0;
    },

    async createReminder(payload: CreateReminderPayload): Promise<Reminder[]> {
      const response = await apiClient.post<Reminder[]>('/reminders', payload);
      this.reminders = [...response.data, ...this.reminders];
      this.unreadCount += response.data.filter(r => !r.dismissedAt).length;
      return response.data;
    },
  },
});
