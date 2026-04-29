import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { Item } from './itemStore';
import type { RentalStatus } from './rentalStore';

export interface ItemBusyPeriod {
  rentalId: string;
  rentalNumber: string;
  rentalStatus: RentalStatus;
  renterName?: string | null;
  startAt: string;
  endAt: string;
  isOpen: boolean;
}

export interface ItemFreePeriod {
  startAt: string;
  endAt: string;
}

export interface ItemAvailabilityCalendar {
  item: Item;
  from: string;
  to: string;
  busyPeriods: ItemBusyPeriod[];
  freePeriods: ItemFreePeriod[];
}

interface ItemAvailabilityState {
  calendar: ItemAvailabilityCalendar | null;
  loading: boolean;
  error: string | null;
}

export const useItemAvailabilityStore = defineStore('itemAvailability', {
  state: (): ItemAvailabilityState => ({
    calendar: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAvailability(itemId: string, from: string, to: string) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ from, to });
        const response = await apiClient.get<ItemAvailabilityCalendar>(`/items/${itemId}/availability?${params.toString()}`);
        this.calendar = response.data;
        return response.data;
      } catch (err: any) {
        this.error = '获取设备空闲日历失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
