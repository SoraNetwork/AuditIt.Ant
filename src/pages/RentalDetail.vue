<template>
  <div>
    <a-page-header :title="`租赁详情 ${rental?.rentalNumber || ''}`" @back="$router.back()" />

    <a-card v-if="rental" :loading="loading" :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-descriptions bordered :column="isMobile ? 1 : 3" :size="isMobile ? 'small' : 'default'">
        <a-descriptions-item label="状态">
          <a-tag :color="statusColor(rental.status)">{{ rental.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="租客">{{ rental.renter?.name || rental.renterId }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ rental.assignedTo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="开始日期">{{ formatDate(rental.startDate) }}</a-descriptions-item>
        <a-descriptions-item label="预计结束">{{ formatDate(rental.expectedEndDate) }}</a-descriptions-item>
        <a-descriptions-item label="实际结束">{{ formatDate(rental.actualEndDate) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="总价">{{ formatMoney(rental.totalPrice) }}</a-descriptions-item>
        <a-descriptions-item label="押金">{{ formatMoney(rental.deposit) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="运费合计">{{ formatMoney(rental.totalShippingFee) }}</a-descriptions-item>
        <a-descriptions-item label="其他费用">{{ formatMoney(rental.otherFee) }}</a-descriptions-item>
        <a-descriptions-item label="核算金额">{{ formatMoney(rental.accountedAmount) }}</a-descriptions-item>
        <a-descriptions-item label="平台订单号">{{ rental.platformOrderNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="收货地址" :span="isMobile ? 1 : 3">{{ rental.shippingAddress || '-' }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="isMobile ? 1 : 3">{{ rental.notes || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDateTime(rental.createdAt) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDateTime(rental.updatedAt) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ rental.createdBy || '-' }}</a-descriptions-item>
      </a-descriptions>

      <div v-if="isMobile" class="mobile-summary-grid">
        <div class="mobile-summary-card">
          <div class="mobile-summary-label">状态</div>
          <div class="mobile-summary-value">{{ rental.status }}</div>
        </div>
        <div class="mobile-summary-card">
          <div class="mobile-summary-label">租客</div>
          <div class="mobile-summary-value">{{ rental.renter?.name || rental.renterId }}</div>
        </div>
        <div class="mobile-summary-card">
          <div class="mobile-summary-label">核算金额</div>
          <div class="mobile-summary-value">{{ formatMoney(rental.accountedAmount) }}</div>
        </div>
        <div class="mobile-summary-card">
          <div class="mobile-summary-label">平台订单号</div>
          <div class="mobile-summary-value">{{ rental.platformOrderNo || '-' }}</div>
        </div>
      </div>

      <a-divider />

      <div :class="isMobile ? 'mobile-grid-actions rental-actions' : 'rental-actions'">
        <a-button v-if="canEdit" @click="openEdit">编辑基础信息</a-button>
        <a-button v-if="canShip" type="primary" @click="openOutbound">登记发货</a-button>
        <a-tooltip :title="receiveDisabledReason" :open="canReceive ? false : undefined">
          <a-button :disabled="!canReceive" @click="openInbound">登记回货物流</a-button>
        </a-tooltip>
        <a-tooltip :title="returnDisabledReason" :open="canReturn ? false : undefined">
          <a-button :disabled="!canReturn" @click="returnVisible = true">登记归还</a-button>
        </a-tooltip>
        <a-button v-if="canCancel" danger @click="cancelVisible = true">取消租赁</a-button>
      </div>

      <a-divider>租赁商品</a-divider>

      <a-space style="margin-bottom: 12px" wrap :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
        <a-button :block="isMobile" @click="exportItemsXlsx">导出 xlsx</a-button>
        <a-upload :before-upload="importItemsXlsx" :show-upload-list="false" accept=".xlsx,.xls">
          <a-button :block="isMobile" :loading="importing">导入 xlsx</a-button>
        </a-upload>
        <a-button :block="isMobile" type="link" @click="downloadItemsTemplate">下载模板</a-button>
      </a-space>

      <a-table v-if="!isMobile" row-key="id" :columns="itemColumns" :data-source="rental.items" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'returnedAt'">
            {{ formatDateTime(record.returnedAt) || '-' }}
          </template>
          <template v-else-if="column.key === 'perItemPrice'">
            {{ formatMoney(record.perItemPrice) || '-' }}
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <MobileListCard v-for="item in rental.items" :key="item.id">
          <template #title>{{ item.itemShortIdSnapshot }} | {{ item.itemNameSnapshot }}</template>
          <template #tags>
            <a-tag v-if="item.returnCondition" :color="item.returnCondition === 'Good' ? 'green' : 'red'">
              {{ item.returnCondition }}
            </a-tag>
          </template>
          <template #meta>
            <div>单价：{{ formatMoney(item.perItemPrice) || '-' }}</div>
            <div v-if="item.listingRemarks">平台备注：{{ item.listingRemarks }}</div>
            <div v-if="item.returnedAt">归还时间：{{ formatDateTime(item.returnedAt) }}</div>
          </template>
        </MobileListCard>
        <a-empty v-if="!rental.items?.length" description="暂无商品" />
      </div>

      <a-divider>物流记录</a-divider>

      <a-table v-if="!isMobile" row-key="id" :columns="shipmentColumns" :data-source="rental.shipments" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'direction'">
            <a-tag :color="record.direction === 'Outbound' ? 'blue' : 'geekblue'">
              {{ record.direction === 'Outbound' ? '发货' : '回货' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'shippedAt'">
            {{ formatDateTime(record.shippedAt) || '-' }}
          </template>
          <template v-else-if="column.key === 'deliveredAt'">
            {{ formatDateTime(record.deliveredAt) || '-' }}
          </template>
          <template v-else-if="column.key === 'shippingFee'">
            {{ formatMoney(record.shippingFee) || '-' }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button v-if="!record.deliveredAt" type="link" @click="deliver(record.id)">标记签收</a-button>
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <MobileListCard v-for="shipment in rental.shipments" :key="shipment.id">
          <template #title>
            {{ shipment.carrier || '未知物流' }}
            <span v-if="shipment.trackingNumber" style="color: #999; font-weight: 400"> | {{ shipment.trackingNumber }}</span>
          </template>
          <template #tags>
            <a-tag :color="shipment.direction === 'Outbound' ? 'blue' : 'geekblue'">
              {{ shipment.direction === 'Outbound' ? '发货' : '回货' }}
            </a-tag>
          </template>
          <template #meta>
            <div v-if="shipment.originWarehouseName">仓库：{{ shipment.originWarehouseName }}</div>
            <div v-if="shipment.shippingFee">运费：{{ formatMoney(shipment.shippingFee) }}</div>
            <div v-if="shipment.shippedAt">发货时间：{{ formatDateTime(shipment.shippedAt) }}</div>
            <div v-if="shipment.deliveredAt">签收时间：{{ formatDateTime(shipment.deliveredAt) }}</div>
          </template>
          <template #footer v-if="!shipment.deliveredAt">
            <a-button size="small" type="primary" @click="deliver(shipment.id)">标记签收</a-button>
          </template>
        </MobileListCard>
        <a-empty v-if="!rental.shipments?.length" description="暂无物流" />
      </div>
    </a-card>
  </div>

  <a-modal v-model:open="shipVisible" :title="shipModalTitle" ok-text="提交" cancel-text="取消" @ok="submitShip">
    <a-form layout="vertical">
      <a-form-item :label="shipForm.direction === 'Outbound' ? '发货仓库' : '回货仓库'" required>
        <a-select v-model:value="shipForm.originWarehouseId" placeholder="选择仓库">
          <a-select-option v-for="warehouse in warehouseStore.warehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="物流公司" required>
        <a-auto-complete
          v-model:value="shipForm.carrier"
          :options="carrierOptions"
          placeholder="选择或输入物流公司"
          :filter-option="filterCarrier"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="运单号">
        <MobileScanInput v-model="shipForm.trackingNumber" placeholder="填写运单号" />
      </a-form-item>
      <a-form-item label="运费">
        <a-input-number v-model:value="shipForm.shippingFee" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="shipForm.notes" :rows="2" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="returnVisible" title="登记归还" ok-text="提交" cancel-text="取消" @ok="submitReturn">
    <a-form layout="vertical">
      <a-form-item label="归还状态">
        <a-select v-model:value="returnForm.condition">
          <a-select-option value="Good">Good</a-select-option>
          <a-select-option value="MinorDamage">MinorDamage</a-select-option>
          <a-select-option value="MajorDamage">MajorDamage</a-select-option>
          <a-select-option value="Lost">Lost</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="returnForm.notes" :rows="2" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="cancelVisible" title="取消租赁" ok-text="确认" cancel-text="取消" @ok="submitCancel">
    <a-form layout="vertical">
      <a-form-item label="取消原因">
        <a-textarea v-model:value="cancelReason" :rows="3" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="editVisible" title="编辑基础信息" ok-text="保存" cancel-text="取消" :confirm-loading="saving" @ok="submitEdit">
    <a-form layout="vertical">
      <a-form-item label="租客">
        <a-select
          v-model:value="editForm.renterId"
          show-search
          option-filter-prop="label"
          :options="renterOptions"
          :loading="renterStore.loading"
          placeholder="选择租客"
        />
      </a-form-item>
      <a-form-item label="开始日期">
        <a-date-picker v-model:value="editForm.startDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="预计结束日期">
        <a-date-picker v-model:value="editForm.expectedEndDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="总价">
        <a-input-number v-model:value="editForm.totalPrice" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="押金">
        <a-input-number v-model:value="editForm.deposit" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="其他费用">
        <a-input-number v-model:value="editForm.otherFee" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="核算金额">
        <a-input :value="formatMoney(editAccountedAmount)" disabled />
      </a-form-item>
      <a-form-item label="收货地址">
        <a-input v-model:value="editForm.shippingAddress" :maxlength="500" />
      </a-form-item>
      <a-form-item label="平台订单号">
        <a-input v-model:value="editForm.platformOrderNo" :maxlength="100" />
      </a-form-item>
      <a-form-item label="负责人">
        <a-select
          v-model:value="editForm.assignedUsers"
          mode="multiple"
          placeholder="选择负责人"
          :options="userOptions"
          :loading="userStore.loading"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="editForm.notes" :rows="3" :maxlength="500" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useRentalStore, type BulkUpdateRentalItemPayload, type Rental, type ReturnCondition, type ShipmentDirection } from '../stores/rentalStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useUserStore } from '../stores/userStore';
import { useRenterStore } from '../stores/renterStore';
import { formatDateTime } from '../utils/formatters';
import { exportToXlsx, parseXlsxFile } from '../utils/xlsx';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import MobileScanInput from '../components/mobile/MobileScanInput.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const route = useRoute();
const rentalStore = useRentalStore();
const warehouseStore = useWarehouseStore();
const userStore = useUserStore();
const renterStore = useRenterStore();

const rental = ref<Rental | null>(null);
const loading = ref(false);
const shipVisible = ref(false);
const returnVisible = ref(false);
const cancelVisible = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const importing = ref(false);

const userOptions = computed(() =>
  userStore.users.map(user => ({ label: user.name, value: user.name }))
);

const renterOptions = computed(() =>
  renterStore.renters.map(renter => ({
    label: `${renter.name}${renter.phone ? ` / ${renter.phone}` : ''}`,
    value: renter.id,
  }))
);

const editForm = reactive({
  renterId: undefined as string | undefined,
  startDate: null as Dayjs | null,
  expectedEndDate: null as Dayjs | null,
  totalPrice: null as number | null,
  deposit: null as number | null,
  otherFee: 0,
  shippingAddress: '',
  platformOrderNo: '',
  assignedUsers: [] as string[],
  notes: '',
});

const editAccountedAmount = computed(() =>
  Number(editForm.totalPrice || 0)
  - Number(rental.value?.totalShippingFee || 0)
  - Number(editForm.otherFee || 0)
);

const shipForm = reactive({
  direction: 'Outbound' as ShipmentDirection,
  originWarehouseId: undefined as number | undefined,
  carrier: '',
  trackingNumber: '',
  shippingFee: null as number | null,
  notes: '',
});

const returnForm = reactive({
  condition: 'Good' as ReturnCondition,
  notes: '',
});

const cancelReason = ref('');

const carrierOptions = [
  { value: '顺丰速运' },
  { value: '顺丰同城' },
  { value: '中通快递' },
  { value: '圆通速递' },
  { value: '申通快递' },
  { value: '韵达快递' },
  { value: '京东物流' },
  { value: '德邦快递' },
  { value: '邮政 EMS' },
  { value: '极兔速递' },
  { value: '菜鸟裹裹' },
  { value: '其他' },
];

const filterCarrier = (input: string, option: { value: string }) =>
  !!option.value && option.value.toLowerCase().includes(input.toLowerCase());

const itemColumns = [
  { title: '商品 ID', dataIndex: 'itemShortIdSnapshot', key: 'itemShortIdSnapshot' },
  { title: '名称', dataIndex: 'itemNameSnapshot', key: 'itemNameSnapshot' },
  { title: '单价', dataIndex: 'perItemPrice', key: 'perItemPrice', width: 120 },
  { title: '平台备注', dataIndex: 'listingRemarks', key: 'listingRemarks' },
  { title: '归还时间', dataIndex: 'returnedAt', key: 'returnedAt', width: 180 },
  { title: '归还状态', dataIndex: 'returnCondition', key: 'returnCondition', width: 140 },
];

const shipmentColumns = [
  { title: '方向', dataIndex: 'direction', key: 'direction', width: 90 },
  { title: '仓库', dataIndex: 'originWarehouseName', key: 'originWarehouseName', width: 160 },
  { title: '物流公司', dataIndex: 'carrier', key: 'carrier', width: 140 },
  { title: '运单号', dataIndex: 'trackingNumber', key: 'trackingNumber', width: 180 },
  { title: '运费', dataIndex: 'shippingFee', key: 'shippingFee', width: 100 },
  { title: '发货时间', dataIndex: 'shippedAt', key: 'shippedAt', width: 180 },
  { title: '签收时间', dataIndex: 'deliveredAt', key: 'deliveredAt', width: 180 },
  { title: '操作', key: 'actions', width: 100 },
];

const isRentalClosed = computed(() =>
  !!rental.value && ['Returned', 'Cancelled'].includes(rental.value.status)
);

const hasOutboundShipment = computed(() =>
  !!rental.value?.shipments?.some(shipment => shipment.direction === 'Outbound')
);

const hasDeliveredOutbound = computed(() =>
  !!rental.value?.shipments?.some(shipment => shipment.direction === 'Outbound' && !!shipment.deliveredAt)
);

const canShip = computed(() => !!rental.value && !isRentalClosed.value);
const canReceive = computed(() => !!rental.value && !isRentalClosed.value && hasDeliveredOutbound.value);
const canReturn = computed(() => !!rental.value && !isRentalClosed.value && hasOutboundShipment.value);
const canCancel = computed(() => !!rental.value && !isRentalClosed.value);
const canEdit = computed(() => !!rental.value && !isRentalClosed.value);

const receiveDisabledReason = computed(() => {
  if (isRentalClosed.value) return '租赁单已结束，不能再登记回货物流';
  if (!hasDeliveredOutbound.value) return '请先完成发货并签收后再登记回货物流';
  return '';
});

const returnDisabledReason = computed(() => {
  if (isRentalClosed.value) return '租赁单已结束，不能再登记归还';
  if (!hasOutboundShipment.value) return '租赁尚未发货，不能直接登记归还';
  return '';
});

const shipModalTitle = computed(() =>
  shipForm.direction === 'Outbound' ? '登记发货' : '登记回货物流'
);

const statusColor = (status: string) => {
  if (status === 'Pending') return 'default';
  if (status === 'Active') return 'blue';
  if (status === 'Overdue') return 'red';
  if (status === 'Returned') return 'green';
  return 'orange';
};

const formatDate = (value?: string | null) =>
  value ? formatDateTime(value, 'YYYY-MM-DD') : '';

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) return '';
  return `￥${Number(value).toFixed(1)}`;
};

const resetShipForm = (direction: ShipmentDirection) => {
  shipForm.direction = direction;
  shipForm.originWarehouseId = undefined;
  shipForm.carrier = '';
  shipForm.trackingNumber = '';
  shipForm.shippingFee = null;
  shipForm.notes = '';
};

const openOutbound = () => {
  resetShipForm('Outbound');
  shipVisible.value = true;
};

const openInbound = () => {
  resetShipForm('Inbound');
  shipVisible.value = true;
};

const load = async () => {
  const id = String(route.params.id);
  loading.value = true;
  try {
    rental.value = await rentalStore.getRental(id);
  } finally {
    loading.value = false;
  }
};

const submitShip = async () => {
  if (!rental.value) return;
  if (!shipForm.originWarehouseId || !shipForm.carrier.trim()) {
    message.error('请填写仓库和物流公司');
    return;
  }

  try {
    await rentalStore.ship(rental.value.id, {
      direction: shipForm.direction,
      originWarehouseId: shipForm.originWarehouseId,
      carrier: shipForm.carrier.trim(),
      trackingNumber: shipForm.trackingNumber.trim() || undefined,
      shippingFee: shipForm.shippingFee,
      notes: shipForm.notes.trim() || undefined,
    });
    shipVisible.value = false;
    message.success(shipForm.direction === 'Outbound' ? '发货登记成功' : '回货物流登记成功');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '提交失败');
  }
};

const deliver = async (shipmentId: number) => {
  if (!rental.value) return;

  try {
    await rentalStore.deliver(rental.value.id, shipmentId, {});
    message.success('已标记签收');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '操作失败');
  }
};

const submitReturn = async () => {
  if (!rental.value) return;

  try {
    await rentalStore.returnRental(rental.value.id, {
      condition: returnForm.condition,
      notes: returnForm.notes.trim() || undefined,
    });
    returnVisible.value = false;
    message.success('归还登记成功');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '归还失败');
  }
};

const submitCancel = async () => {
  if (!rental.value) return;

  try {
    await rentalStore.cancel(rental.value.id, cancelReason.value.trim() || undefined);
    cancelVisible.value = false;
    message.success('租赁已取消');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '取消失败');
  }
};

const openEdit = () => {
  if (!rental.value) return;
  editForm.expectedEndDate = rental.value.expectedEndDate ? dayjs(rental.value.expectedEndDate) : null;
  editForm.startDate = rental.value.startDate ? dayjs(rental.value.startDate) : null;
  editForm.renterId = rental.value.renterId;
  editForm.totalPrice = rental.value.totalPrice ?? null;
  editForm.deposit = rental.value.deposit ?? null;
  editForm.otherFee = rental.value.otherFee ?? 0;
  editForm.shippingAddress = rental.value.shippingAddress || '';
  editForm.platformOrderNo = rental.value.platformOrderNo || '';
  editForm.assignedUsers = (rental.value.assignedTo || '')
    .split(/[,;，；]/)
    .map(value => value.trim())
    .filter(Boolean);
  editForm.notes = rental.value.notes || '';
  editVisible.value = true;
};

const submitEdit = async () => {
  if (!rental.value) return;
  if (!editForm.startDate || !editForm.expectedEndDate) {
    message.error('开始日期和预计结束日期不能为空');
    return;
  }

  if (!editForm.renterId) {
    message.error('请选择租客');
    return;
  }

  saving.value = true;
  try {
    await rentalStore.updateRental(rental.value.id, {
      renterId: editForm.renterId,
      startDate: editForm.startDate.toISOString(),
      expectedEndDate: editForm.expectedEndDate.toISOString(),
      totalPrice: editForm.totalPrice ?? undefined,
      deposit: editForm.deposit,
      otherFee: editForm.otherFee,
      shippingAddress: editForm.shippingAddress.trim(),
      platformOrderNo: editForm.platformOrderNo.trim(),
      notes: editForm.notes.trim(),
      assignedTo: editForm.assignedUsers.join(','),
    });
    editVisible.value = false;
    message.success('已保存');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const exportItemsXlsx = () => {
  if (!rental.value) return;

  const rows = rental.value.items.map(item => ({
    RentalItemId: item.id,
    商品ID: item.itemShortIdSnapshot || '',
    名称: item.itemNameSnapshot || '',
    单价: item.perItemPrice ?? '',
    平台备注: item.listingRemarks || '',
    归还时间: formatDateTime(item.returnedAt) || '',
    归还状态: item.returnCondition || '',
  }));

  const filename = `租赁商品-${rental.value.rentalNumber}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  exportToXlsx(rows, filename, '租赁商品');
};

const downloadItemsTemplate = () => {
  if (!rental.value) return;

  const rows = rental.value.items.map(item => ({
    RentalItemId: item.id,
    商品ID: item.itemShortIdSnapshot || '',
    名称: item.itemNameSnapshot || '',
    单价: item.perItemPrice ?? '',
    平台备注: item.listingRemarks || '',
  }));

  exportToXlsx(rows, `租赁商品模板-${rental.value.rentalNumber}.xlsx`, '租赁商品');
};

const importItemsXlsx = async (file: File) => {
  if (!rental.value) return false;

  importing.value = true;
  try {
    const raw = await parseXlsxFile<Record<string, any>>(file);
    const updates: BulkUpdateRentalItemPayload[] = [];

    for (const row of raw) {
      const idRaw = row.RentalItemId ?? row.rentalItemId ?? row.ID ?? row.id;
      const rentalItemId = Number(idRaw);
      if (!Number.isFinite(rentalItemId) || rentalItemId <= 0) continue;

      const payload: BulkUpdateRentalItemPayload = { rentalItemId };
      const remarksRaw = row['平台备注'] ?? row.listingRemarks;
      if (remarksRaw !== undefined) {
        payload.listingRemarks = String(remarksRaw ?? '').trim();
      }

      const priceRaw = row['单价'] ?? row.perItemPrice;
      if (priceRaw !== undefined && priceRaw !== '' && priceRaw !== null) {
        const price = Number(priceRaw);
        if (Number.isFinite(price) && price >= 0) {
          payload.perItemPrice = price;
        }
      }

      updates.push(payload);
    }

    if (updates.length === 0) {
      message.warning('没有可导入的数据，请检查 RentalItemId 列');
      return false;
    }

    await rentalStore.bulkUpdateItems(rental.value.id, updates);
    message.success(`已更新 ${updates.length} 条商品数据`);
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '导入失败');
  } finally {
    importing.value = false;
  }

  return false;
};

onMounted(async () => {
  await Promise.all([
    warehouseStore.fetchWarehouses(),
    userStore.fetchUsers({ status: 'Active', limit: 200 }),
    renterStore.fetchRenters('', 300),
  ]);
  await load();
});
</script>

<style scoped>
.rental-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.rental-actions :deep(.ant-btn) {
  min-width: 120px;
}
</style>
