import { defineStore } from 'pinia';
import apiClient from '../services/api';

export type ItemStatus = 'InStock' | 'LoanedOut' | 'Disposed' | 'SuspectedMissing';

export interface Item {
  id: string;
  shortId: string;
  serialNumber?: string | null;
  itemDefinitionId: number;
  itemDefinitionName: string;
  categoryId?: number | null;
  categoryName?: string;
  warehouseId: number;
  warehouseName: string;
  ownerUserNames?: string[];
  ownerUserName?: string | null;
  status: ItemStatus;
  currentDestination?: string | null;
  expectedReturnDate?: string | null;
  remarks?: string | null;
  photoUrl?: string | null;
  itemValue?: number | null;
  entryDate: string;
  lastUpdated: string;

  itemDefinition?: { id: number; name: string; categoryId?: number | null; category?: { id: number; name: string } };
  warehouse?: { id: number; name: string };
  name?: string;
}

export interface CheckAnalysisResult {
  checkedItems: Item[];
  uncheckedItems: Item[];
}

interface CreateItemPayload {
  itemDefinitionId: number;
  warehouseId: number;
  ownerUserNames?: string[];
  shortId?: string;
  serialNumber?: string;
  remarks?: string;
  photo?: File | null;
  itemValue?: number | null;
}

interface UpdateItemPayload {
  shortId?: string;
  serialNumber?: string;
  remarks?: string;
  currentDestination?: string;
  expectedReturnDate?: string | null;
  clearExpectedReturnDate?: boolean;
  ownerUserNames?: string[];
  clearOwnerUser?: boolean;
  photo?: File | null;
  deletePhoto?: boolean;
  itemValue?: number | null;
}

interface ItemState {
  items: Item[];
  loading: boolean;
  error: string | null;
}

function normalizeItem(raw: any): Item {
  const itemDefinitionName = raw.itemDefinitionName ?? raw.itemDefinition?.name ?? '';
  const categoryId = raw.categoryId ?? raw.itemDefinition?.categoryId ?? raw.itemDefinition?.category?.id ?? null;
  const categoryName = raw.categoryName ?? raw.itemDefinition?.category?.name ?? '';
  const warehouseName = raw.warehouseName ?? raw.warehouse?.name ?? '';
  const ownerUserNames = normalizeOwnerNames(raw);

  return {
    id: String(raw.id),
    shortId: raw.shortId ?? '',
    serialNumber: raw.serialNumber ?? null,
    itemDefinitionId: Number(raw.itemDefinitionId ?? raw.itemDefinition?.id ?? 0),
    itemDefinitionName,
    categoryId: categoryId === null || categoryId === undefined ? null : Number(categoryId),
    categoryName,
    warehouseId: Number(raw.warehouseId ?? raw.warehouse?.id ?? 0),
    warehouseName,
    ownerUserNames,
    ownerUserName: raw.ownerUserName ?? (ownerUserNames.join(',') || null),
    status: raw.status,
    currentDestination: raw.currentDestination ?? null,
    expectedReturnDate: raw.expectedReturnDate ?? null,
    remarks: raw.remarks ?? null,
    photoUrl: raw.photoUrl ?? null,
    itemValue: raw.itemValue !== undefined ? raw.itemValue : null,
    entryDate: raw.entryDate ?? raw.lastUpdated ?? new Date().toISOString(),
    lastUpdated: raw.lastUpdated ?? new Date().toISOString(),

    itemDefinition: {
      id: Number(raw.itemDefinitionId ?? raw.itemDefinition?.id ?? 0),
      name: itemDefinitionName,
      categoryId: categoryId === null || categoryId === undefined ? null : Number(categoryId),
      category: categoryId === null || categoryId === undefined
        ? undefined
        : { id: Number(categoryId), name: categoryName },
    },
    warehouse: { id: Number(raw.warehouseId ?? raw.warehouse?.id ?? 0), name: warehouseName },
    name: itemDefinitionName,
  };
}

function normalizeOwnerNames(raw: any): string[] {
  if (Array.isArray(raw.ownerUserNames)) {
    return raw.ownerUserNames.map((name: unknown) => String(name).trim()).filter(Boolean);
  }

  const name = raw.ownerUserName ?? raw.ownerUser?.name;
  if (!name) return [];
  return String(name).split(/[，,]/).map(part => part.trim()).filter(Boolean);
}

function appendOwnerNames(formData: FormData, ownerUserNames?: string[]) {
  ownerUserNames?.forEach((name, index) => {
    const normalized = name.trim();
    if (normalized) formData.append(`OwnerUserNames[${index}]`, normalized);
  });
}

export const useItemStore = defineStore('item', {
  state: (): ItemState => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchItems(filters: {
      warehouseId?: number;
      categoryId?: number;
      status?: ItemStatus;
      id?: string;
      shortId?: string;
      serialNumber?: string;
      search?: string;
    } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.warehouseId) params.append('warehouseId', String(filters.warehouseId));
        if (filters.categoryId) params.append('categoryId', String(filters.categoryId));
        if (filters.status) params.append('status', filters.status);
        if (filters.id) params.append('id', filters.id);
        if (filters.shortId) params.append('shortId', filters.shortId);
        if (filters.serialNumber) params.append('serialNumber', filters.serialNumber);
        if (filters.search) params.append('search', filters.search);

        const response = await apiClient.get<Item[]>(`/items?${params.toString()}`);
        this.items = response.data.map(normalizeItem);
      } catch (err: any) {
        this.error = '获取库存失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchCheckAnalysis(filters: {
      warehouseId: number;
      categoryId?: number;
      search?: string;
      startAt: string;
      endAt: string;
    }): Promise<CheckAnalysisResult> {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({
          warehouseId: String(filters.warehouseId),
          startAt: filters.startAt,
          endAt: filters.endAt,
        });
        if (filters.categoryId) params.append('categoryId', String(filters.categoryId));
        if (filters.search?.trim()) params.append('search', filters.search.trim());

        const response = await apiClient.get<{
          checkedItems: unknown[];
          uncheckedItems: unknown[];
        }>(`/items/check-analysis?${params.toString()}`);

        return {
          checkedItems: (response.data.checkedItems || []).map(normalizeItem),
          uncheckedItems: (response.data.uncheckedItems || []).map(normalizeItem),
        };
      } catch (err: any) {
        this.error = '获取盘点分析失败: ' + (err.response?.data?.message || err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createItem(payload: CreateItemPayload): Promise<Item> {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('itemDefinitionId', String(payload.itemDefinitionId));
        formData.append('warehouseId', String(payload.warehouseId));
        appendOwnerNames(formData, payload.ownerUserNames);
        if (payload.shortId) formData.append('shortId', payload.shortId);
        if (payload.serialNumber) formData.append('serialNumber', payload.serialNumber);
        if (payload.remarks) formData.append('remarks', payload.remarks);
        if (payload.photo) formData.append('photo', payload.photo);
        if (payload.itemValue !== undefined && payload.itemValue !== null) formData.append('itemValue', String(payload.itemValue));

        await apiClient.post('/items/create', formData);
        await this.fetchItems({ shortId: payload.shortId });
        return this.items[0];
      } catch (err: any) {
        this.error = '创建物品失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateItem(itemId: string, payload: UpdateItemPayload) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('remarks', payload.remarks || '');
        if (payload.shortId) formData.append('shortId', payload.shortId);
        if (payload.serialNumber !== undefined) formData.append('serialNumber', payload.serialNumber || '');
        if (payload.currentDestination !== undefined) formData.append('currentDestination', payload.currentDestination || '');
        if (payload.expectedReturnDate !== undefined && payload.expectedReturnDate !== null) {
          formData.append('expectedReturnDate', payload.expectedReturnDate);
        }
        if (payload.clearExpectedReturnDate) formData.append('clearExpectedReturnDate', 'true');
        appendOwnerNames(formData, payload.ownerUserNames);
        if (payload.clearOwnerUser) formData.append('clearOwnerUser', 'true');
        if (payload.itemValue !== undefined && payload.itemValue !== null) {
          formData.append('itemValue', String(payload.itemValue));
        } else if (payload.itemValue === null) {
          formData.append('itemValue', '');
        }

        if (payload.photo) {
          formData.append('photo', payload.photo);
        } else if (payload.deletePhoto) {
          formData.append('deletePhoto', 'true');
        }

        await apiClient.put(`/items/${itemId}`, formData);
        await this.fetchItems({ id: itemId });
      } catch (err: any) {
        this.error = '更新物品失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateItemStatus(
      itemId: string,
      action: 'outbound' | 'check' | 'return' | 'dispose',
      destination?: string,
      permanentlyHidden = false,
      expectedReturnDate?: string | null
    ): Promise<Item | null> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/items/${itemId}/${action}`, { destination, permanentlyHidden, expectedReturnDate });
        if (response.status === 204 || !response.data) {
          this.items = this.items.filter(item => item.id !== itemId);
          return null;
        }

        const normalized = normalizeItem(response.data);
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
          this.items[index] = normalized;
        }
        return normalized;
      } catch (err: any) {
        this.error = `物品操作 '${action}' 失败: ` + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateExpectedReturnDate(itemId: string, expectedReturnDate: string): Promise<Item> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/items/${itemId}/expected-return`, {
          expectedReturnDate,
        });
        const normalized = normalizeItem(response.data);
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
          this.items[index] = normalized;
        }
        return normalized;
      } catch (err: any) {
        this.error = '重新设置预计回库时间失败: ' + (err.response?.data?.message || err.response?.data || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async hidePermanently(itemId: string) {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.put(`/items/${itemId}/hide-permanently`);
        this.items = this.items.filter(item => item.id !== itemId);
      } catch (err: any) {
        this.error = '转为永远不可见失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async transferWarehouse(itemId: string, newWarehouseId: number, remarks?: string): Promise<Item> {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/items/${itemId}/transfer`, {
          newWarehouseId,
          remarks,
        });

        const normalized = normalizeItem(response.data);
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
          this.items[index] = normalized;
        }

        return normalized;
      } catch (err: any) {
        this.error = '转移库房失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async transferWarehouseBatch(itemIds: string[], newWarehouseId: number, remarks?: string) {
      this.loading = true;
      this.error = null;
      try {
        const responses = await Promise.all(
          itemIds.map(id => apiClient.put(`/items/${id}/transfer`, { newWarehouseId, remarks }))
        );

        const result = responses.map(r => normalizeItem(r.data));
        result.forEach(item => {
          const index = this.items.findIndex(existing => existing.id === item.id);
          if (index !== -1) {
            this.items[index] = item;
          }
        });

        return result;
      } catch (err: any) {
        this.error = '批量转移库房失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateStatusBatch(itemIds: string[], status: ItemStatus) {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.post('/items/update-status/batch', { itemIds, status });
        this.items = this.items.map(item => {
          if (itemIds.includes(item.id)) {
            return { ...item, status };
          }
          return item;
        });
      } catch (err: any) {
        this.error = '批量更新状态失败: ' + (err.response?.data?.message || err.message);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});

export function getStatusText(status: ItemStatus) {
  switch (status) {
    case 'InStock':
      return '在库';
    case 'LoanedOut':
      return '借出';
    case 'Disposed':
      return '处置';
    case 'SuspectedMissing':
      return '疑似丢失';
    default:
      return '未知';
  }
}
