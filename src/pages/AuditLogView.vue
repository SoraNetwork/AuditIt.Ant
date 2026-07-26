<template>
  <div>
    <a-page-header title="审计日志中心" sub-title="追踪系统内的所有关键操作" />
    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-form :layout="isMobile ? 'vertical' : 'inline'" :model="filters" class="filter-form">
          <a-form-item label="日期范围">
            <a-range-picker v-model:value="filters.dateRange" :style="isMobile ? { width: '100%' } : {}" />
          </a-form-item>
          <a-form-item label="操作类型">
            <a-select v-model:value="filters.action" placeholder="所有类型" :style="isMobile ? { width: '100%' } : { width: '170px' }" allow-clear>
              <a-select-option
                v-for="opt in actionOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="操作人">
            <a-input v-model:value="filters.user" placeholder="输入用户名" allow-clear />
          </a-form-item>
          <a-form-item>
            <a-button :block="isMobile" @click="exportXlsx" :disabled="filteredLogs.length === 0">
              <template #icon><download-outlined /></template>
              导出XLSX
            </a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <a-table
          v-if="!isMobile"
          :columns="columns"
          :data-source="filteredLogs"
          :loading="auditLogStore.loading"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-tag :color="actionColor(record.action)">{{ actionLabel(record.action) }}</a-tag>
            </template>
          </template>
        </a-table>

        <div v-else class="mobile-card-list">
          <a-skeleton :loading="auditLogStore.loading" active :paragraph="{ rows: 5 }">
            <MobileListCard v-for="log in filteredLogs" :key="log.id">
              <template #title>{{ log.itemName }} <span style="color: #999; font-weight: 400">· {{ log.itemShortId }}</span></template>
              <template #tags>
                <a-tag :color="actionColor(log.action)">{{ actionLabel(log.action) }}</a-tag>
              </template>
              <template #meta>
                <div>时间：{{ formatDateTime(log.timestamp) }}</div>
                <div>操作人：{{ log.user }}</div>
                <div v-if="log.warehouseName">仓库：{{ log.warehouseName }}</div>
                <div v-if="log.destination">去向/备注：{{ log.destination }}</div>
              </template>
            </MobileListCard>
            <a-empty v-if="filteredLogs.length === 0 && !auditLogStore.loading" description="暂无日志" />
          </a-skeleton>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue';
import { useAuditLogStore, type AuditLog } from '../stores/auditLogStore';
import dayjs from 'dayjs';
import { formatDateTime } from '../utils/formatters';
import { DownloadOutlined } from '@ant-design/icons-vue';
import { exportToXlsx } from '../utils/xlsx';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
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

const actionOptions = [
  { value: 'Inbound', label: '入库' },
  { value: 'Outbound', label: '出库/借出' },
  { value: 'Check', label: '盘点' },
  { value: 'Return', label: '归还' },
  { value: 'Dispose', label: '处置' },
  { value: 'Transfer', label: '调拨' },
  { value: 'RentalCreated', label: '租赁创建' },
  { value: 'RentalShipped', label: '租赁发货' },
  { value: 'RentalDelivered', label: '租赁签收' },
  { value: 'RentalReturned', label: '租赁归还' },
  { value: 'RentalExtended', label: '租赁续期' },
  { value: 'RentalCancelled', label: '租赁取消' },
  { value: 'RentalUpdated', label: '租赁修改' },
  { value: 'ExpectedReturnUpdated', label: '预计回库时间修改' },
];

const actionLabelMap: Record<string, string> = Object.fromEntries(
  actionOptions.map(o => [o.value, o.label])
);

const actionLabel = (action: string) => actionLabelMap[action] || action;

const actionColor = (action: string) => {
  if (action === 'Inbound' || action === 'Return' || action === 'RentalReturned') return 'green';
  if (action === 'Outbound' || action === 'RentalShipped') return 'blue';
  if (action === 'Dispose' || action === 'RentalCancelled') return 'red';
  if (action === 'Check') return 'purple';
  if (action === 'Transfer') return 'cyan';
  if (action === 'RentalCreated' || action === 'RentalDelivered') return 'geekblue';
  if (action === 'RentalExtended') return 'orange';
  if (action === 'RentalUpdated') return 'gold';
  if (action === 'ExpectedReturnUpdated') return 'cyan';
  return 'default';
};

const filteredLogs = computed(() => {
  return auditLogStore.logs.filter(log => {
    const timestamp = dayjs(log.timestamp);
    const dateMatch =
      !filters.dateRange ||
      (timestamp.isAfter(filters.dateRange[0].startOf('day')) &&
        timestamp.isBefore(filters.dateRange[1].endOf('day')));
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
  { title: '操作类型', dataIndex: 'action', key: 'action', width: 140 },
  { title: '物品名称', dataIndex: 'itemName', key: 'itemName' },
  { title: '可视化ID', dataIndex: 'itemShortId', key: 'itemShortId' },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: '去向/备注', dataIndex: 'destination', key: 'destination' },
  { title: '操作人', dataIndex: 'user', key: 'user' },
];

const exportXlsx = () => {
  const rows = filteredLogs.value.map(log => ({
    时间: formatDateTime(log.timestamp),
    操作类型: actionLabel(log.action),
    物品名称: log.itemName,
    可视化ID: log.itemShortId,
    仓库: log.warehouseName,
    '去向/备注': log.destination || '',
    操作人: log.user,
  }));
  const filename = `审计日志_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
  exportToXlsx(rows, filename, '审计日志');
};

onMounted(() => {
  auditLogStore.fetchLogs();
});
</script>

<style scoped>
.page-container { padding: 24px; }
.filter-form .ant-form-item { margin-bottom: 16px; margin-right: 16px; }

@media (max-width: 767.98px) {
  .page-container { padding: 0; }
  .filter-form .ant-form-item { margin-right: 0; margin-bottom: 8px; }
}
</style>
