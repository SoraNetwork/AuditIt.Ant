<template>
  <div>
    <a-page-header title="归还操作" sub-title="将借出的物品归还入库" />
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
        />
        <a-empty v-if="!itemStore.loading && tableData.length === 0" description="当前没有已借出的物品" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useItemStore } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { message, Modal } from 'ant-design-vue';

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const selectedRowKeys = ref<string[]>([]);

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
  { title: '原属仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: 'UUID', dataIndex: 'id', key: 'id', ellipsis: true },
];

onMounted(() => {
  itemStore.fetchItems({ status: 'loaned_out' });
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const handleReturn = () => {
  Modal.confirm({
    title: '确认归还',
    content: `您确定要归还选中的 ${selectedRowKeys.value.length} 件物品吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await itemStore.returnItems(selectedRowKeys.value);
        message.success(`成功归还 ${selectedRowKeys.value.length} 件物品!`);
        selectedRowKeys.value = [];
        itemStore.fetchItems({ status: 'loaned_out' });
      } catch (error) {
        message.error('归还失败');
      }
    },
  });
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>