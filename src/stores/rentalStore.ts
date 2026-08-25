import { defineStore } from 'pinia';
import apiClient from '../services/api';

export type RentalStatus = 'Pending' | 'PartiallyShipped' | 'Active' | 'Overdue' | 'Returned' | 'Cancelled' | 'Renewed';
export type ShipmentDirection = 'Outbound' | 'Inbound';
export type ReturnCondition = 'Good' | 'MinorDamage' | 'MajorDamage' | 'Lost';

export interface RentalItem {
  id: number;
  itemId?: string | null;
  itemDefinitionId?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
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
  items?: RentalShipmentItem[];
}

export interface RentalShipmentItem {
  rentalItemId: number;
  itemId?: string | null;
  itemShortIdSnapshot?: string | null;
  itemNameSnapshot?: string | null;
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
  expectedReturnDate?: string | null;
  actualEndDate?: string | null;
  hasRenewalIntent: boolean;
  renewalIntentEndDate?: string | null;
  totalPrice: number;
  deposit?: number | null;
  otherFee: number;
  totalShippingFee: number;
  accountedAmount: number;
  shippingAddress?: string | null;
  parsedShippingAddress?: SfParsedAddress | null;
  platformOrderNo?: string | null;
  paymentAccount?: string | null;
  renewedFromRentalId?: string | null;
  renewedFromRentalNumber?: string | null;
  renewedToRentalId?: string | null;
  renewedToRentalNumber?: string | null;
  renewalSequence?: number | null;
  isRenewal: boolean;
  notes?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  createdBy?: string | null;
  senderName?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
  settlementNotifiedAt?: string | null;
  settlementNotifiedStatus?: RentalStatus | string | null;
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
  itemDefinitionIds?: number[];
  itemPrices?: { itemId?: string; itemDefinitionId?: number; perItemPrice: number }[];
  startDate?: string;
  expectedShipDate?: string;
  expectedEndDate: string;
  expectedReturnDate?: string | null;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  totalPrice: number;
  deposit?: number | null;
  otherFee?: number;
  shippingAddress?: string;
  platformOrderNo?: string;
  notes?: string;
  paymentAccount?: string;
  assignedTo?: string;
  allowScheduleConflict?: boolean;
}

export interface UpdateRentalPayload {
  renterId?: string;
  startDate?: string;
  expectedShipDate?: string;
  expectedEndDate?: string;
  expectedReturnDate?: string | null;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  totalPrice?: number;
  deposit?: number | null;
  otherFee?: number | null;
  shippingAddress?: string;
  platformOrderNo?: string;
  notes?: string;
  paymentAccount?: string;
  assignedTo?: string;
  createdBy?: string;
  senderName?: string;
  allowScheduleConflict?: boolean;
}

export interface RenewRentalPayload {
  startDate?: string;
  expectedEndDate: string;
  totalPrice: number;
  deposit?: number | null;
  otherFee?: number;
  notes?: string;
  paymentAccount?: string;
  allowScheduleConflict?: boolean;
}

export interface RenewRentalResult {
  originalRental?: Rental | null;
  renewalRental?: Rental | null;
}

export interface ShipPayload {
  direction?: ShipmentDirection;
  originWarehouseId: number;
  carrier: string;
  trackingNumber?: string;
  shippedAt?: string;
  shippingFee?: number | null;
  notes?: string;
  allowOpenItemConflict?: boolean;
  rentalItemIds?: number[];
  itemSelections?: { rentalItemId: number; itemId: string }[];
}

export interface DeliverPayload {
  deliveredAt?: string;
}

export interface UpdateShipmentPayload {
  shippingFee?: number | null;
  itemSelections?: { rentalItemId: number; itemId: string }[];
}

export interface ReturnPayload {
  rentalItemIds?: number[];
  items?: { rentalItemId: number; condition?: ReturnCondition }[];
  condition?: ReturnCondition;
  notes?: string;
  repairOccupancy?: boolean;
  repairExpectedReturnDate?: string;
}

export interface BulkUpdateRentalItemPayload {
  rentalItemId: number;
  listingRemarks?: string | null;
  perItemPrice?: number | null;
}

export interface UpdateRentalItemsPayload {
  itemIds: string[];
  itemDefinitionIds?: number[];
  itemPrices?: { itemId?: string; itemDefinitionId?: number; perItemPrice: number }[];
  allowScheduleConflict?: boolean;
}

export interface SettlementOwnerShare {
  ownerName?: string | null;
  itemShortId?: string | null;
  itemName?: string | null;
  amount: number;
}

export interface SettlementShipperShare {
  shipperName?: string | null;
  amount: number;
}

export interface SettlementPreview {
  rentalId: string;
  rentalNumber: string;
  status: RentalStatus;
  totalPrice: number;
  accountedAmount: number;
  paymentAccount?: string | null;
  technicianPercent: number;
  technicianAmount: number;
  creatorPercent: number;
  creatorAmount: number;
  creatorName?: string | null;
  shipperPercent: number;
  shipperAmount: number;
  shipperShares: SettlementShipperShare[];
  itemOwnerPercent: number;
  itemOwnerAmount: number;
  ownerShares: SettlementOwnerShare[];
  markdownText: string;
  canSend: boolean;
  ineligibleReason?: string | null;
  settlementNotifiedAt?: string | null;
  settlementNotifiedStatus?: RentalStatus | string | null;
}

export interface BatchSendSettlementItemResult {
  rentalId: string;
  rentalNumber?: string | null;
  success: boolean;
  error?: string | null;
}

export interface BatchSendSettlementsResult {
  requested: number;
  succeeded: number;
  failed: number;
  results: BatchSendSettlementItemResult[];
}

export interface PaymentAccountSettings {
  defaultPaymentAccount?: string | null;
  paymentAccountPresets?: string[];
}

export interface SfParsedAddress {
  province?: string | null;
  city?: string | null;
  district?: string | null;
}

export interface RentalOwnerOptions {
  employees: string[];
}

export interface SfDeliveryProduct {
  businessType: string;
  businessTypeDesc: string;
  deliverTime?: string | null;
  fee?: number | null;
  searchPrice?: string | null;
  closeTime?: string | null;
  deliveryTime?: string | null;
  deliveryDays?: number | null;
  plannedDeliveryTime?: string | null;
  latestShipTime?: string | null;
  consignedTime: string;
}

export interface SfDeliveryWarehouseEstimate {
  warehouseId: number;
  warehouseName: string;
  address: string;
  source: SfParsedAddress;
  error?: string | null;
  products: SfDeliveryProduct[];
}

export interface SfDeliveryEstimateResult {
  destinationAddress: string;
  destination: SfParsedAddress;
  weight: number;
  consignedTime: string;
  targetDeliveryTime: string;
  warehouses: SfDeliveryWarehouseEstimate[];
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
      search?: string;
      rentalNumber?: string;
      startDateFrom?: string;
      startDateTo?: string;
      pendingSettlement?: boolean;
      ownerScope?: 'mine' | 'all';
      ownerName?: string;
      page?: number;
      pageSize?: number;
    } = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.renterId) params.append('renterId', filters.renterId);
        if (filters.search) params.append('search', filters.search);
        if (filters.rentalNumber) params.append('rentalNumber', filters.rentalNumber);
        if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
        if (filters.startDateTo) params.append('startDateTo', filters.startDateTo);
        if (filters.pendingSettlement) params.append('pendingSettlement', 'true');
        if (filters.ownerScope) params.append('ownerScope', filters.ownerScope);
        if (filters.ownerName) params.append('ownerName', filters.ownerName);
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

    async fetchOwnerOptions(): Promise<RentalOwnerOptions> {
      const response = await apiClient.get<RentalOwnerOptions>('/rentals/owner-options');
      return {
        employees: response.data.employees || [],
      };
    },

    async getRental(id: string): Promise<Rental> {
      const response = await apiClient.get<Rental>(`/rentals/${id}`);
      return response.data;
    },

    async fetchPaymentAccountSettings(): Promise<PaymentAccountSettings> {
      const response = await apiClient.get<PaymentAccountSettings>('/rentals/payment-account-default');
      return {
        defaultPaymentAccount: response.data.defaultPaymentAccount || '',
        paymentAccountPresets: response.data.paymentAccountPresets || [],
      };
    },

    async fetchDefaultPaymentAccount(): Promise<string> {
      const settings = await this.fetchPaymentAccountSettings();
      return settings.defaultPaymentAccount || '';
    },

    async querySfDeliveryEstimates(payload: {
      destinationAddress: string;
      sourceWarehouseIds?: number[];
      itemIds?: string[];
      startDate?: string;
      weight?: number;
    }): Promise<SfDeliveryEstimateResult> {
      const response = await apiClient.post<SfDeliveryEstimateResult>('/rentals/delivery-estimates', {
        ...payload,
        weight: payload.weight ?? 2.5,
      });
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

    async renewRental(id: string, payload: RenewRentalPayload): Promise<RenewRentalResult> {
      const response = await apiClient.post<RenewRentalResult>(`/rentals/${id}/renew`, payload);
      if (response.data.originalRental) this.replaceInList(response.data.originalRental);
      if (response.data.renewalRental) {
        const idx = this.rentals.findIndex(r => r.id === response.data.renewalRental!.id);
        if (idx === -1) {
          this.rentals.unshift(response.data.renewalRental);
          this.total += 1;
        } else {
          this.rentals[idx] = response.data.renewalRental;
        }
      }
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

    async updateShipment(id: string, shipmentId: number, payload: UpdateShipmentPayload): Promise<Rental> {
      const response = await apiClient.put<Rental>(`/rentals/${id}/shipments/${shipmentId}`, payload);
      this.replaceInList(response.data);
      return response.data;
    },

    async deleteShipment(id: string, shipmentId: number): Promise<Rental> {
      const response = await apiClient.delete<Rental>(`/rentals/${id}/shipments/${shipmentId}`);
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

    async fetchSettlement(id: string): Promise<SettlementPreview> {
      const response = await apiClient.get<SettlementPreview>(`/rentals/${id}/settlement`);
      return response.data;
    },

    async sendSettlement(id: string): Promise<SettlementPreview> {
      const response = await apiClient.post<SettlementPreview>(`/rentals/${id}/settlement/send`);
      return response.data;
    },

    async sendSettlements(rentalIds: string[]): Promise<BatchSendSettlementsResult> {
      const response = await apiClient.post<BatchSendSettlementsResult>('/rentals/settlements/send', { rentalIds });
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
