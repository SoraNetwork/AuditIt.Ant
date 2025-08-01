<template>
  <div>
    <a-page-header :title="`物品详情: ${item?.shortId}`" @back="router.back()">
      <template #extra>
        <a-tag :color="statusMap[item?.status || '']?.color">{{ statusMap[item?.status || '']?.text }}</a-tag>
      </template>
    </a-page-header>
    <div class="page-container">
      <a-card :loading="itemStore.loading">
        <a-descriptions bordered :column="2">
          <a-descriptions-item label="物品名称">{{ itemName }}</a-descriptions-item>
          <a-descriptions-item label="所属仓库">{{ warehouseName }}</a-descriptions-item>
          <a-descriptions-item label="可视化ID">{{ item?.shortId }}</a-descriptions-item>
          <a-descriptions-item label="最后更新">{{ item?.lastUpdated }}</a-descriptions-item>
          <a-descriptions-item label="UUID" :span="2">{{ item?.id }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="生命周期日志" style="margin-top: 16px;">
        <a-timeline>
          <a-timeline-item v-for="log in auditLogStore.logs" :key="log.id">
            <p><strong>{{ log.action }}</strong> - {{ log.timestamp }}</p>
            <p>操作人: {{ log.user }}</p>
            <p>仓库: {{ log.warehouseName }}</p>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useItemStore, type Item, type ItemStatus } from '../stores/itemStore';
import { useAuditLogStore } from '../stores/auditLogStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { STATUS_MAP } from '../utils/constants';

const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();
const auditLogStore = useAuditLogStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const item = ref<Item | null>(null);

const statusMap = STATUS_MAP;

const itemName = computed(() => itemDefStore.itemDefinitions.find(d => d.id === item.value?.itemDefinitionId)?.name || '加载中...');
const warehouseName = computed(() => warehouseStore.warehouses.find(w => w.id === item.value?.warehouseId)?.name || '加载中...');

onMounted(async () => {
  const itemId = route.params.id as string;
  // 确保基础数据已加载
  if (warehouseStore.warehouses.length === 0) warehouseStore.fetchWarehouses();
  if (itemDefStore.itemDefinitions.length === 0) itemDefStore.fetchItemDefinitions();
  
  await itemStore.fetchItems({ id: itemId });
  if (itemStore.items.length > 0) {
    item.value = itemStore.items[0];
    await auditLogStore.fetchLogs(itemId);
  }
});
</script>

<style scoped>
.page-container { padding: 24px; }
</style>
