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
          </a-select>
          <a-input
            v-model:value="rentalNumber"
            placeholder="租赁单号"
            :style="isMobile ? { width: '100%' } : { width: '180px' }"
          />
          <a-button :block="isMobile" @click="search">查询</a-button>
        </a-space>
        <a-button type="primary" :block="isMobile" :style="isMobile ? { marginTop: '8px' } : {}" @click="$router.push('/rentals/new')">
          新建租赁
        </a-button>
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
          <template v-else-if="column.key === 'startDate'">
            {{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'expectedEndDate'">
            {{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-else-if="column.key === 'totalPrice'">
            {{ record.totalPrice != null ? `￥${Number(record.totalPrice).toFixed(1)}` : '-' }}
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
              <div>开始：{{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>预计结束：{{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}</div>
              <div>平台订单号：{{ record.platformOrderNo || '-' }}</div>
              <div>
                总价：{{ record.totalPrice != null ? `￥${Number(record.totalPrice).toFixed(1)}` : '-' }}
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
import { onMounted, ref } from 'vue';
import { useRentalStore, type RentalStatus } from '../stores/rentalStore';
import { formatDateTime } from '../utils/formatters';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const rentalStore = useRentalStore();

const status = ref<RentalStatus | undefined>(undefined);
const rentalNumber = ref('');

const columns = [
  { title: '租赁单号', dataIndex: 'rentalNumber', key: 'rentalNumber', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '租客', key: 'renter', width: 160 },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 140 },
  { title: '预计结束', dataIndex: 'expectedEndDate', key: 'expectedEndDate', width: 140 },
  { title: '平台订单号', dataIndex: 'platformOrderNo', key: 'platformOrderNo', width: 180 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 160 },
];

const statusColor = (value: string) => {
  if (value === 'Pending') return 'default';
  if (value === 'Active') return 'blue';
  if (value === 'Overdue') return 'red';
  if (value === 'Returned') return 'green';
  return 'orange';
};

const search = async () => {
  await rentalStore.fetchRentals({
    status: status.value,
    rentalNumber: rentalNumber.value.trim() || undefined,
    page: 1,
    pageSize: 100,
  });
};

onMounted(search);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

@media (max-width: 767.98px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
