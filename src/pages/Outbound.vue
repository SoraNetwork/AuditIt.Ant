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
          <a-form-item label="搜索">
            <a-input-search v-model:value="searchText" placeholder="按名称或短ID搜索" style="width: 200px" allow-clear />
          </a-form-item>
        </a-form>

        <a-divider />

        <div v-if="filterState.warehouseId">
          <a-space style="margin-bottom: 16px;">
            <a-button type="primary" :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('outbound')">
              借出选中项 ({{ selectedRowKeys.length }})
            </a-button>
            <a-button type="primary" danger :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('dispose')">
              处置选中项 ({{ selectedRowKeys.length }})
            </a-button>
          </a-space>

          <a-table
            v-if="!itemStore.loading"
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :columns="columns"
            :data-source="filteredData"
            :loading="itemStore.loading"
            row-key="id"
          />
          <a-empty v-if="!itemStore.loading && filteredData.length === 0" description="该仓库中没有符合条件的在库物品" />
        </div>
        <a-empty v-else description="请先选择一个仓库以加载物品" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore } from '../stores/itemStore';
import { message, Modal, Input } from 'ant-design-vue';

const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();

const filterState = reactive<{ warehouseId: number | undefined }>({ warehouseId: undefined });
const searchText = ref('');
const selectedRowKeys = ref<string[]>([]);

const tableData = computed(() => 
  itemStore.items.map(item => ({
    ...item,
    name: item.itemDefinition?.name || '未知物品',
    warehouseName: item.warehouse?.name || '未知仓库',
  }))
);

const filteredData = computed(() => {
  if (!searchText.value) {
    return tableData.value;
  }
  const lowerCaseQuery = searchText.value.toLowerCase();
  return tableData.value.filter(item => 
    (item.name && item.name.toLowerCase().includes(lowerCaseQuery)) ||
    (item.shortId && item.shortId.toLowerCase().includes(lowerCaseQuery))
  );
});

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '所在仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

onMounted(() => {
  warehouseStore.fetchWarehouses();
});

const loadItems = () => {
  if (filterState.warehouseId) {
    itemStore.fetchItems({ warehouseId: filterState.warehouseId, status: 'InStock' });
  } else {
    itemStore.items = [];
  }
  selectedRowKeys.value = [];
  searchText.value = ''; // Reset search on warehouse change
};

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const showOutboundModal = (action: 'outbound' | 'dispose') => {
  const actionText = action === 'outbound' ? '借出' : '处置';
  let destination: string | undefined = undefined;

  Modal.confirm({
    title: `确认${actionText}`,
    content: h('div', [
      h('p', `您确定要将选中的 ${selectedRowKeys.value.length} 件物品状态更新为 "${actionText}" 吗？`),
      h(Input, {
        placeholder: '请输入目的地（例如：借给某人，或处置原因）',
        onChange: (e) => { destination = e.target.value; },
        style: { marginTop: '16px' }
      })
    ]),
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      if (!destination) {
        message.error('目的地不能为空');
        return Promise.reject();
      }
      try {
        const promises = selectedRowKeys.value.map(id => itemStore.updateItemStatus(id, action, destination));
        await Promise.all(promises);
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
