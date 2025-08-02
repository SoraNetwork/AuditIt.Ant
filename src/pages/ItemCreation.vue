<template>
  <div>
    <h2>物品批量录入</h2>
    <a-row :gutter="16">
      <!-- Entry Form -->
      <a-col :span="8">
        <a-card title="录入新物品">
          <a-form :model="formState" layout="vertical">
            <a-form-item label="外部条码 (ShortId)">
              <a-input v-model:value="formState.shortId" placeholder="扫描或输入外部条码" />
            </a-form-item>
            <a-form-item label="物品定义">
              <a-select
                v-model:value="formState.itemDefinitionId"
                show-search
                placeholder="搜索物品定义"
                :options="itemDefinitionStore.itemDefinitions.map((d: ItemDefinition) => ({ value: d.id, label: d.name }))"
              ></a-select>
            </a-form-item>
            <a-form-item label="存放仓库">
              <a-select
                v-model:value="formState.warehouseId"
                placeholder="选择仓库"
                :options="warehouseStore.warehouses.map(w => ({ value: w.id, label: w.name }))"
              ></a-select>
            </a-form-item>
            <a-form-item label="备注">
              <a-textarea v-model:value="formState.remarks" />
            </a-form-item>
            <a-form-item label="照片">
              <a-upload :file-list="fileList" :before-upload="() => false" @change="handleFileChange">
                <a-button>
                  <upload-outlined /> 选择文件
                </a-button>
              </a-upload>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleAddToBatch" :disabled="!isFormValid">添加到待录入列表</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- Batch List -->
      <a-col :span="16">
        <a-card title="待录入列表">
           <template #extra>
            <a-space>
              <a-button @click="handlePrint" :disabled="!batch.length || !areItemsSaved">打印选中项</a-button>
              <a-button type="primary" @click="handleSaveBatch" :loading="isSaving" :disabled="!batch.length || areItemsSaved">
                保存全部
              </a-button>
            </a-space>
          </template>
          <a-table :data-source="batch" :columns="batchColumns" row-key="tempId" size="small">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'action'">
                <a-popconfirm title="确定要移除吗?" @confirm="handleRemoveFromBatch(index)">
                  <a style="color: red">移除</a>
                </a-popconfirm>
              </template>
              <template v-if="column.key === 'photo'">
                <img v-if="record.photoPreview" :src="record.photoPreview" alt="preview" style="width: 50px; height: 50px; object-fit: cover;" />
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useItemDefinitionStore, type ItemDefinition } from '../stores/itemDefinitionStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { message, type UploadProps } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import apiClient from '../services/api';
import { useRouter } from 'vue-router';

// Stores
const itemDefinitionStore = useItemDefinitionStore();
const warehouseStore = useWarehouseStore();
const router = useRouter();

// State
const formState = reactive({
  shortId: '',
  itemDefinitionId: null,
  warehouseId: null,
  remarks: '',
  photo: null as File | null,
});
const fileList = ref<UploadProps['fileList']>([]);
const batch = ref<any[]>([]);
const isSaving = ref(false);
const areItemsSaved = ref(false);

// Computed
const isFormValid = computed(() => formState.shortId && formState.itemDefinitionId && formState.warehouseId);

// Methods
onMounted(() => {
  itemDefinitionStore.fetchItemDefinitions();
  warehouseStore.fetchWarehouses();
});

const handleFileChange = (info: any) => {
  if (info.fileList.length > 0) {
    fileList.value = [info.fileList[info.fileList.length - 1]];
    formState.photo = info.file.originFileObj;
  } else {
    fileList.value = [];
    formState.photo = null;
  }
};

const resetForm = () => {
  formState.shortId = '';
  formState.itemDefinitionId = null;
  formState.warehouseId = null;
  formState.remarks = '';
  formState.photo = null;
  fileList.value = [];
};

const handleAddToBatch = () => {
  const definition = itemDefinitionStore.itemDefinitions.find((d: ItemDefinition) => d.id === formState.itemDefinitionId);
  const warehouse = warehouseStore.warehouses.find(w => w.id === formState.warehouseId);

  batch.value.push({
    tempId: Date.now(),
    shortId: formState.shortId,
    itemDefinitionId: formState.itemDefinitionId,
    warehouseId: formState.warehouseId,
    remarks: formState.remarks,
    photo: formState.photo,
    photoPreview: formState.photo ? URL.createObjectURL(formState.photo) : null,
    // For display
    definitionName: definition?.name,
    warehouseName: warehouse?.name,
  });
  resetForm();
  areItemsSaved.value = false;
};

const handleRemoveFromBatch = (index: number) => {
  const item = batch.value[index];
  if (item.photoPreview) {
    URL.revokeObjectURL(item.photoPreview);
  }
  batch.value.splice(index, 1);
};

const handleSaveBatch = async () => {
  isSaving.value = true;
  const savedItems = [];
  try {
    for (const item of batch.value) {
      const formData = new FormData();
      formData.append('shortId', item.shortId);
      formData.append('itemDefinitionId', item.itemDefinitionId);
      formData.append('warehouseId', item.warehouseId);
      if (item.remarks) formData.append('remarks', item.remarks);
      if (item.photo) formData.append('photo', item.photo);

      const response = await apiClient.post('/items/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      savedItems.push(response.data);
    }
    message.success(`${batch.value.length}个物品已成功保存!`);
    batch.value = savedItems; // Replace batch with saved items containing permanent IDs
    areItemsSaved.value = true;
  } catch (error) {
    message.error('保存过程中发生错误，部分物品可能未保存成功。');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

const handlePrint = () => {
  const idsToPrint = batch.value.map(item => item.id);
  if (idsToPrint.some(id => !id)) {
      message.error("列表中包含未保存的物品，请先保存再打印。");
      return;
  }
  const routeData = router.resolve({
    name: 'print-preview', // We will create this route next
    query: { ids: idsToPrint.join(',') },
  });
  window.open(routeData.href, '_blank');
};

// Table Columns
const batchColumns = [
  { title: '外部条码', dataIndex: 'shortId', key: 'shortId' },
  { title: '物品定义', dataIndex: 'definitionName', key: 'definitionName' },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { title: '照片', key: 'photo' },
  { title: '操作', key: 'action' },
];
</script>
