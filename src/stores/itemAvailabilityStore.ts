import { beginLatestRequest } from '../utils/latestRequest';
import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { Item } from './itemStore';
import type { RentalStatus } from './rentalStore';

export interface ItemBusyPeriod {
  rentalId: string;
  rentalNumber: string;
  rentalStatus: RentalStatus;
  renterId: string;
  renterName?: string | null;
  startAt: string;
  endAt: string;
  isOpen: boolean;
  isUncertain?: boolean;
  isManualLoan?: boolean;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  expectedReturnDate?: string | null;
  occupancyStatus?: 'Scheduled' | 'Returning' | 'RenewalIntent';
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
      const isLatest = beginLatestRequest(this);
      this.calendar = null;
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ from, to });
        const response = await apiClient.get<ItemAvailabilityCalendar>(`/items/${itemId}/availability?${params.toString()}`);
        if (!isLatest()) return;
        this.calendar = response.data;
        return response.data;
      } catch (err: any) {
        if (!isLatest()) return;
        this.error = '获取设备空闲日历失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        if (isLatest()) this.loading = false;
      }
    },
    async fetchDefinitionOccupancy(
      definitionId: number,
      warehouseId: number,
      from: string,
      to: string,
    ): Promise<ItemDefinitionOccupancyCalendar> {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ from, to, warehouseId: String(warehouseId) });
        const response = await apiClient.get<ItemDefinitionOccupancyCalendar>(`/itemDefinitions/${definitionId}/occupancy?${params.toString()}`);
        return response.data;
      } catch (err: any) {
        this.error = '获取物品定义占用日历失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});

export interface ItemDefinitionDailyOccupancy {
  rentalId: string;
  rentalNumber: string;
  rentalStatus: RentalStatus;
  renterId: string;
  renterName?: string | null;
  quantity: number;
  isUncertain: boolean;
  isManualLoan?: boolean;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  expectedReturnDate?: string | null;
  occupancyStatus?: 'Scheduled' | 'Returning' | 'RenewalIntent';
}

export interface ItemDefinitionDailyStock {
  date: string;
  totalStock: number;
  occupiedCount: number;
  remainingStock: number;
  details: ItemDefinitionDailyOccupancy[];
}

export interface ItemDefinitionOccupancyCalendar {
  itemDefinitionId: number;
  name: string;
  warehouseId: number | null;
  warehouseName: string | null;
  totalStock: number;
  from: string;
  to: string;
  dailyStocks: ItemDefinitionDailyStock[];
}
