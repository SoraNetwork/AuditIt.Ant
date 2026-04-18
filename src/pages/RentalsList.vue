<template>
  <div>
    <a-page-header title="租赁列表" sub-title="查看和筛选租赁单" />
    <a-card>
      <a-space style="margin-bottom: 12px; width: 100%; justify-content: space-between">
        <a-space>
          <a-select v-model:value="status" allow-clear style="width: 160px" placeholder="状态" @change="search">
            <a-select-option value="Pending">Pending</a-select-option>
            <a-select-option value="Active">Active</a-select-option>
            <a-select-option value="Overdue">Overdue</a-select-option>
            <a-select-option value="Returned">Returned</a-select-option>
            <a-select-option value="Cancelled">Cancelled</a-select-option>
          </a-select>
          <a-input v-model:value="rentalNumber" placeholder="租赁单号" style="width: 180px" />
          <a-button @click="search">查询</a-button>
        </a-space>
        <a-button type="primary" @click="$router.push('/rentals/new')">新建租赁</a-button>
      </a-space>

      <a-table :loading="rentalStore.loading" row-key="id" :columns="columns" :data-source="rentalStore.rentals" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rentalNumber'">
            <router-link :to="`/rentals/${record.id}`">{{ record.rentalNumber }}</router-link>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'renter'">
            {{ record.renter?.name || '-' }}
          </template>
          <template v-if="column.key === 'startDate'">
            {{ formatDateTime(record.startDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-if="column.key === 'expectedEndDate'">
            {{ formatDateTime(record.expectedEndDate, 'YYYY-MM-DD') || '-' }}
          </template>
          <template v-if="column.key === 'totalPrice'">
            {{ record.totalPrice != null ? '¥' + Number(record.totalPrice).toFixed(1) : '-' }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRentalStore, type RentalStatus } from '../stores/rentalStore';
import { formatDateTime } from '../utils/formatters';

const rentalStore = useRentalStore();
const status = ref<RentalStatus | undefined>(undefined);
const rentalNumber = ref('');

const columns = [
  { title: '租赁单号', dataIndex: 'rentalNumber', key: 'rentalNumber' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '租客', key: 'renter', width: 180 },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 180 },
  { title: '预计结束', dataIndex: 'expectedEndDate', key: 'expectedEndDate', width: 180 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 120 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 150 },
];

const statusColor = (s: string) => {
  if (s === 'Pending') return 'default';
  if (s === 'Active') return 'blue';
  if (s === 'Overdue') return 'red';
  if (s === 'Returned') return 'green';
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
