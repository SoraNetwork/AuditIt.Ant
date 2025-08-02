<template>
  <div>
    <a-page-header title="审计日志中心" sub-title="追踪系统内的所有关键操作" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filters" class="filter-form">
          <a-form-item label="日期范围">
            <a-range-picker v-model:value="filters.dateRange" />
          </a-form-item>
          <a-form-item label="操作类型">
            <a-select v-model:value="filters.action" placeholder="所有类型" style="width: 150px" allow-clear>
              <a-select-option value="入库">入库</a-select-option>
              <a-select-option value="借出">借出</a-select-option>
              <a-select-option value="处置">处置</a-select-option>
              <a-select-option value="归还">归还</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="操作人">
            <a-input v-model:value="filters.user" placeholder="输入用户名" allow-clear />
          </a-form-item>
        </a-form>

        <a-divider />

        <a-table
          :columns="columns"
          :data-source="filteredLogs"
          :loading="auditLogStore.loading"
          row-key="id"
        />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue';
import { useAuditLogStore, type AuditLog } from '../stores/auditLogStore';
import dayjs from 'dayjs';
import { formatDateTime } from '../utils/formatters';

const auditLogStore = useAuditLogStore();

const filters = reactive<{
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  action?: string;
  user?: string;
}>({
  dateRange: null,
  action: undefined,
  user: '',
});

const filteredLogs = computed(() => {
  return auditLogStore.logs.filter(log => {
    const timestamp = dayjs(log.timestamp);
    const dateMatch = !filters.dateRange || 
      (timestamp.isAfter(filters.dateRange[0].startOf('day')) && timestamp.isBefore(filters.dateRange[1].endOf('day')));
    const actionMatch = !filters.action || log.action === filters.action;
    const userMatch = !filters.user || log.user.toLowerCase().includes(filters.user.toLowerCase());
    return dateMatch && actionMatch && userMatch;
  });
});

const columns = [
  { 
    title: '时间', 
    dataIndex: 'timestamp', 
    key: 'timestamp', 
    sorter: (a: AuditLog, b: AuditLog) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(), 
    defaultSortOrder: 'descend',
    customRender: ({ text }: { text: string }) => formatDateTime(text),
  },
  { title: '操作类型', dataIndex: 'action', key: 'action' },
  { title: '物品名称', dataIndex: 'itemName', key: 'itemName' },
  { title: '可视化ID', dataIndex: 'itemShortId', key: 'itemShortId' },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: '操作人', dataIndex: 'user', key: 'user' },
];

onMounted(() => {
  auditLogStore.fetchLogs();
});
</script>

<style scoped>
.page-container { padding: 24px; }
.filter-form .ant-form-item { margin-bottom: 16px; margin-right: 16px; }
</style>
