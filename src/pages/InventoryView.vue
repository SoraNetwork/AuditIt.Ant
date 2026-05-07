<template>
  <div>
    <a-page-header title="库存总览" sub-title="查询所有仓库中的物品状态" />
    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-form :layout="isMobile ? 'vertical' : 'inline'" :model="filters" @finish="applyFilters" class="filter-form">
          <a-form-item label="搜索">
            <a-input v-model:value="filters.searchTerm" placeholder="搜索ID或名称" :style="isMobile ? { width: '100%' } : { width: '200px' }" allow-clear />
          </a-form-item>
          <a-form-item label="仓库">
            <a-select v-model:value="filters.warehouseId" placeholder="所有仓库" :style="isMobile ? { width: '100%' } : { width: '180px' }" @change="applyFilters" allow-clear>
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="物品状态">
            <a-select v-model:value="filters.status" placeholder="所有状态" :style="isMobile ? { width: '100%' } : { width: '150px' }" @change="applyFilters" allow-clear>
              <a-select-option value="InStock">在库</a-select-option>
              <a-select-option value="LoanedOut">借出</a-select-option>
              <a-select-option value="Disposed">处置</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :block="isMobile" @click="applyFilters">查询</a-button>
          </a-form-item>
          <a-form-item>
            <a-space :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
              <a-button :block="isMobile" @click="exportXlsx" :disabled="filteredData.length === 0">
                <template #icon><download-outlined /></template>
                导出XLSX
              </a-button>
              <a-upload
                :before-upload="onImportFile"
                :show-upload-list="false"
                accept=".xlsx,.xls"
                :style="isMobile ? { width: '100%' } : {}"
              >
                <a-button :block="isMobile" :loading="importing">
                  <template #icon><upload-outlined /></template>
                  批量导入
                </a-button>
              </a-upload>
              <a-button type="link" @click="downloadImportTemplate">下载模板</a-button>
            </a-space>
          </a-form-item>
        </a-form>

        <a-alert
          v-if="importReport"
          :type="importReport.errors.length === 0 ? 'success' : 'warning'"
          show-icon
          closable
          style="margin-bottom: 12px"
          @close="importReport = null"
        >
          <template #message>
            导入完成：成功 {{ importReport.success }} 条，失败 {{ importReport.errors.length }} 条
          </template>
          <template v-if="importReport.errors.length > 0" #description>
            <ul style="margin: 0; padding-left: 20px">
              <li v-for="(e, idx) in importReport.errors" :key="idx">{{ e }}</li>
            </ul>
          </template>
        </a-alert>

        <a-divider />

        <a-skeleton :loading="itemStore.loading" active :paragraph="{ rows: 5 }">
          <template v-if="filteredData.length > 0">
            <a-table
              v-if="!isMobile"
              :columns="columns"
              :data-source="filteredData"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'shortId'">
                  <router-link :to="{ name: 'item-details', params: { id: record.id } }">{{ record.shortId }}</router-link>
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="statusDisplay(record.status).color">{{ statusDisplay(record.status).text }}</a-tag>
                </template>
                <template v-else-if="column.key === 'currentDestination'">
                  <RentalReferenceText :text="record.currentDestination || '-'" />
                </template>
              </template>
            </a-table>

            <div v-else class="mobile-card-list">
              <MobileListCard
                v-for="item in filteredData"
                :key="item.id"
                clickable
                @click="router.push({ name: 'item-details', params: { id: item.id } })"
              >
                <template #title>{{ item.shortId }} · {{ item.name }}</template>
                <template #tags>
                  <a-tag :color="statusDisplay(item.status).color">{{ statusDisplay(item.status).text }}</a-tag>
                </template>
                <template #meta>
                  <div>仓库：{{ item.warehouseName }}</div>
                  <div>所有者：{{ item.ownerUserName || '-' }}</div>
                  <div v-if="item.currentDestination">
                    当前去向：<RentalReferenceText :text="item.currentDestination" />
                  </div>
                  <div>最后更新：{{ formatDateTime(item.lastUpdated) }}</div>
                </template>
              </MobileListCard>
            </div>
          </template>

          <a-empty v-else description="没有找到符合条件的物品，快去入库吧！">
            <a-button type="primary" @click="router.push('/inbound')">立即入库</a-button>
          </a-empty>
        </a-skeleton>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { useItemStore, type ItemStatus } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemDefinitionStore, type ItemDefinition } from '../stores/itemDefinitionStore';
import { STATUS_MAP } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import { exportToXlsx, parseXlsxFile } from '../utils/xlsx';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue';
import apiClient from '../services/api';
import type { Warehouse } from '../stores/warehouseStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RentalReferenceText from '../components/RentalReferenceText.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const router = useRouter();

const itemStore = useItemStore();
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();

const filters = reactive<{ warehouseId?: number; status?: ItemStatus; searchTerm?: string }>({
  warehouseId: undefined,
  status: undefined,
  searchTerm: '',
});

const statusDisplay = (status: ItemStatus) => {
  return STATUS_MAP[status] || { text: '未知', color: 'gray' };
};

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

const filteredData = computed(() => {
  if (!filters.searchTerm) {
    return tableData.value;
  }
  const searchTermLower = filters.searchTerm.toLowerCase();
  return tableData.value.filter(item => 
    item.shortId.toLowerCase().includes(searchTermLower) ||
    item.name.toLowerCase().includes(searchTermLower)
  );
});

const columns = [
  { title: '所有者', dataIndex: 'ownerUserName', key: 'ownerUserName' },
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '所在仓库', dataIndex: 'warehouseName', key: 'warehouse' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '当前去向', dataIndex: 'currentDestination', key: 'currentDestination' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { 
    title: '最后更新', 
    dataIndex: 'lastUpdated', 
    key: 'lastUpdated',
    customRender: ({ text }: { text: string }) => formatDateTime(text),
  },
];

onMounted(() => {
  // Initial fetch without filters
  itemStore.fetchItems();
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
});

const applyFilters = () => {
  // This function now only fetches from the API based on warehouse and status.
  // The text search is applied client-side on the results.
  const queryFilters: { warehouseId?: number; status?: ItemStatus } = {};
  if (filters.warehouseId) {
    queryFilters.warehouseId = Number(filters.warehouseId);
  }
  if (filters.status) {
    queryFilters.status = filters.status;
  }
  itemStore.fetchItems(queryFilters);
};

const importing = ref(false);
const importReport = ref<{ success: number; errors: string[] } | null>(null);

const exportXlsx = () => {
  const rows = filteredData.value.map(item => ({
    可视化ID: item.shortId,
    物品名称: item.name,
    所在仓库: item.warehouseName,
    状态: statusDisplay(item.status).text,
    当前去向: item.currentDestination || '',
    备注: item.remarks || '',
    入库时间: formatDateTime(item.entryDate),
    最后更新: formatDateTime(item.lastUpdated),
  }));
  exportToXlsx(rows, `库存_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`, '库存');
};

const downloadImportTemplate = () => {
  const rows = [
    { 物品名称: '示例物品A', 仓库名称: '主仓库', 可视化ID: '', 序列号: '', 备注: '' },
    { 物品名称: '示例物品B', 仓库名称: '主仓库', 可视化ID: 'SKU001', 序列号: 'SN-001', 备注: '带外部条码' },
  ];
  exportToXlsx(rows, '库存导入模板.xlsx', '库存');
};

interface ImportRow {
  物品名称?: string;
  仓库名称?: string;
  可视化ID?: string;
  序列号?: string;
  备注?: string;
}

const onImportFile = async (file: File) => {
  importing.value = true;
  importReport.value = null;
  try {
    if (itemDefStore.itemDefinitions.length === 0) await itemDefStore.fetchItemDefinitions();
    if (warehouseStore.warehouses.length === 0) await warehouseStore.fetchWarehouses();

    const rows = await parseXlsxFile<ImportRow>(file);
    if (rows.length === 0) {
      message.warning('文件中没有可导入的数据');
      importing.value = false;
      return false;
    }

    const defByName = new Map(itemDefStore.itemDefinitions.map(d => [d.name.trim(), d.id]));
    const whByName = new Map(warehouseStore.warehouses.map(w => [w.name.trim(), w.id]));

    interface ParsedItem {
      shortId?: string;
      serialNumber?: string;
      remarks?: string;
    }
    const groups = new Map<string, { itemDefinitionId: number; warehouseId: number; items: ParsedItem[] }>();
    const errors: string[] = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const defName = String(r.物品名称 ?? '').trim();
      const whName = String(r.仓库名称 ?? '').trim();
      if (!defName) { errors.push(`第${rowNum}行：缺少"物品名称"`); return; }
      if (!whName) { errors.push(`第${rowNum}行：缺少"仓库名称"`); return; }
      const defId = defByName.get(defName);
      const whId = whByName.get(whName);
      if (defId === undefined) { errors.push(`第${rowNum}行：物品定义"${defName}"不存在`); return; }
      if (whId === undefined) { errors.push(`第${rowNum}行：仓库"${whName}"不存在`); return; }

      const key = `${defId}_${whId}`;
      if (!groups.has(key)) groups.set(key, { itemDefinitionId: defId, warehouseId: whId, items: [] });
      groups.get(key)!.items.push({
        shortId: String(r.可视化ID ?? '').trim() || undefined,
        serialNumber: String(r.序列号 ?? '').trim() || undefined,
        remarks: String(r.备注 ?? '').trim() || undefined,
      });
    });

    let success = 0;
    for (const group of groups.values()) {
      try {
        await apiClient.post('/items/create/batch', {
          itemDefinitionId: group.itemDefinitionId,
          warehouseId: group.warehouseId,
          items: group.items,
        });
        success += group.items.length;
      } catch (err: any) {
        errors.push(`物品定义ID ${group.itemDefinitionId} / 仓库ID ${group.warehouseId} 批次失败：${err?.response?.data || err?.message}`);
      }
    }

    importReport.value = { success, errors };
    if (success > 0) {
      message.success(`成功导入 ${success} 条`);
      await itemStore.fetchItems();
    }
    if (errors.length > 0 && success === 0) {
      message.error('导入失败，请检查错误详情');
    }
  } catch (err: any) {
    message.error('解析文件失败：' + (err?.message || '未知错误'));
  } finally {
    importing.value = false;
  }
  return false;
};
</script>

<style scoped>
.page-container { padding: 24px; }
.filter-form .ant-form-item { margin-bottom: 0; margin-right: 8px; }

@media (max-width: 767.98px) {
  .page-container { padding: 0; }
  .filter-form .ant-form-item { margin-right: 0; margin-bottom: 8px; }
}
</style>
