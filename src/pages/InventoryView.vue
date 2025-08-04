<template>
  <div>
    <a-page-header title="库存总览" sub-title="查询所有仓库中的物品状态" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filters" @finish="applyFilters" class="filter-form">
          <a-form-item label="搜索">
            <a-input v-model:value="filters.searchTerm" placeholder="搜索ID或名称" style="width: 200px" allow-clear />
          </a-form-item>
          <a-form-item label="仓库">
            <a-select v-model:value="filters.warehouseId" placeholder="所有仓库" style="width: 180px" @change="applyFilters" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="物品状态">
            <a-select v-model:value="filters.status" placeholder="所有状态" style="width: 150px" @change="applyFilters" allow-clear>
              <a-select-option value="InStock">在库</a-select-option>
              <a-select-option value="LoanedOut">借出</a-select-option>
              <a-select-option value="Disposed">处置</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="applyFilters">查询</a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <a-skeleton :loading="itemStore.loading" active :paragraph="{ rows: 5 }">
          <a-table
            v-if="filteredData.length > 0"
            :columns="columns"
            :data-source="filteredData"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'shortId'">
                <router-link :to="{ name: 'item-details', params: { id: record.id } }">{{ record.shortId }}</router-link>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="statusDisplay(record.status).color">{{ statusDisplay(record.status).text }}</a-tag>
              </template>
            </template>
          </a-table>
          
          <a-empty v-else description="没有找到符合条件的物品，快去入库吧！">
            <a-button type="primary" @click="router.push('/inbound')">立即入库</a-button>
          </a-empty>
        </a-skeleton>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useItemStore, type ItemStatus } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemDefinitionStore, type ItemDefinition } from '../stores/itemDefinitionStore';
import { STATUS_MAP } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import type { Warehouse } from '../stores/warehouseStore';

const router = useRouter();

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const filters = reactive<{ warehouseId?: number; status?: ItemStatus; searchTerm?: string }>({
  warehouseId: undefined,
  status: undefined,
  searchTerm: '',
});

const statusDisplay = (status: ItemStatus) => {
  return STATUS_MAP[status] || { text: '未知', color: 'gray' };
};

const itemDefMap = computed(() =>
  itemDefStore.itemDefinitions.reduce((map: Record<number, ItemDefinition>, def) => {
    map[def.id] = def;
    return map;
  }, {})
);

const warehouseMap = computed(() =>
  warehouseStore.warehouses.reduce((map: Record<number, Warehouse>, wh) => {
    map[wh.id] = wh;
    return map;
  }, {})
);

const tableData = computed(() =>
  itemStore.items.map(item => ({
    ...item,
    name: itemDefMap.value[item.itemDefinitionId]?.name || '未知物品',
    warehouseName: warehouseMap.value[item.warehouseId]?.name || '未知仓库',
  }))
);

const filteredData = computed(() => {
  if (!filters.searchTerm) {
    return tableData.value;
  }
  const searchTermLower = filters.searchTerm.toLowerCase();
  return tableData.value.filter(item => 
    item.shortId.toLowerCase().includes(searchTermLower) ||
    item.name.toLowerCase().includes(searchTermLower)
  );
});

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '所在仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '当前去向', dataIndex: 'currentDestination', key: 'currentDestination' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { 
    title: '最后更新', 
    dataIndex: 'lastUpdated', 
    key: 'lastUpdated',
    customRender: ({ text }: { text: string }) => formatDateTime(text),
  },
];

onMounted(() => {
  // Initial fetch without filters
  itemStore.fetchItems();
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const applyFilters = () => {
  // This function now only fetches from the API based on warehouse and status.
  // The text search is applied client-side on the results.
  const queryFilters: { warehouseId?: number; status?: ItemStatus } = {};
  if (filters.warehouseId) {
    queryFilters.warehouseId = Number(filters.warehouseId);
  }
  if (filters.status) {
    queryFilters.status = filters.status;
  }
  itemStore.fetchItems(queryFilters);
};
</script>

<style scoped>
.page-container { padding: 24px; }
.filter-form .ant-form-item { margin-bottom: 0; margin-right: 8px; }
</style>
