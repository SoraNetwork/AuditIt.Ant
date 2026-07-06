import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { ReminderLevel, ReminderType } from './reminderStore';
import type { RentalStatus } from './rentalStore';

export type RentalCalendarEventKind =
  | 'RentalPeriod'
  | 'ShipmentRequired'
  | 'ReturnRequired'
  | 'OutboundShipment'
  | 'InboundShipment'
  | 'Reminder';

export interface RentalCalendarEvent {
  id: string;
  kind: RentalCalendarEventKind;
  reminderType?: ReminderType | null;
  level: ReminderLevel;
  rentalId?: string | null;
  rentalNumber?: string | null;
  renterId?: string | null;
  renterName?: string | null;
  rentalStatus?: RentalStatus | null;
  hasRenewalIntent: boolean;
  renewalIntentEndDate?: string | null;
  reminderId?: number | null;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  isOpen: boolean;
}

interface CalendarState {
  events: RentalCalendarEvent[];
  loading: boolean;
  error: string | null;
}

export const useCalendarStore = defineStore('rentalCalendar', {
  state: (): CalendarState => ({
    events: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchCalendar(from: string, to: string, targetUser?: string) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ from, to });
        if (targetUser) params.append('targetUser', targetUser);
        const response = await apiClient.get<RentalCalendarEvent[]>(`/rentals/calendar?${params.toString()}`);
        this.events = response.data;
        return response.data;
      } catch (err: any) {
        this.error = '获取提醒日历失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
