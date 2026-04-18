<template>
  <div>
    <a-page-header title="仪表盘" sub-title="关键指标概览" />
    <div class="page-container">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="总库存物品" :value="totalItems" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="在库物品" :value="inStockItems" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="借出物品" :value="loanedOutItems" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="疑似丢失" :value="suspectedMissingItems" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="仓库总数" :value="warehouseStore.warehouses.length" />
          </a-card>
        </a-col>
      </a-row>

      <a-divider orientation="left">租赁概览</a-divider>
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="进行中租赁" :value="activeRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="待发货" :value="pendingRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="逾期租赁" :value="overdueRentals" :value-style="{ color: overdueRentals > 0 ? '#cf1322' : undefined }" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="已归还" :value="returnedRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="已取消" :value="cancelledRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="进行中租赁金额" :value="activeRevenue" :precision="1" prefix="¥" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" style="margin-top: 16px;">
        <a-col :xs="24" :md="12">
          <a-card title="即将到期 / 逾期">
            <a-list size="small" :data-source="dueSoonList" :locale="{ emptyText: '暂无到期或逾期' }">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <router-link :to="`/rentals/${item.id}`">{{ item.rentalNumber }}</router-link>
                      <a-tag :color="statusColor(item.status)" style="margin-left: 8px">{{ item.status }}</a-tag>
                    </template>
                    <template #description>
                      {{ item.renter?.name || '-' }} · 预计结束 {{ formatDate(item.expectedEndDate) }}
                      <span v-if="daysUntil(item.expectedEndDate) < 0" style="color: #cf1322; margin-left: 8px">
                        逾期 {{ -daysUntil(item.expectedEndDate) }} 天
                      </span>
                      <span v-else style="color: #d48806; margin-left: 8px">
                        {{ daysUntil(item.expectedEndDate) }} 天后到期
                      </span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-card title="最近租赁">
            <a-list size="small" :data-source="recentRentals" :locale="{ emptyText: '暂无租赁' }">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <router-link :to="`/rentals/${item.id}`">{{ item.rentalNumber }}</router-link>
                      <a-tag :color="statusColor(item.status)" style="margin-left: 8px">{{ item.status }}</a-tag>
                    </template>
                    <template #description>
                      {{ item.renter?.name || '-' }} · ¥{{ Number(item.totalPrice).toFixed(1) }} · 创建于 {{ formatDate(item.createdAt) }}
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" style="margin-top: 24px;">
        <a-col :span="12">
          <a-card title="物品状态分布">
            <Pie :data="pieChartData" :options="chartOptions" />
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="各仓库物品数量">
            <Bar :data="barChartData" :options="chartOptions" />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import dayjs from 'dayjs';
import { useItemStore } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useRentalStore } from '../stores/rentalStore';
import { Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { formatDateTime } from '../utils/formatters';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const rentalStore = useRentalStore();

onMounted(() => {
  itemStore.fetchItems();
  warehouseStore.fetchWarehouses();
  rentalStore.fetchRentals({ pageSize: 200 });
});

const activeRentals = computed(() => rentalStore.rentals.filter(r => r.status === 'Active').length);
const pendingRentals = computed(() => rentalStore.rentals.filter(r => r.status === 'Pending').length);
const overdueRentals = computed(() => rentalStore.rentals.filter(r => r.status === 'Overdue').length);
const returnedRentals = computed(() => rentalStore.rentals.filter(r => r.status === 'Returned').length);
const cancelledRentals = computed(() => rentalStore.rentals.filter(r => r.status === 'Cancelled').length);

const activeRevenue = computed(() =>
  rentalStore.rentals
    .filter(r => r.status === 'Active' || r.status === 'Overdue' || r.status === 'Pending')
    .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0)
);

const dueSoonList = computed(() =>
  [...rentalStore.rentals]
    .filter(r => (r.status === 'Active' || r.status === 'Overdue' || r.status === 'Pending') && r.expectedEndDate)
    .sort((a, b) => new Date(a.expectedEndDate).getTime() - new Date(b.expectedEndDate).getTime())
    .filter(r => daysUntil(r.expectedEndDate) <= 7)
    .slice(0, 8)
);

const recentRentals = computed(() =>
  [...rentalStore.rentals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
);

const daysUntil = (dateStr: string) => {
  const now = dayjs().startOf('day');
  const target = dayjs(dateStr).startOf('day');
  return target.diff(now, 'day');
};

const formatDate = (value?: string | null) =>
  value ? formatDateTime(value, 'YYYY-MM-DD') : '';

const statusColor = (s: string) => {
  if (s === 'Pending') return 'default';
  if (s === 'Active') return 'blue';
  if (s === 'Overdue') return 'red';
  if (s === 'Returned') return 'green';
  return 'orange';
};

const totalItems = computed(() => itemStore.items.length);
const inStockItems = computed(() => itemStore.items.filter(i => i.status === 'InStock').length);
const loanedOutItems = computed(() => itemStore.items.filter(i => i.status === 'LoanedOut').length);
const suspectedMissingItems = computed(() => itemStore.items.filter(i => i.status === 'SuspectedMissing').length);

const pieChartData = computed(() => ({
  labels: ['在库', '借出', '处置', '疑似丢失'],
  datasets: [{
    backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#FFC107'],
    data: [
      inStockItems.value,
      loanedOutItems.value,
      itemStore.items.filter(i => i.status === 'Disposed').length,
      suspectedMissingItems.value
    ]
  }]
}));

const barChartData = computed(() => {
  const labels = warehouseStore.warehouses.map(w => w.name);
  const data = warehouseStore.warehouses.map(w => 
    itemStore.items.filter(i => i.warehouseId === w.id && i.status === 'InStock').length
  );
  return {
    labels,
    datasets: [{
      label: '在库物品数量',
      backgroundColor: '#f87979',
      data
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
