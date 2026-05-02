import { defineStore } from 'pinia';
import apiClient from '../services/api';

export type RentalStatus = 'Pending' | 'Active' | 'Overdue' | 'Returned' | 'Cancelled';
export type ShipmentDirection = 'Outbound' | 'Inbound';
export type ReturnCondition = 'Good' | 'MinorDamage' | 'MajorDamage' | 'Lost';

export interface RentalItem {
  id: number;
  itemId: string;
  itemShortIdSnapshot?: string | null;
  itemNameSnapshot?: string | null;
  perItemPrice?: number | null;
  returnedAt?: string | null;
  returnCondition?: ReturnCondition | null;
  returnNotes?: string | null;
  listingRemarks?: string | null;
}

export interface RentalShipment {
  id: number;
  direction: ShipmentDirection;
  originWarehouseId: number;
  originWarehouseName?: string | null;
  carrier: string;
  trackingNumber?: string | null;
  shippedAt: string;
  deliveredAt?: string | null;
  shippingFee?: number | null;
  notes?: string | null;
}

export interface SfRouteNode {
  acceptTime?: string | null;
  acceptAddress?: string | null;
  remark?: string | null;
  opCode?: string | null;
  firstStatusCode?: string | null;
  firstStatusName?: string | null;
  secondaryStatusCode?: string | null;
  secondaryStatusName?: string | null;
}

export interface SfShipmentRoute {
  shipmentId: number;
  trackingNumber: string;
  checkPhoneNo: string;
  queryable: boolean;
  fromCache: boolean;
  queriedAt?: string | null;
  serviceCode: string;
  trackingType: number;
  methodType: string;
  error?: string | null;
  deliveredAt?: string | null;
  autoDelivered: boolean;
  hasException: boolean;
  exceptionMessage?: string | null;
  routes: SfRouteNode[];
}

export interface SfRouteSyncResult {
  rental?: Rental | null;
  shipments: SfShipmentRoute[];
}

export interface SfPendingRouteRefreshResult {
  rentalCount: number;
  synced: number;
  autoDelivered: number;
  exceptionCount: number;
  errorCount: number;
  skippedCount: number;
}

export interface Rental {
  id: string;
  rentalNumber: string;
  status: RentalStatus;
  renterId: string;
  renter?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  startDate: string;
  expectedShipDate: string;
  expectedEndDate: string;
  actualEndDate?: string | null;
  totalPrice: number;
  deposit?: number | null;
  otherFee: number;
  totalShippingFee: number;
  accountedAmount: number;
  shippingAddress?: string | null;
  platformOrderNo?: string | null;
  notes?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
  items: RentalItem[];
  shipments: RentalShipment[];
}

export interface CreateRentalPayload {
  renter: {
    renterId?: string;
    name?: string;
    phone?: string;
    idCardNo?: string;
    xianyuId?: string;
    taobaoId?: string;
    xiaohongshuId?: string;
    defaultAddress?: string;
    notes?: string;
  };
  itemIds: string[];
  startDate?: string;
  expectedShipDate?: string;
  expectedEndDate: string;
  totalPrice: number;
  deposit?: number | null;
  otherFee?: number;
  shippingAddress?: string;
  platformOrderNo?: string;
  notes?: string;
  assignedTo?: string;
  allowScheduleConflict?: boolean;
}

export interface UpdateRentalPayload {
  renterId?: string;
  startDate?: string;
  expectedShipDate?: string;
  expectedEndDate?: string;
  totalPrice?: number;
  deposit?: number | null;
  otherFee?: number | null;
  shippingAddress?: string;
  platformOrderNo?: string;
  notes?: string;
  assignedTo?: string;
}

export interface ShipPayload {
  direction?: ShipmentDirection;
  originWarehouseId: number;
  carrier: string;
  trackingNumber?: string;
  shippedAt?: string;
  shippingFee?: number | null;
  notes?: string;
}

export interface DeliverPayload {
  deliveredAt?: string;
}

export interface ReturnPayload {
  rentalItemIds?: number[];
  condition?: ReturnCondition;
  notes?: string;
}

export interface BulkUpdateRentalItemPayload {
  rentalItemId: number;
  listingRemarks?: string | null;
  perItemPrice?: number | null;
}

export interface UpdateRentalItemsPayload {
  itemIds: string[];
  allowScheduleConflict?: boolean;
}

interface RentalState {
  rentals: Rental[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const useRentalStore = defineStore('rental', {
  state: (): RentalState => ({
    rentals: [],
    total: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchRentals(filters: {
      status?: RentalStatus;
      renterId?: string;
      rentalNumber?: string;
      startDateFrom?: string;
      startDateTo?: string;
      page?: number;
      pageSize?: number;
    } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.renterId) params.append('renterId', filters.renterId);
        if (filters.rentalNumber) params.append('rentalNumber', filters.rentalNumber);
        if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
        if (filters.startDateTo) params.append('startDateTo', filters.startDateTo);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

        const response = await apiClient.get<{ items: Rental[]; total: number }>(`/rentals?${params.toString()}`);
        this.rentals = response.data.items;
        this.total = response.data.total;
      } catch (err: any) {
        this.error = '获取租赁列表失败: ' + (err.response?.data?.message || err.message);
      } finally {
        this.loading = false;
      }
    },

    async getRental(id: string): Promise<Rental> {
      const response = await apiClient.get<Rental>(`/rentals/${id}`);
      return response.data;
    },

    async createRental(payload: CreateRentalPayload): Promise<Rental> {
      const response = await apiClient.post<Rental>('/rentals', payload);
      this.rentals.unshift(response.data);
      this.total += 1;
      return response.data;
    },

    async updateRental(id: string, payload: UpdateRentalPayload): Promise<Rental> {
      const response = await apiClient.put<Rental>(`/rentals/${id}`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    async ship(id: string, payload: ShipPayload): Promise<Rental> {
      const response = await apiClient.post<Rental>(`/rentals/${id}/ship`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    async deliver(id: string, shipmentId: number, payload: DeliverPayload = {}): Promise<Rental> {
      const response = await apiClient.post<Rental>(`/rentals/${id}/shipments/${shipmentId}/deliver`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    async fetchSfRoutes(id: string, refresh = false): Promise<SfRouteSyncResult> {
      const response = await apiClient.get<SfRouteSyncResult>(`/rentals/${id}/sf-routes?refresh=${refresh}`);
      if (response.data.rental) {
        this.replaceInList(response.data.rental);
      }
      return response.data;
    },

    async refreshPendingSfRoutes(): Promise<SfPendingRouteRefreshResult> {
      const response = await apiClient.post<SfPendingRouteRefreshResult>('/rentals/sf-routes/refresh-pending');
      return response.data;
    },

    async returnRental(id: string, payload: ReturnPayload): Promise<Rental> {
      const response = await apiClient.post<Rental>(`/rentals/${id}/return`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    async cancel(id: string, reason?: string): Promise<Rental> {
      const response = await apiClient.post<Rental>(`/rentals/${id}/cancel`, { reason });
      this.replaceInList(response.data);
      return response.data;
    },

    async bulkUpdateItems(id: string, items: BulkUpdateRentalItemPayload[]): Promise<Rental> {
      const response = await apiClient.put<Rental>(`/rentals/${id}/items/bulk`, { items });
      this.replaceInList(response.data);
      return response.data;
    },

    async updateRentalItems(id: string, payload: UpdateRentalItemsPayload): Promise<Rental> {
      const response = await apiClient.put<Rental>(`/rentals/${id}/items`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    replaceInList(rental: Rental) {
      const idx = this.rentals.findIndex(r => r.id === rental.id);
      if (idx !== -1) this.rentals[idx] = rental;
    },
  },
});
