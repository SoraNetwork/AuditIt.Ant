<template>
  <div>
    <a-page-header title="库房转移" sub-title="将物品从一个库房转移到另一个库房" />
    <div class="page-container">
      <a-card>
        <a-form layout="inline" :model="filterState" @finish="loadItems">
          <a-form-item label="源库房">
            <a-select 
              v-model:value="filterState.warehouseId" 
              placeholder="请选择源库房" 
              style="width: 200px" 
              @change="loadItems" 
              allow-clear
            >
              <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">
                {{ wh.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="物品状态">
            <a-select 
              v-model:value="filterState.status" 
              placeholder="选择状态" 
              style="width: 150px" 
              @change="loadItems"
              allow-clear
            >
              <a-select-option value="InStock">在库</a-select-option>
              <a-select-option value="LoanedOut">借出</a-select-option>
              <a-select-option value="SuspectedMissing">疑似丢失</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="搜索">
            <a-input-search 
              v-model:value="searchText" 
              placeholder="按名称或短ID搜索" 
              style="width: 200px" 
              allow-clear 
            />
          </a-form-item>
        </a-form>

        <a-divider />

        <div v-if="filterState.warehouseId">
          <a-space style="margin-bottom: 16px;">
            <a-button 
              type="primary" 
              :disabled="!hasSelected" 
              :loading="itemStore.loading" 
              @click="showTransferModal"
            >
              转移选中项 ({{ selectedRowKeys.length }})
            </a-button>
            <a-tag v-if="filterState.warehouseId" color="blue">
              当前库房: {{ currentWarehouseName }}
            </a-tag>
          </a-space>

          <a-table
            v-if="!itemStore.loading"
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
              <template v-if="column.key === 'photoUrl'">
                <a-image 
                  v-if="record.photoUrl" 
                  :width="50" 
                  :src="getPhotoUrl(record.photoUrl)" 
                  :preview="{ src: getPhotoUrl(record.photoUrl) }"
                />
                <span v-else>无</span>
              </template>
              <template v-if="column.key === 'actions'">
                <a-button type="link" size="small" @click="showSingleTransferModal(record)">
                  转移
                </a-button>
              </template>
            </template>
          </a-table>
          <a-empty v-if="!itemStore.loading && filteredData.length === 0" description="该库房中没有符合条件的物品" />
        </div>
        <a-empty v-else description="请先选择一个源库房以加载物品" />
      </a-card>
    </div>

    <!-- 转移确认弹窗 -->
    <a-modal
      v-model:open="transferModalVisible"
      title="转移物品到新库房"
      ok-text="确认转移"
      cancel-text="取消"
      :confirm-loading="itemStore.loading"
      @ok="handleTransfer"
    >
      <a-form :model="transferForm" layout="vertical">
        <a-form-item label="目标库房" required>
          <a-select 
            v-model:value="transferForm.targetWarehouseId" 
            placeholder="请选择目标库房"
            style="width: 100%"
          >
            <a-select-option 
              v-for="wh in availableTargetWarehouses" 
              :key="wh.id" 
              :value="wh.id"
            >
              {{ wh.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="备注（可选）">
          <a-textarea 
            v-model:value="transferForm.remarks" 
            placeholder="输入转移原因或备注"
            :rows="3"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <a-alert
          v-if="selectedRowKeys.length > 0"
          :message="`将转移 ${selectedRowKeys.length} 件物品`"
          type="info"
          show-icon
          style="margin-top: 16px"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore, getStatusText, type ItemStatus } from '../stores/itemStore';
import { message } from 'ant-design-vue';

const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();

const filterState = reactive<{ 
  warehouseId: number | undefined;
  status: ItemStatus | undefined;
}>({ 
  warehouseId: undefined,
  status: undefined
});

const searchText = ref('');
const selectedRowKeys = ref<string[]>([]);
const transferModalVisible = ref(false);

const transferForm = reactive({
  targetWarehouseId: undefined as number | undefined,
  remarks: ''
});

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

const currentWarehouseName = computed(() => {
  if (!filterState.warehouseId) return '';
  const warehouse = warehouseStore.warehouses.find(w => w.id === filterState.warehouseId);
  return warehouse?.name || '';
});

const availableTargetWarehouses = computed(() => {
  return warehouseStore.warehouses.filter(w => w.id !== filterState.warehouseId);
});

const columns = [
  { title: '可视化ID', dataIndex: 'shortId', key: 'shortId', width: 120 },
  { title: '物品名称', dataIndex: 'name', key: 'name' },
  { title: '当前状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '照片', dataIndex: 'photoUrl', key: 'photoUrl', width: 80 },
  { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
  { title: '操作', key: 'actions', width: 80 },
];

onMounted(() => {
  warehouseStore.fetchWarehouses();
});

const loadItems = async () => {
  if (filterState.warehouseId) {
    const filters: any = { warehouseId: filterState.warehouseId };
    if (filterState.status) {
      filters.status = filterState.status;
    }
    await itemStore.fetchItems(filters);
  } else {
    itemStore.items = [];
  }
  selectedRowKeys.value = [];
  searchText.value = '';
};

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const showTransferModal = () => {
  if (!hasSelected.value) return;
  transferForm.targetWarehouseId = undefined;
  transferForm.remarks = '';
  transferModalVisible.value = true;
};

const showSingleTransferModal = (record: any) => {
  selectedRowKeys.value = [record.id];
  showTransferModal();
};

const handleTransfer = async () => {
  if (!transferForm.targetWarehouseId) {
    message.error('请选择目标库房');
    return;
  }

  if (transferForm.targetWarehouseId === filterState.warehouseId) {
    message.error('目标库房不能与源库房相同');
    return;
  }

  try {
    await itemStore.transferWarehouseBatch(
      selectedRowKeys.value,
      transferForm.targetWarehouseId,
      transferForm.remarks || undefined
    );

    const targetWarehouse = warehouseStore.warehouses.find(
      w => w.id === transferForm.targetWarehouseId
    );
    
    message.success(
      `成功转移 ${selectedRowKeys.value.length} 件物品到 ${targetWarehouse?.name || '目标库房'}`
    );
    
    transferModalVisible.value = false;
    selectedRowKeys.value = [];
    await loadItems();
  } catch (error) {
    message.error('转移失败，请重试');
  }
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

const getPhotoUrl = (photoUrl: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';
  return baseUrl.replace('/api', '') + photoUrl;
};
</script>

<style scoped>
.page-container { 
  padding: 24px; 
}
</style>