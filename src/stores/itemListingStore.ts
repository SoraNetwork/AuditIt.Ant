import { defineStore } from 'pinia';
import apiClient from '../services/api';

export type ListingPlatform = 'Xianyu' | 'Taobao' | 'Xiaohongshu' | 'Other';
export type ListingStatus = 'Draft' | 'Listed' | 'Hidden' | 'Sold';

export interface ItemListing {
  id: number;
  itemId: string;
  platform: ListingPlatform;
  url: string;
  title?: string | null;
  status: ListingStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateListingPayload {
  platform: ListingPlatform;
  url: string;
  title?: string | null;
  status?: ListingStatus;
  remarks?: string | null;
}

export type UpdateListingPayload = Partial<CreateListingPayload>;

interface ListingState {
  listings: Record<string, ItemListing[]>;
  loading: boolean;
  error: string | null;
}

export const useItemListingStore = defineStore('itemListing', {
  state: (): ListingState => ({
    listings: {},
    loading: false,
    error: null,
  }),
  actions: {
    async fetchByItem(itemId: string): Promise<ItemListing[]> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get<ItemListing[]>(`/items/${itemId}/listings`);
        this.listings[itemId] = response.data;
        return response.data;
      } catch (err: any) {
        this.error = '获取挂载链接失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createListing(itemId: string, payload: CreateListingPayload): Promise<ItemListing> {
      const response = await apiClient.post<ItemListing>(`/items/${itemId}/listings`, payload);
      const arr = this.listings[itemId] || [];
      this.listings[itemId] = [response.data, ...arr];
      return response.data;
    },

    async updateListing(id: number, payload: UpdateListingPayload): Promise<ItemListing> {
      const response = await apiClient.put<ItemListing>(`/listings/${id}`, payload);
      const itemId = response.data.itemId;
      const arr = this.listings[itemId] || [];
      const idx = arr.findIndex(l => l.id === id);
      if (idx !== -1) arr[idx] = response.data;
      this.listings[itemId] = [...arr];
      return response.data;
    },

    async deleteListing(id: number, itemId: string): Promise<void> {
      await apiClient.delete(`/listings/${id}`);
      const arr = this.listings[itemId] || [];
      this.listings[itemId] = arr.filter(l => l.id !== id);
    },
  },
});
