<template>
  <div>
    <a-page-header title="仪表盘" sub-title="关键指标概览" />
    <div class="page-container">
      <a-row :gutter="[16, 16]">
        <a-col :span="6">
          <a-card>
            <a-statistic title="总库存物品" :value="totalItems" />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic title="在库物品" :value="inStockItems" />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic title="借出物品" :value="loanedOutItems" />
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic title="仓库总数" :value="warehouseStore.warehouses.length" />
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
import { useItemStore } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();

onMounted(() => {
  itemStore.fetchItems();
  warehouseStore.fetchWarehouses();
});

const totalItems = computed(() => itemStore.items.length);
const inStockItems = computed(() => itemStore.items.filter(i => i.status === 'in_stock').length);
const loanedOutItems = computed(() => itemStore.items.filter(i => i.status === 'loaned_out').length);

const pieChartData = computed(() => ({
  labels: ['在库', '借出', '处置'],
  datasets: [{
    backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
    data: [
      inStockItems.value,
      loanedOutItems.value,
      itemStore.items.filter(i => i.status === 'disposed').length
    ]
  }]
}));

const barChartData = computed(() => {
  const labels = warehouseStore.warehouses.map(w => w.name);
  const data = warehouseStore.warehouses.map(w => 
    itemStore.items.filter(i => i.warehouseId === w.id && i.status === 'in_stock').length
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
