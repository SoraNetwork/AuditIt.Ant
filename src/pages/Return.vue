<template>
  <div>
    <a-page-header title="归还操作" sub-title="将借出或疑似丢失的物品归还入库" />
    <div class="page-container">
      <a-card>
        <a-space style="margin-bottom: 16px;">
          <a-button type="primary" :disabled="!hasSelected" :loading="itemStore.loading" @click="handleReturn">
            归还选中项 ({{ selectedRowKeys.length }})
          </a-button>
        </a-space>

        <a-table
          v-if="!itemStore.loading && tableData.length > 0"
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
          :columns="columns"
          :data-source="tableData"
          :loading="itemStore.loading"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
          </template>
        </a-table>
        <a-empty v-if="!itemStore.loading && tableData.length === 0" description="当前没有已借出或疑似丢失的物品" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useItemStore, getStatusText, type ItemStatus } from '../stores/itemStore';
import { useWarehouseStore, type Warehouse } from '../stores/warehouseStore';
import { useItemDefinitionStore, type ItemDefinition } from '../stores/itemDefinitionStore';
import { message, Modal } from 'ant-design-vue';

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const selectedRowKeys = ref<string[]>([]);

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

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '当前状态', dataIndex: 'status', key: 'status' },
  { title: '目的地/借出信息', dataIndex: 'currentDestination', key: 'currentDestination' },
  { title: '原属仓库', dataIndex: 'warehouseName', key: 'warehouse' },
];

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const loadItems = async () => {
  itemStore.loading = true;
  try {
    // Fetch LoanedOut items
    await itemStore.fetchItems({ status: 'LoanedOut' });
    const loanedOutItems = [...itemStore.items];
    
    // Fetch SuspectedMissing items
    await itemStore.fetchItems({ status: 'SuspectedMissing' });
    const missingItems = [...itemStore.items];

    // Combine and ensure uniqueness
    const combined = [...loanedOutItems, ...missingItems];
    const uniqueIds = new Set();
    itemStore.items = combined.filter(item => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });

  } catch (error) {
    message.error("加载物品失败");
  } finally {
    itemStore.loading = false;
  }
};

const handleReturn = () => {
  Modal.confirm({
    title: '确认归还',
    content: `您确定要归还选中的 ${selectedRowKeys.value.length} 件物品吗？它们的状态将被更新为“在库”。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const promises = selectedRowKeys.value.map(id => itemStore.updateItemStatus(id, 'return'));
        await Promise.all(promises);
        message.success(`成功归还 ${selectedRowKeys.value.length} 件物品!`);
        selectedRowKeys.value = [];
        loadItems(); // Refresh the list
      } catch (error) {
        message.error('归还失败');
      }
    },
  });
};

const getStatusColor = (status: ItemStatus) => {
  switch (status) {
    case 'InStock': return 'green';
    case 'LoanedOut': return 'blue';
    case 'Disposed': return 'grey';
    case 'SuspectedMissing': return 'red';
    default: return 'default';
  }
};

onMounted(() => {
  loadItems();
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
