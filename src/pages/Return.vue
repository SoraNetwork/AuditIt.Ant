<template>
  <div>
    <a-page-header title="归还操作" sub-title="将借出或疑似丢失的物品归还入库" />
    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <div v-if="isMobile" class="mobile-selection-toolbar">
          <div class="meta">
            <div class="title">待归还物品 {{ tableData.length }} 件</div>
            <div class="desc">
              {{ hasSelected ? `已勾选 ${selectedRowKeys.length} 件，底部可直接提交归还。` : '点卡片勾选要归还的物品。' }}
            </div>
          </div>
        </div>

        <a-space v-if="!isMobile" style="margin-bottom: 16px;">
          <a-button type="primary" :block="isMobile" :disabled="!hasSelected" :loading="itemStore.loading" @click="handleReturn">
            归还选中项 ({{ selectedRowKeys.length }})
          </a-button>
        </a-space>

        <a-table
          v-if="!itemStore.loading && tableData.length > 0 && !isMobile"
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
            <template v-else-if="column.key === 'currentDestination'">
              <RentalReferenceText :text="record.currentDestination || '-'" />
            </template>
          </template>
        </a-table>

        <div v-else-if="isMobile && tableData.length > 0" class="mobile-card-list">
          <MobileListCard
            v-for="item in tableData"
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
              <div v-if="item.currentDestination">去向：<RentalReferenceText :text="item.currentDestination" /></div>
              <div>原属仓库：{{ item.warehouseName }}</div>
            </template>
          </MobileListCard>
        </div>

        <a-empty v-if="!itemStore.loading && tableData.length === 0" description="当前没有已借出或疑似丢失的物品" />
        <template v-if="isMobile && tableData.length > 0">
          <div class="mobile-action-bar">
            <a-button
              type="primary"
              :disabled="!hasSelected"
              :loading="itemStore.loading"
              @click="handleReturn"
            >
              归还{{ selectedRowKeys.length ? ` (${selectedRowKeys.length})` : '' }}
            </a-button>
          </div>
          <div class="mobile-selection-spacer" />
        </template>
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
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RentalReferenceText from '../components/RentalReferenceText.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
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

@media (max-width: 767.98px) {
  .page-container { padding: 0; }
}
</style>
