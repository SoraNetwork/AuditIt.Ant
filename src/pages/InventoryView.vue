<template>
  <div>
    <a-page-header title="库存总览" sub-title="查询所有仓库中的物品状态" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filters" @finish="applyFilters" class="filter-form">
          <a-form-item label="仓库">
            <a-select v-model:value="filters.warehouseId" placeholder="所有仓库" style="width: 180px" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="物品状态">
            <a-select v-model:value="filters.status" placeholder="所有状态" style="width: 150px" allow-clear>
              <a-select-option value="in_stock">在库</a-select-option>
              <a-select-option value="loaned_out">借出</a-select-option>
              <a-select-option value="disposed">处置</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">查询</a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <a-skeleton :loading="itemStore.loading" active :paragraph="{ rows: 5 }">
          <a-table
            v-if="tableData.length > 0"
            :columns="columns"
            :data-source="tableData"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'shortId'">
                <router-link :to="{ name: 'item-details', params: { id: record.id } }">{{ record.shortId }}</router-link>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="statusMap[record.status]?.color">{{ statusMap[record.status]?.text || '未知' }}</a-tag>
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
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { STATUS_MAP } from '../utils/constants';
import { DownloadOutlined } from '@ant-design/icons-vue';
import Papa from 'papaparse';

const router = useRouter();

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const filters = reactive<{ warehouseId?: string; status?: ItemStatus }>({
  warehouseId: undefined,
  status: undefined,
});

const statusMap = STATUS_MAP;

const itemDefMap = computed(() => itemDefStore.itemDefinitions.reduce((map, def) => ({ ...map, [def.id]: def }), {}));
const warehouseMap = computed(() => warehouseStore.warehouses.reduce((map, wh) => ({ ...map, [wh.id]: wh }), {}));

const tableData = computed(() => itemStore.items.map(item => ({
  ...item,
  name: itemDefMap.value[item.itemDefinitionId]?.name || '未知物品',
  warehouseName: warehouseMap.value[item.warehouseId]?.name || '未知仓库',
})));

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '所在仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '最后更新', dataIndex: 'lastUpdated', key: 'lastUpdated' },
  { title: 'UUID', dataIndex: 'id', key: 'id' },
];

onMounted(() => {
  itemStore.fetchItems();
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const applyFilters = () => {
  itemStore.fetchItems({ ...filters });
};

const handleExport = () => {
  const dataToExport = tableData.value.map(item => ({
    '可视化ID': item.shortId,
    '物品名称': item.name,
    '所在仓库': item.warehouseName,
    '状态': statusMap[item.status]?.text || item.status,
    '最后更新': item.lastUpdated,
    'UUID': item.id,
  }));

  const csv = Papa.unparse(dataToExport);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory_export_${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.page-container { padding: 24px; }
.filter-form .ant-form-item { margin-bottom: 0; }
</style>
