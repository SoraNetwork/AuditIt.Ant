<template>
  <div>
    <a-page-header title="出库操作" sub-title="更新在库物品的状态" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filterState" @finish="loadItems">
          <a-form-item label="选择仓库">
            <a-select v-model:value="filterState.warehouseId" placeholder="请选择仓库" style="width: 200px" @change="loadItems" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>

        <a-divider />

        <div v-if="filterState.warehouseId">
          <a-space style="margin-bottom: 16px;">
            <a-button type="primary" :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('loaned_out')">
              借出选中项 ({{ selectedRowKeys.length }})
            </a-button>
            <a-button type="primary" danger :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('disposed')">
              处置选中项 ({{ selectedRowKeys.length }})
            </a-button>
          </a-space>

          <a-table
            v-if="!itemStore.loading && tableData.length > 0"
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :columns="columns"
            :data-source="tableData"
            :loading="itemStore.loading"
            row-key="id"
          />
          <a-empty v-if="!itemStore.loading && tableData.length === 0" description="该仓库中没有在库物品可供出库" />
        </div>
        <a-empty v-else description="请先选择一个仓库以加载物品" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore, type ItemStatus } from '../stores/itemStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { message, Modal } from 'ant-design-vue';

const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();
const itemDefStore = useItemDefinitionStore();

const filterState = reactive({ warehouseId: undefined });
const selectedRowKeys = ref<string[]>([]);

const itemDefMap = computed(() => itemDefStore.itemDefinitions.reduce((map, def) => ({ ...map, [def.id]: def }), {}));

const tableData = computed(() => itemStore.items.map(item => ({
  ...item,
  name: itemDefMap.value[item.itemDefinitionId]?.name || '未知物品',
  shortId: item.shortId,
})));

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: 'UUID', dataIndex: 'id', key: 'id', ellipsis: true },
];

onMounted(() => {
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const loadItems = () => {
  if (filterState.warehouseId) {
    itemStore.fetchItems({ warehouseId: filterState.warehouseId, status: 'in_stock' });
  } else {
    itemStore.items = [];
  }
  selectedRowKeys.value = [];
};

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const showOutboundModal = (status: ItemStatus) => {
  const actionText = status === 'loaned_out' ? '借出' : '处置';
  Modal.confirm({
    title: `确认${actionText}`,
    content: `您确定要将选中的 ${selectedRowKeys.value.length} 件物品状态更新为 "${actionText}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await itemStore.updateItemStatus(selectedRowKeys.value, status);
        message.success(`成功${actionText} ${selectedRowKeys.value.length} 件物品!`);
        selectedRowKeys.value = [];
        loadItems();
      } catch (error) {
        message.error(`${actionText}失败`);
      }
    },
  });
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
