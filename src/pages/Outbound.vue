<template>
  <div>
    <a-page-header title="出库操作" sub-title="更新在库或疑似丢失物品的状态" />
    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-form :layout="isMobile ? 'vertical' : 'inline'" :model="filterState" @finish="loadItems">
          <a-form-item label="选择仓库">
            <a-select v-model:value="filterState.warehouseId" placeholder="请选择仓库" :style="isMobile ? { width: '100%' } : { width: '200px' }" @change="loadItems" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="搜索">
            <a-input-search v-model:value="searchText" placeholder="按名称或短ID搜索" :style="isMobile ? { width: '100%' } : { width: '200px' }" allow-clear />
          </a-form-item>
        </a-form>

        <a-divider />

        <div v-if="filterState.warehouseId">
          <a-space
            :direction="isMobile ? 'vertical' : 'horizontal'"
            :style="isMobile ? { width: '100%', marginBottom: '16px' } : { marginBottom: '16px' }"
          >
            <a-button type="primary" :block="isMobile" :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('outbound')">
              借出选中项 ({{ selectedRowKeys.length }})
            </a-button>
            <a-button type="primary" danger :block="isMobile" :disabled="!hasSelected" :loading="itemStore.loading" @click="showOutboundModal('dispose')">
              处置选中项 ({{ selectedRowKeys.length }})
            </a-button>
          </a-space>

          <a-table
            v-if="!itemStore.loading && !isMobile"
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :columns="columns"
            :data-source="filteredData"
            :loading="itemStore.loading"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
              </template>
            </template>
          </a-table>

          <div v-else-if="isMobile">
            <MobileListCard
              v-for="item in filteredData"
              :key="item.id"
              clickable
              :active="selectedRowKeys.includes(item.id)"
              @click="toggleSelect(item.id)"
            >
              <template #title>
                <a-checkbox
                  :checked="selectedRowKeys.includes(item.id)"
                  style="margin-right: 8px"
                  @click.stop="toggleSelect(item.id)"
                />
                {{ item.shortId }} · {{ item.name }}
              </template>
              <template #tags>
                <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
              </template>
              <template #meta>
                <div>仓库：{{ item.warehouseName }}</div>
                <div v-if="item.remarks">备注：{{ item.remarks }}</div>
              </template>
            </MobileListCard>
          </div>

          <a-empty v-if="!itemStore.loading && filteredData.length === 0" description="该仓库中没有符合条件的物品" />
        </div>
        <a-empty v-else description="请先选择一个仓库以加载物品" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore, getStatusText, type ItemStatus } from '../stores/itemStore';
import { message, Modal, Input } from 'ant-design-vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { isMobile } = useBreakpoint();
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
  { title: '当前状态', dataIndex: 'status', key: 'status' },
  { title: '所在仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

onMounted(() => {
  warehouseStore.fetchWarehouses();
});

const loadItems = async () => {
  if (filterState.warehouseId) {
    // A simpler approach is to fetch them sequentially and combine.
    await itemStore.fetchItems({ warehouseId: filterState.warehouseId, status: 'InStock' });
    const inStockItems = [...itemStore.items];
    
    await itemStore.fetchItems({ warehouseId: filterState.warehouseId, status: 'SuspectedMissing' });
    const missingItems = [...itemStore.items];

    // Combine and remove duplicates, though there shouldn't be any.
    const combined = [...inStockItems, ...missingItems];
    const uniqueIds = new Set();
    itemStore.items = combined.filter(item => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });

  } else {
    itemStore.items = [];
  }
  selectedRowKeys.value = [];
  searchText.value = '';
};

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const toggleSelect = (id: string) => {
  const idx = selectedRowKeys.value.indexOf(id);
  if (idx === -1) {
    selectedRowKeys.value = [...selectedRowKeys.value, id];
  } else {
    const next = [...selectedRowKeys.value];
    next.splice(idx, 1);
    selectedRowKeys.value = next;
  }
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

const getStatusColor = (status: ItemStatus) => {
  switch (status) {
    case 'InStock': return 'green';
    case 'LoanedOut': return 'blue';
    case 'Disposed': return 'grey';
    case 'SuspectedMissing': return 'red';
    default: return 'default';
  }
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
