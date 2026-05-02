<template>
  <div>
    <a-page-header title="租赁列表" sub-title="查看和筛选租赁单" />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="toolbar">
        <a-space :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
          <a-select
            v-model:value="status"
            allow-clear
            :style="isMobile ? { width: '100%' } : { width: '160px' }"
            placeholder="状态"
            @change="search"
          >
            <a-select-option value="Pending">Pending</a-select-option>
            <a-select-option value="Active">Active</a-select-option>
            <a-select-option value="Overdue">Overdue</a-select-option>
            <a-select-option value="Returned">Returned</a-select-option>
            <a-select-option value="Cancelled">Cancelled</a-select-option>
            <a-select-option value="Renewed">Renewed</a-select-option>
          </a-select>
          <a-input
            v-model:value="rentalNumber"
            placeholder="租赁单号"
            :style="isMobile ? { width: '100%' } : { width: '180px' }"
          />
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
        :data-source="rentalStore.rentals"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rentalNumber'">
            <router-link :to="`/rentals/${record.id}`">{{ record.rentalNumber }}</router-link>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'renter'">
            {{ record.renter?.name || '-' }}
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
          <template v-else-if="column.key === 'totalPrice'">
            {{ record.totalPrice != null ? `￥${Number(record.totalPrice).toFixed(1)}` : '-' }}
          </template>
          <template v-else-if="column.key === 'accountedAmount'">
            {{ record.accountedAmount != null ? `￥${Number(record.accountedAmount).toFixed(1)}` : '-' }}
          </template>
          <template v-else-if="column.key === 'dailyPrice'">
            {{ formatMoney(dailyAccountedAmount(record)) }}
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <a-skeleton :loading="rentalStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard
            v-for="record in rentalStore.rentals"
            :key="record.id"
            clickable
            @click="$router.push(`/rentals/${record.id}`)"
          >
            <template #title>{{ record.rentalNumber }}</template>
            <template #tags>
              <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
            </template>
            <template #meta>
              <div>租客：{{ record.renter?.name || '-' }}</div>
              <div>预计发货：{{ formatDateTime(record.expectedShipDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>开始：{{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>预计结束：{{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>物品：{{ itemSummary(record) }}</div>
              <div>平台订单号：{{ record.platformOrderNo || '-' }}</div>
              <div>
                核算：{{ record.accountedAmount != null ? `￥${Number(record.accountedAmount).toFixed(1)}` : '-' }}
                <span style="margin-left: 8px">| 日均：{{ formatMoney(dailyAccountedAmount(record)) }}</span>
                <span v-if="record.assignedTo" style="margin-left: 8px">| 负责人：{{ record.assignedTo }}</span>
              </div>
            </template>
          </MobileListCard>
          <a-empty v-if="rentalStore.rentals.length === 0 && !rentalStore.loading" description="暂无租赁记录" />
        </a-skeleton>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useRentalStore, type Rental, type RentalStatus } from '../stores/rentalStore';
import { formatDateTime } from '../utils/formatters';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import { exportToXlsx } from '../utils/xlsx';
import { useAuthStore } from '../stores/authStore';
import { PermissionCodes } from '../utils/permissions';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const rentalStore = useRentalStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const status = ref<RentalStatus | undefined>(undefined);
const rentalNumber = ref('');
const sfBulkRefreshing = ref(false);
const rentalStatuses: RentalStatus[] = ['Pending', 'Active', 'Overdue', 'Returned', 'Cancelled', 'Renewed'];
const canRefreshSfRoutes = computed(() => authStore.hasPermission(PermissionCodes.RentalShip));

const columns = [
  { title: '租赁单号', dataIndex: 'rentalNumber', key: 'rentalNumber', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '租客', key: 'renter', width: 160 },
  { title: '物品信息', key: 'items', width: 260 },
  { title: '预计发货', dataIndex: 'expectedShipDate', key: 'expectedShipDate', width: 140 },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 140 },
  { title: '预计结束', dataIndex: 'expectedEndDate', key: 'expectedEndDate', width: 140 },
  { title: '平台订单号', dataIndex: 'platformOrderNo', key: 'platformOrderNo', width: 180 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120 },
  { title: '核算金额', dataIndex: 'accountedAmount', key: 'accountedAmount', width: 120 },
  { title: '日均', key: 'dailyPrice', width: 110 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 160 },
];

const statusColor = (value: string) => {
  if (value === 'Pending') return 'default';
  if (value === 'Active') return 'blue';
  if (value === 'Overdue') return 'red';
  if (value === 'Returned') return 'green';
  if (value === 'Renewed') return 'cyan';
  return 'orange';
};

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

const applyQueryFilters = () => {
  status.value = readQueryStatus(route.query.status);
  rentalNumber.value = readQueryString(route.query.rentalNumber);
};

const fetchList = async () => {
  await rentalStore.fetchRentals({
    status: status.value,
    rentalNumber: rentalNumber.value.trim() || undefined,
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

const itemSummary = (record: Rental) => {
  if (!record.items?.length) return '-';
  const items = record.items.map(item => `${item.itemShortIdSnapshot || '-'} / ${item.itemNameSnapshot || '-'}`);
  return items.length <= 3 ? items.join('；') : `${items.slice(0, 3).join('；')} 等 ${items.length} 件`;
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
  const rows = rentalStore.rentals.map(record => ({
    租赁单号: record.rentalNumber,
    状态: record.status,
    租客: record.renter?.name || '',
    预计发货: formatDateTime(record.expectedShipDate, 'YYYY-MM-DD') || '',
    开始日期: formatDateTime(record.startDate, 'YYYY-MM-DD') || '',
    预计结束: formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '',
    物品信息: itemSummary(record),
    平台订单号: record.platformOrderNo || '',
    总价: record.totalPrice ?? 0,
    押金: record.deposit ?? 0,
    运费: record.totalShippingFee ?? 0,
    其他费用: record.otherFee ?? 0,
    核算金额: record.accountedAmount ?? 0,
    日均价格: dailyAccountedAmount(record),
    负责人: record.assignedTo || '',
    创建时间: formatDateTime(record.createdAt) || '',
  }));

  exportToXlsx(rows, `租赁单批量导出-${new Date().toISOString().slice(0, 10)}.xlsx`, '租赁单');
};

const search = async () => {
  await router.push({
    path: '/rentals',
    query: {
      status: status.value,
      rentalNumber: rentalNumber.value.trim() || undefined,
    },
  });
};

watch(
  () => [route.query.status, route.query.rentalNumber],
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

@media (max-width: 767.98px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
