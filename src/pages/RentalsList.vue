<template>
  <div>
    <a-page-header title="租赁列表" sub-title="查看和筛选租赁单" />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="toolbar">
        <a-space wrap :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
          <a-select
            v-model:value="status"
            allow-clear
            :style="isMobile ? { width: '100%' } : { width: '160px' }"
            placeholder="状态"
            @change="search"
          >
            <a-select-option v-for="item in rentalStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
          <a-select
            v-model:value="ownerScope"
            :style="isMobile ? { width: '100%' } : { width: '180px' }"
            @change="handleOwnerScopeChange"
          >
            <a-select-option value="mine">我的单子</a-select-option>
            <a-select-option value="all">全部单子</a-select-option>
            <a-select-option value="person">指定人员的单子</a-select-option>
          </a-select>
          <a-select
            v-if="ownerScope === 'person'"
            v-model:value="ownerRole"
            :style="isMobile ? { width: '100%' } : { width: '170px' }"
            @change="handleOwnerRoleChange"
          >
            <a-select-option value="either">创建人或负责人</a-select-option>
            <a-select-option value="creator">仅创建人</a-select-option>
            <a-select-option value="assignee">仅负责人</a-select-option>
          </a-select>
          <a-select
            v-if="ownerScope === 'person'"
            v-model:value="ownerName"
            show-search
            allow-clear
            :loading="ownerOptionsLoading"
            :options="filteredOwnerOptions"
            :style="isMobile ? { width: '100%' } : { width: '160px' }"
            placeholder="选择人员"
            @change="handleOwnerNameChange"
          </a-select>
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索租客 / 单号 / 物品"
            :style="isMobile ? { width: '100%' } : { width: '240px' }"
          />
          <a-checkbox v-model:checked="pendingSettlement" @change="search">待结算</a-checkbox> 
          <a-button :block="isMobile" @click="search">查询</a-button>
        </a-space>
        <a-space :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%', marginTop: '8px' } : {}">
          <a-button
            v-if="canRefreshSfRoutes"
            :block="isMobile"
            :loading="sfBulkRefreshing"
            @click="refreshPendingSfRoutes"
          >
            刷新全部顺丰路由
          </a-button>
          <a-button :block="isMobile" @click="exportRentalsXlsx">批量导出 XLSX</a-button>
          <a-button type="primary" :block="isMobile" @click="$router.push('/rentals/new')">
            新建租赁
          </a-button>
        </a-space>
      </div>

      <a-table
        v-if="!isMobile"
        row-key="id"
        :loading="rentalStore.loading"
        :columns="columns"
        :data-source="sortedRentals"
        :pagination="false"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rentalNumber'">
            <router-link :to="`/rentals/${record.id}`">{{ record.rentalNumber }}</router-link>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="rentalDisplayStatusColor(record)">{{ rentalDisplayStatusText(record) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'renter'">
            <RenterLink :renter-id="record.renterId" :name="record.renter?.name" />
          </template>
          <template v-else-if="column.key === 'items'">
            <div class="item-info-list">
              <span v-for="item in record.items" :key="item.id" class="item-info-chip">
                {{ item.itemShortIdSnapshot || '-' }} / {{ item.itemNameSnapshot || '-' }}
              </span>
            </div>
          </template>
          <template v-else-if="column.key === 'expectedShipDate'">
            {{ formatDateTime(record.expectedShipDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'startDate'">
            {{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'expectedEndDate'">
            {{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'expectedReturnDate'">
            {{ formatDateTime(record.expectedReturnDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'renewalIntent'">
            <a-tag :color="record.hasRenewalIntent ? 'blue' : 'default'">
              {{ renewalIntentText(record) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'totalPrice'">
            {{ record.totalPrice != null ? `￥${Number(record.totalPrice).toFixed(1)}` : '-' }}
          </template>
          <template v-else-if="column.key === 'accountedAmount'">
            {{ record.accountedAmount != null ? `￥${Number(record.accountedAmount).toFixed(1)}` : '-' }}
          </template>
          <template v-else-if="column.key === 'dailyPrice'">
            {{ formatMoney(dailyAccountedAmount(record)) }}
          </template>
          <template v-else-if="column.key === 'paymentAccount'">
            {{ record.paymentAccount || '未填写' }}
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <div class="mobile-sort-toolbar">
          <span class="mobile-sort-label">排序</span>
          <a-space wrap>
            <a-button
              v-for="item in sortableDateOptions"
              :key="item.value"
              size="small"
              :type="sortField === item.value ? 'primary' : 'default'"
              @click="setSortField(item.value)"
            >
              {{ item.label }}
            </a-button>
            <a-button size="small" :disabled="!sortField" @click="toggleSortOrder">
              {{ sortOrder === 'descend' ? '降序' : '升序' }}
            </a-button>
            <a-button v-if="sortField" size="small" @click="clearSort">默认</a-button>
          </a-space>
        </div>
        <a-skeleton :loading="rentalStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard
            v-for="record in sortedRentals"
            :key="record.id"
            clickable
            @click="$router.push(`/rentals/${record.id}`)"
          >
            <template #title>{{ record.rentalNumber }}</template>
            <template #tags>
              <a-tag :color="rentalDisplayStatusColor(record)">{{ rentalDisplayStatusText(record) }}</a-tag>
            </template>
            <template #meta>
              <div>租客：<RenterLink :renter-id="record.renterId" :name="record.renter?.name" /></div>
              <div>预计发货：{{ formatDateTime(record.expectedShipDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>开始：{{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>预计结束：{{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>预计回货：{{ formatDateTime(record.expectedReturnDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>续租意愿：{{ renewalIntentText(record) }}</div>
              <div>物品：{{ itemSummary(record) }}</div>
              <div>平台订单号：{{ record.platformOrderNo || '-' }}</div>
              <div>到账账户：{{ record.paymentAccount || '未填写' }}</div>
              <div class="mobile-money-row">
                <span><em>总价</em><strong>{{ formatMoney(record.totalPrice) }}</strong></span>
                <span><em>核算</em><strong>{{ formatMoney(record.accountedAmount) }}</strong></span>
                <span><em>日均</em><strong>{{ formatMoney(dailyAccountedAmount(record)) }}</strong></span>
              </div>
              <div v-if="record.assignedTo">负责人：{{ record.assignedTo }}</div>
              <div>创建人：{{ record.createdBy || '-' }}</div>
            </template>
          </MobileListCard>
          <a-empty v-if="sortedRentals.length === 0 && !rentalStore.loading" description="暂无租赁记录" />
        </a-skeleton>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useRentalStore, type Rental, type RentalStatus } from '../stores/rentalStore';
import { formatDateTime } from '../utils/formatters';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RenterLink from '../components/RenterLink.vue';
import { exportToXlsx } from '../utils/xlsx';
import { useAuthStore } from '../stores/authStore';
import { PermissionCodes } from '../utils/permissions';
import { rentalDisplayStatusColor, rentalDisplayStatusText, rentalStatusText } from '../utils/rentalDisplay';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const rentalStore = useRentalStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const status = ref<RentalStatus | undefined>(undefined);
const searchKeyword = ref('');
const pendingSettlement = ref(false);
type OwnerScope = 'mine' | 'all' | 'person';
type OwnerRole = 'either' | 'creator' | 'assignee';
const ownerScope = ref<OwnerScope>('mine');
const ownerRole = ref<OwnerRole>('either');
const ownerName = ref<string>();
const ownerOptionsLoading = ref(false);
const creatorOptions = ref<string[]>([]);
const assigneeOptions = ref<string[]>([]);
const sfBulkRefreshing = ref(false);
const rentalStatuses: RentalStatus[] = ['Pending', 'PartiallyShipped', 'Active', 'Overdue', 'Returned', 'Cancelled', 'Renewed'];
const rentalStatusOptions = rentalStatuses.map(value => ({ value, label: rentalStatusText(value) }));
const canRefreshSfRoutes = computed(() => authStore.hasPermission(PermissionCodes.RentalShip));
const filteredOwnerOptions = computed(() => {
  const names = ownerRole.value === 'creator'
    ? creatorOptions.value
    : ownerRole.value === 'assignee'
      ? assigneeOptions.value
      : Array.from(new Set([...creatorOptions.value, ...assigneeOptions.value])).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return names.map(name => ({ label: name, value: name }));
});

type RentalDateSortField = 'expectedShipDate' | 'startDate' | 'expectedEndDate' | 'expectedReturnDate';
type RentalSortOrder = 'ascend' | 'descend';

interface TableSorter {
  field?: string;
  columnKey?: string;
  order?: RentalSortOrder | null;
}

const sortableDateOptions: { value: RentalDateSortField; label: string }[] = [
  { value: 'expectedShipDate', label: '预计发货' },
  { value: 'startDate', label: '开始日期' },
  { value: 'expectedEndDate', label: '预计结束' },
  { value: 'expectedReturnDate', label: '预计回货' },
];

const sortableDateFields = sortableDateOptions.map(item => item.value);
const sortField = ref<RentalDateSortField | undefined>(undefined);
const sortOrder = ref<RentalSortOrder | undefined>(undefined);

const compareDateField = (a: Rental, b: Rental, field: RentalDateSortField, order: RentalSortOrder = 'ascend') => {
  const aTime = dateSortValue(a[field]);
  const bTime = dateSortValue(b[field]);
  if (aTime === bTime) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return (aTime - bTime) * (order === 'ascend' ? 1 : -1);
};

const getDateColumnSortOrder = (field: RentalDateSortField) =>
  sortField.value === field ? sortOrder.value : null;

const columns = computed(() => [
  { title: '租赁单号', dataIndex: 'rentalNumber', key: 'rentalNumber', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '租客', key: 'renter', width: 160 },
  { title: '物品信息', key: 'items', width: 260 },
  {
    title: '预计发货',
    dataIndex: 'expectedShipDate',
    key: 'expectedShipDate',
    width: 140,
    sorter: true,
    sortOrder: getDateColumnSortOrder('expectedShipDate'),
  },
  {
    title: '开始日期',
    dataIndex: 'startDate',
    key: 'startDate',
    width: 140,
    sorter: true,
    sortOrder: getDateColumnSortOrder('startDate'),
  },
  {
    title: '预计结束',
    dataIndex: 'expectedEndDate',
    key: 'expectedEndDate',
    width: 140,
    sorter: true,
    sortOrder: getDateColumnSortOrder('expectedEndDate'),
  },
  {
    title: '预计回货',
    dataIndex: 'expectedReturnDate',
    key: 'expectedReturnDate',
    width: 140,
    sorter: true,
    sortOrder: getDateColumnSortOrder('expectedReturnDate'),
  },
  { title: '续租意愿', key: 'renewalIntent', width: 150 },
  { title: '平台订单号', dataIndex: 'platformOrderNo', key: 'platformOrderNo', width: 180 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120 },
  { title: '核算金额', dataIndex: 'accountedAmount', key: 'accountedAmount', width: 120 },
  { title: '到账账户', dataIndex: 'paymentAccount', key: 'paymentAccount', width: 150 },
  { title: '日均', key: 'dailyPrice', width: 110 },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 140 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 160 },
]);

const dateSortValue = (value?: string | null) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const sortedRentals = computed(() => {
  if (!sortField.value || !sortOrder.value) return rentalStore.rentals;

  const originalIndex = new Map(rentalStore.rentals.map((rental, index) => [rental.id, index]));
  return [...rentalStore.rentals].sort((a, b) => {
    const result = compareDateField(a, b, sortField.value!, sortOrder.value);
    if (result !== 0) return result;
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
  });
});

const readQueryString = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return typeof value === 'string' ? value : '';
};

const readQueryStatus = (value: unknown): RentalStatus | undefined => {
  const nextStatus = readQueryString(value);
  return rentalStatuses.includes(nextStatus as RentalStatus) ? (nextStatus as RentalStatus) : undefined;
};

const readQuerySortField = (value: unknown): RentalDateSortField | undefined => {
  const nextField = readQueryString(value);
  return sortableDateFields.includes(nextField as RentalDateSortField) ? (nextField as RentalDateSortField) : undefined;
};

const readQuerySortOrder = (value: unknown): RentalSortOrder | undefined => {
  const nextOrder = readQueryString(value);
  return nextOrder === 'ascend' || nextOrder === 'descend' ? nextOrder : undefined;
};

const applyQueryFilters = () => {
  status.value = readQueryStatus(route.query.status);
  searchKeyword.value = readQueryString(route.query.search || route.query.rentalNumber);
  pendingSettlement.value = readQueryString(route.query.pendingSettlement).toLowerCase() === 'true';
  const nextOwnerScope = readQueryString(route.query.ownerScope);
  const nextOwnerRole = readQueryString(route.query.ownerRole);
  const nextOwnerName = readQueryString(route.query.ownerName).trim();
  const hasPersonFilter = nextOwnerScope === 'person'
    && (nextOwnerRole === 'either' || nextOwnerRole === 'creator' || nextOwnerRole === 'assignee')
    && Boolean(nextOwnerName);
  ownerScope.value = hasPersonFilter
    ? 'person'
    : (searchKeyword.value.trim() || nextOwnerScope === 'all' ? 'all' : 'mine');
  ownerRole.value = nextOwnerRole === 'creator' || nextOwnerRole === 'assignee' ? nextOwnerRole : 'either';
  ownerName.value = hasPersonFilter ? nextOwnerName : undefined;
  sortField.value = readQuerySortField(route.query.sortField);
  sortOrder.value = sortField.value ? readQuerySortOrder(route.query.sortOrder) || 'ascend' : undefined;
};

const fetchList = async () => {
  await rentalStore.fetchRentals({
    status: status.value,
    search: searchKeyword.value.trim() || undefined,
    pendingSettlement: pendingSettlement.value,
    ownerScope: ownerScope.value === 'mine' ? 'mine' : 'all',
    ownerName: ownerScope.value === 'person' && ownerRole.value === 'either' ? ownerName.value : undefined,
    createdBy: ownerScope.value === 'person' && ownerRole.value === 'creator' ? ownerName.value : undefined,
    assignedTo: ownerScope.value === 'person' && ownerRole.value === 'assignee' ? ownerName.value : undefined,
    page: 1,
    pageSize: 100,
  });
};

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `￥${Number(value).toFixed(1)}`;
};

const rentalDays = (record: Rental) => {
  const start = new Date(`${formatDateTime(record.startDate, 'YYYY-MM-DD')}T00:00:00`);
  const end = new Date(`${formatDateTime(record.expectedEndDate, 'YYYY-MM-DD')}T00:00:00`);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return 1;
  return Math.max(1, Math.round((end.valueOf() - start.valueOf()) / 86400000) + 1);
};

const dailyAccountedAmount = (record: Rental) =>
  Number(record.accountedAmount || 0) / rentalDays(record);

const renewalIntentText = (record: Rental) =>
  record.hasRenewalIntent && record.renewalIntentEndDate
    ? `是，至 ${formatDateTime(record.renewalIntentEndDate, 'YYYY-MM-DD') || '-'}`
    : '否';

const itemSummary = (record: Rental) => {
  if (!record.items?.length) return '-';
  const items = record.items.map(item => `${item.itemShortIdSnapshot || '-'} / ${item.itemNameSnapshot || '-'}`);
  return items.length <= 3 ? items.join('；') : `${items.slice(0, 3).join('；')} 等 ${items.length} 件`;
};

const pricedExportItems = (record: Rental) =>
  (record.items || []).filter(item => Number(item.perItemPrice ?? 0) > 0);

const exportItemLabel = (item: Rental['items'][number]) =>
  [item.itemShortIdSnapshot, item.itemNameSnapshot].filter(Boolean).join(' / ') || '-';

const exportItemSummary = (record: Rental) => {
  const items = pricedExportItems(record).map(exportItemLabel);
  return items.join('；');
};

const refreshPendingSfRoutes = async () => {
  sfBulkRefreshing.value = true;
  try {
    const result = await rentalStore.refreshPendingSfRoutes();
    await fetchList();
    const summary = `已刷新 ${result.synced} 条顺丰运单，覆盖 ${result.rentalCount} 个租赁单，自动签收 ${result.autoDelivered} 条`;
    const warnings = [
      result.exceptionCount > 0 ? `物流异常 ${result.exceptionCount} 条` : '',
      result.errorCount > 0 ? `查询失败 ${result.errorCount} 条` : '',
      result.skippedCount > 0 ? `跳过 ${result.skippedCount} 条` : '',
    ].filter(Boolean);
    if (warnings.length > 0) {
      message.warning(`${summary}；${warnings.join('，')}`);
    } else {
      message.success(summary);
    }
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '刷新顺丰路由失败');
  } finally {
    sfBulkRefreshing.value = false;
  }
};

const exportRentalsXlsx = () => {
  const maxItemCount = Math.max(0, ...sortedRentals.value.map(record => pricedExportItems(record).length));
  const rows = sortedRentals.value.map(record => {
    const items = pricedExportItems(record);
    const itemDetails: Record<string, string | number> = {};
    for (let index = 0; index < maxItemCount; index += 1) {
      const item = items[index];
      itemDetails[`物品信息${index + 1}`] = item ? exportItemLabel(item) : '';
      itemDetails[`金额${index + 1}`] = item ? Number(item.perItemPrice) : '';
    }

    return {
      租赁单号: record.rentalNumber,
      状态: rentalDisplayStatusText(record),
      租客: record.renter?.name || '',
      预计发货: formatDateTime(record.expectedShipDate, 'YYYY-MM-DD') || '',
      开始日期: formatDateTime(record.startDate, 'YYYY-MM-DD') || '',
      预计结束: formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '',
      预计回货: formatDateTime(record.expectedReturnDate, 'YYYY-MM-DD') || '',
      续租意愿: renewalIntentText(record),
      物品信息: exportItemSummary(record),
      平台订单号: record.platformOrderNo || '',
      到账账户: record.paymentAccount || '未填写',
      总价: record.totalPrice ?? 0,
      押金: record.deposit ?? 0,
      运费: record.totalShippingFee ?? 0,
      其他费用: record.otherFee ?? 0,
      核算金额: record.accountedAmount ?? 0,
      日均价格: dailyAccountedAmount(record),
      负责人: record.assignedTo || '',
      创建人: record.createdBy || '',
      创建时间: formatDateTime(record.createdAt) || '',
      ...itemDetails,
    };
  });

  exportToXlsx(rows, `租赁单批量导出-${new Date().toISOString().slice(0, 10)}.xlsx`, '租赁单');
};

const search = async () => {
  if (ownerScope.value === 'person' && !ownerName.value) {
    message.warning('请先选择要查看的创建人或负责人');
    return;
  }
  const searchText = searchKeyword.value.trim();
  const nextOwnerScope = searchText && ownerScope.value === 'mine' ? 'all' : ownerScope.value;
  await router.push({
    path: '/rentals',
    query: {
      status: status.value,
      search: searchText || undefined,
      pendingSettlement: pendingSettlement.value ? 'true' : undefined,
      ownerScope: nextOwnerScope,
      ownerRole: nextOwnerScope === 'person' ? ownerRole.value : undefined,
      ownerName: nextOwnerScope === 'person' ? ownerName.value : undefined,
      sortField: sortField.value,
      sortOrder: sortField.value ? sortOrder.value : undefined,
    },
  });
};

const handleOwnerScopeChange = async (value: OwnerScope) => {
  ownerName.value = undefined;
  if (value !== 'person') await search();
};

const handleOwnerRoleChange = () => {
  ownerName.value = undefined;
};

const handleOwnerNameChange = async (value?: string) => {
  if (value) await search();
};

onMounted(async () => {
  ownerOptionsLoading.value = true;
  try {
    const options = await rentalStore.fetchOwnerOptions();
    creatorOptions.value = options.creators;
    assigneeOptions.value = options.assignees;
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '获取租赁人员选项失败');
  } finally {
    ownerOptionsLoading.value = false;
  }
});

const updateSortQuery = async (field?: RentalDateSortField, order?: RentalSortOrder) => {
  await router.push({
    path: '/rentals',
    query: {
      ...route.query,
      sortField: field,
      sortOrder: field ? order || 'ascend' : undefined,
    },
  });
};

const setSortField = async (field: RentalDateSortField) => {
  const nextOrder = sortField.value === field ? sortOrder.value || 'ascend' : 'ascend';
  await updateSortQuery(field, nextOrder);
};

const toggleSortOrder = async () => {
  if (!sortField.value) return;
  await updateSortQuery(sortField.value, sortOrder.value === 'ascend' ? 'descend' : 'ascend');
};

const clearSort = async () => {
  await updateSortQuery(undefined, undefined);
};

const normalizeTableSorter = (sorter: unknown): TableSorter => {
  if (Array.isArray(sorter)) return (sorter[0] || {}) as TableSorter;
  return sorter && typeof sorter === 'object' ? (sorter as TableSorter) : {};
};

const handleTableChange = async (_pagination: unknown, _filters: unknown, sorter: unknown) => {
  const nextSorter = normalizeTableSorter(sorter);
  const nextField = readQuerySortField(nextSorter.field || nextSorter.columnKey);
  const nextOrder = nextSorter.order || undefined;

  if (nextField && nextOrder) {
    await updateSortQuery(nextField, nextOrder);
    return;
  }

  await clearSort();
};

watch(
  () => [
    route.query.status,
    route.query.search,
    route.query.rentalNumber,
    route.query.pendingSettlement,
    route.query.ownerScope,
    route.query.ownerRole,
    route.query.ownerName,
    route.query.sortField,
    route.query.sortOrder,
  ],
  async () => {
    applyQueryFilters();
    await fetchList();
  },
  { immediate: true }
);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.item-info-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 260px;
}

.item-info-chip {
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-money-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;
}

.mobile-money-row span {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  background: #f8fafc;
}

.mobile-money-row em {
  display: block;
  color: #667085;
  font-size: 11px;
  font-style: normal;
  line-height: 1.2;
}

.mobile-money-row strong {
  display: block;
  margin-top: 3px;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 700;
  word-break: break-word;
}

.mobile-sort-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.mobile-sort-label {
  flex: none;
  color: #667085;
  font-size: 12px;
}

@media (max-width: 767.98px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .mobile-sort-toolbar {
    align-items: flex-start;
  }
}
</style>
