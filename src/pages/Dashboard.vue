<template>
  <div>
    <a-page-header title="仪表盘" sub-title="关键指标概览" />
    <div class="page-container">
      <a-row :gutter="isMobile ? [8, 8] : [16, 16]">
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
      <a-row :gutter="isMobile ? [8, 8] : [16, 16]">
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToRentalsByStatus('Active')">
            <a-statistic title="进行中租赁" :value="activeRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToRentalsByStatus('Pending')">
            <a-statistic title="待发货" :value="pendingRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToRentalsByStatus('Overdue')">
            <a-statistic title="逾期租赁" :value="overdueRentals"
              :value-style="{ color: overdueRentals > 0 ? '#cf1322' : undefined }" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToRentalsByStatus('Returned')">
            <a-statistic title="已归还" :value="returnedRentals" />
          </a-card>
        </a-col>
<!--
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToPendingSettlementList">
            <a-statistic title="待结算" :value="pendingSettlementRentals"
              :value-style="{ color: pendingSettlementRentals > 0 ? '#d48806' : undefined }" />
          </a-card>
        </a-col>
-->
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card hoverable class="overview-card" @click="goToRentalsByStatus('Cancelled')">
            <a-statistic title="已取消" :value="cancelledRentals" />
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="4">
          <a-card>
            <a-statistic title="进行中租赁金额" :value="activeRevenue" :precision="1" prefix="¥" />
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="!isMobile" :gutter="isMobile ? [8, 8] : [16, 16]" style="margin-top: 16px;">
        <a-col :xs="24">
          <a-card title="提醒日历">
            <RentalCalendarPanel compact />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="isMobile ? [8, 8] : [16, 16]" style="margin-top: 16px;">
        <a-col :xs="24">
          <a-card title="待发货">
            <a-list size="small" :data-source="pendingShipmentList" :locale="{ emptyText: '暂无待发货租赁单' }">
              <template #renderItem="{ item }">
                <a-list-item>
                  <template #actions>
                    <router-link :to="`/rentals/${item.id}`">处理</router-link>
                  </template>
                  <a-list-item-meta>
                    <template #title>
                      <router-link :to="`/rentals/${item.id}`">{{ item.rentalNumber }}</router-link>·
                      <a-tag :color="rentalDisplayStatusColor(item)" style="margin-left: 8px">{{
                        rentalDisplayStatusText(item) }}</a-tag>
                    </template>
                    <template #description>
                      <RenterLink :renter-id="item.renterId" :name="item.renter?.name" />
                      <span v-if="daysUntil(item.expectedShipDate) < 0" style="color: #cf1322; margin-left: 8px">
                        逾期 {{ -daysUntil(item.expectedShipDate) }} 天发货
                      </span>
                      <span v-else-if="daysUntil(item.expectedShipDate) === 0" style="color: #d48806; margin-left: 8px">
                        今天发货
                      </span>
                      <span v-else style="color: #d48806; margin-left: 8px">
                        {{ daysUntil(item.expectedShipDate) }} 天后发货
                      </span>
                      预计发货 {{ formatDate(item.expectedShipDate) }}
                      <span v-if="item.platformOrderNo" style="margin-left: 8px">平台单号：{{ item.platformOrderNo }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
      <a-row :gutter="isMobile ? [8, 8] : [16, 16]" style="margin-top: 16px;">
        <a-col :xs="24" :md="12">
          <a-card title="即将到期 / 逾期">
            <a-list size="small" :data-source="dueSoonList" :locale="{ emptyText: '暂无到期或逾期' }">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <router-link :to="`/rentals/${item.id}`">{{ item.rentalNumber }}</router-link>
                      <a-tag :color="rentalDisplayStatusColor(item)" style="margin-left: 8px">{{
                        rentalDisplayStatusText(item) }}</a-tag>
                    </template>
                    <template #description>
                      <RenterLink :renter-id="item.renterId" :name="item.renter?.name" /> · 预计结束 {{
                        formatDate(item.expectedEndDate) }}
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
                      <a-tag :color="rentalDisplayStatusColor(item)" style="margin-left: 8px">{{
                        rentalDisplayStatusText(item) }}</a-tag>
                    </template>
                    <template #description>
                      <RenterLink :renter-id="item.renterId" :name="item.renter?.name" /> · ¥{{
                        Number(item.totalPrice).toFixed(1) }} · 创建于 {{ formatDate(item.createdAt) }}
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
<!--
      <a-row :gutter="isMobile ? [8, 8] : [16, 16]" style="margin-top: 16px;">
        <a-col :xs="24">
          <a-card title="待结算单">
            <template #extra>
              <router-link :to="{ path: '/rentals', query: { pendingSettlement: 'true' } }">查看全部</router-link>
            </template>
            <a-list size="small" :data-source="pendingSettlementList" :locale="{ emptyText: '暂无待结算租赁单' }">
              <template #renderItem="{ item }">
                <a-list-item>
                  <template #actions>
                    <router-link :to="`/rentals/${item.id}`">处理</router-link>
                  </template>
                  <a-list-item-meta>
                    <template #title>
                      <router-link :to="`/rentals/${item.id}`">{{ item.rentalNumber }}</router-link>
                      <a-tag :color="rentalDisplayStatusColor(item)" style="margin-left: 8px">{{
                        rentalDisplayStatusText(item) }}</a-tag>
                      <a-tag color="gold" style="margin-left: 4px">待结算</a-tag>
                    </template>
                    <template #description>
                      <RenterLink :renter-id="item.renterId" :name="item.renter?.name" /> · 完成 {{
                        formatDate(completedAt(item)) || '-' }} · 核算 {{ formatMoney(item.accountedAmount) }}
                      <span v-if="item.platformOrderNo" style="margin-left: 8px">平台单号：{{ item.platformOrderNo }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
-->
      <a-row :gutter="isMobile ? [8, 8] : [16, 16]" style="margin-top: 24px;">
        <a-col :xs="24" :md="12">
          <a-card title="物品状态分布">
            <div class="chart-wrapper">
              <Pie :data="pieChartData" :options="chartOptions" />
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-card title="各仓库物品数量">
            <div class="chart-wrapper">
              <Bar :data="barChartData" :options="chartOptions" />
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useItemStore } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useRentalStore, type RentalStatus } from '../stores/rentalStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import RentalCalendarPanel from '../components/RentalCalendarPanel.vue';
import RenterLink from '../components/RenterLink.vue';
import { Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { formatDateTime } from '../utils/formatters';
import { rentalDisplayStatusColor, rentalDisplayStatusText } from '../utils/rentalDisplay';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const rentalStore = useRentalStore();
const router = useRouter();

type RentalDateSortField = 'expectedShipDate' | 'startDate' | 'expectedEndDate' | 'expectedReturnDate';
type RentalSortOrder = 'ascend' | 'descend';

const rentalListDefaultSorts: Partial<Record<RentalStatus, { sortField: RentalDateSortField; sortOrder: RentalSortOrder }>> = {
  Pending: { sortField: 'expectedShipDate', sortOrder: 'ascend' },
  Active: { sortField: 'expectedEndDate', sortOrder: 'ascend' },
  Overdue: { sortField: 'expectedEndDate', sortOrder: 'ascend' },
  Returned: { sortField: 'expectedReturnDate', sortOrder: 'descend' },
  Cancelled: { sortField: 'expectedShipDate', sortOrder: 'descend' },
};

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
//const isPendingSettlementRental = (rental: Rental) =>
//  (rental.status === 'Returned' || rental.status === 'Renewed') && !rental.settlementNotifiedAt;
//const pendingSettlementRentals = computed(() => rentalStore.rentals.filter(isPendingSettlementRental).length);

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

const pendingShipmentList = computed(() =>
  [...rentalStore.rentals]
    .filter(r => r.status === 'Pending')
    .sort((a, b) => new Date(a.expectedShipDate).getTime() - new Date(b.expectedShipDate).getTime())
    .slice(0, 12)
);

const goToRentalsByStatus = (status: RentalStatus) => {
  router.push({ path: '/rentals', query: { status, ...rentalListDefaultSorts[status] } });
};
/*
const goToPendingSettlementList = () => {
  router.push({ path: '/rentals', query: { pendingSettlement: 'true' } });
};
*/
const daysUntil = (dateStr: string) => {
  const now = dayjs().startOf('day');
  const target = dayjs(dateStr).startOf('day');
  return target.diff(now, 'day');
};

const formatDate = (value?: string | null) =>
  value ? formatDateTime(value, 'YYYY-MM-DD') : '';

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
.page-container {
  padding: 24px;
}

.chart-wrapper {
  height: 240px;
}

.page-container :deep(.ant-card) {
  height: 100%;
}

.page-container :deep(.ant-card-body) {
  padding: 16px;
}

.overview-card {
  cursor: pointer;
}

@media (max-width: 767.98px) {
  .page-container {
    padding: 12px;
  }

  .page-container :deep(.ant-card-body) {
    padding: 14px 12px;
  }

  .page-container :deep(.ant-statistic-content) {
    font-size: 24px;
  }

  .page-container :deep(.ant-list-item) {
    padding-left: 0;
    padding-right: 0;
  }

  .chart-wrapper {
    height: 220px;
  }
}
</style>
