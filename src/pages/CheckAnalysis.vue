<template>
  <div>
    <a-page-header title="盘点分析" sub-title="查看盘点差异并处理" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filterState" @finish="runAnalysis">
          <a-form-item label="选择仓库">
            <a-select v-model:value="filterState.warehouseId" placeholder="请选择仓库" style="width: 200px" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="盘点日期范围">
            <a-range-picker v-model:value="filterState.dateRange" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="runAnalysis" :loading="isLoading">开始分析</a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <a-row :gutter="16" style="margin-top: 16px;">
        <a-col :span="12">
          <a-card title="已盘点物品">
            <a-list :data-source="checkedItems" :loading="isLoading">
              <template #renderItem="{ item }">
                <a-list-item>{{ item.itemDefinition?.name }} ({{ item.shortId }})</a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="疑似丢失物品">
            <template #extra>
              <a-button type="primary" danger :disabled="unCheckedItems.length === 0" @click="markAsMissing" :loading="isMarking">
                标记为疑似丢失
              </a-button>
            </template>
            <a-list :data-source="unCheckedItems" :loading="isLoading">
              <template #renderItem="{ item }">
                <a-list-item>{{ item.itemDefinition?.name }} ({{ item.shortId }})</a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore, type Item } from '../stores/itemStore';
import { useAuditLogStore } from '../stores/auditLogStore';
import { message } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();
const auditLogStore = useAuditLogStore();

const filterState = reactive<{
  warehouseId: number | undefined;
  dateRange: [Dayjs, Dayjs];
}>({
  warehouseId: undefined,
  dateRange: [dayjs().subtract(1, 'day'), dayjs()],
});

const isLoading = ref(false);
const isMarking = ref(false);
const checkedItems = ref<Item[]>([]);
const unCheckedItems = ref<Item[]>([]);

onMounted(() => {
  warehouseStore.fetchWarehouses();
});

const runAnalysis = async () => {
  if (!filterState.warehouseId) {
    message.error('请先选择一个仓库');
    return;
  }
  isLoading.value = true;
  checkedItems.value = [];
  unCheckedItems.value = [];

  try {
    // 1. Fetch all items in the warehouse
    await itemStore.fetchItems({ warehouseId: filterState.warehouseId });
    const allItems = itemStore.items;

    // 2. Fetch all 'Check' audit logs in the date range
    // This part is tricky as the current API doesn't support date range filtering for logs.
    // For now, we'll fetch all logs and filter on the client-side.
    // This is inefficient and should be improved in the backend later.
    await auditLogStore.fetchLogs(); 
    const startDate = filterState.dateRange[0].startOf('day').toDate();
    const endDate = filterState.dateRange[1].endOf('day').toDate();

    const checkedItemIds = new Set(
      auditLogStore.logs
        .filter(log =>
          log.action === 'Check' &&
          log.warehouseId === filterState.warehouseId &&
          new Date(log.timestamp) >= startDate &&
          new Date(log.timestamp) <= endDate
        )
        .map(log => log.itemId)
    );

    // 3. Compare and categorize
    checkedItems.value = allItems.filter(item => checkedItemIds.has(item.id));
    unCheckedItems.value = allItems.filter(item => !checkedItemIds.has(item.id));

  } catch (error) {
    message.error('分析失败: ' + error);
  } finally {
    isLoading.value = false;
  }
};

const markAsMissing = async () => {
  isMarking.value = true;
  try {
    const itemIds = unCheckedItems.value.map(item => item.id);
    // This action needs to be created in the itemStore
    await itemStore.updateStatusBatch(itemIds, 'SuspectedMissing');
    message.success('成功标记为疑似丢失');
    // Refresh the analysis
    runAnalysis();
  } catch (error) {
    message.error('标记失败: ' + error);
  } finally {
    isMarking.value = false;
  }
};
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
