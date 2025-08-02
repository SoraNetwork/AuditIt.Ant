<template>
  <div>
    <a-page-header title="入库" sub-title="执行快速入库或手动生成新物品" />

    <div class="page-container">
      <a-tabs v-model:activeKey="activeTab">
        <!-- Tab 1: Quick Inbound with External Barcode -->
        <a-tab-pane key="quick" tab="快速入库 (带条码)">
          <a-card title="扫描或输入已有条码的物品">
            <a-form ref="quickFormRef" :model="quickFormState" layout="vertical" style="max-width: 500px; margin: auto;">
              <a-form-item label="外部条码 (ShortId)" name="shortId" :rules="[{ required: true, message: '请输入外部条码' }]">
                <a-input v-model:value="quickFormState.shortId" placeholder="扫描或输入外部条码" />
              </a-form-item>
              <a-form-item label="物品定义" name="itemDefinitionId" :rules="[{ required: true, message: '请选择物品定义' }]">
                 <a-space-compact style="width: 100%">
                  <a-select
                    v-model:value="quickFormState.itemDefinitionId"
                    show-search
                    placeholder="搜索或选择物品定义"
                    :options="itemDefinitionStore.itemDefinitions.map(d => ({ value: d.id, label: d.name }))"
                    style="width: calc(100% - 60px)"
                  ></a-select>
                  <a-button @click="isNewItemDefVisible = true">新建</a-button>
                </a-space-compact>
              </a-form-item>
              <a-form-item label="存放仓库" name="warehouseId" :rules="[{ required: true, message: '请选择仓库' }]">
                <a-select
                  v-model:value="quickFormState.warehouseId"
                  placeholder="选择仓库"
                  :options="warehouseStore.warehouses.map(w => ({ value: w.id, label: w.name }))"
                ></a-select>
              </a-form-item>
              <a-form-item label="备注">
                <a-textarea v-model:value="quickFormState.remarks" />
              </a-form-item>
              <a-form-item label="照片">
                <a-upload :file-list="quickFileList" :before-upload="() => false" @change="(info: any) => {
                  if (info.fileList.length > 0) {
                    quickFileList = [info.fileList[info.fileList.length - 1]];
                    quickFormState.photo = info.file.originFileObj;
                  } else {
                    quickFileList = [];
                    quickFormState.photo = null;
                  }
                }">
                  <a-button>选择文件</a-button>
                </a-upload>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="quickInbound" :loading="isSaving">确认入库</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- Tab 2: Manual Inbound for New Items -->
        <a-tab-pane key="manual" tab="手动入库 (生成新条码)">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-card title="录入新物品信息">
                <a-form ref="manualFormRef" :model="manualFormState" layout="vertical">
                  <a-form-item label="物品定义" name="itemDefinitionId" :rules="[{ required: true, message: '请选择物品定义' }]">
                     <a-space-compact style="width: 100%">
                        <a-select
                          v-model:value="manualFormState.itemDefinitionId"
                          show-search
                          placeholder="搜索或选择物品定义"
                          :options="itemDefinitionStore.itemDefinitions.map(d => ({ value: d.id, label: d.name }))"
                           style="width: calc(100% - 60px)"
                        ></a-select>
                        <a-button @click="isNewItemDefVisible = true">新建</a-button>
                      </a-space-compact>
                  </a-form-item>
                  <a-form-item label="存放仓库" name="warehouseId" :rules="[{ required: true, message: '请选择仓库' }]">
                    <a-select
                      v-model:value="manualFormState.warehouseId"
                      placeholder="选择仓库"
                      :options="warehouseStore.warehouses.map(w => ({ value: w.id, label: w.name }))"
                    ></a-select>
                  </a-form-item>
                   <a-form-item label="数量" name="quantity" :rules="[{ required: true, message: '请输入数量', type: 'number', min: 1 }]">
                    <a-input-number v-model:value="manualFormState.quantity" :min="1" style="width: 100%" />
                  </a-form-item>
                  <a-form-item label="备注">
                    <a-textarea v-model:value="manualFormState.remarks" />
                  </a-form-item>
                  <a-form-item label="照片">
                    <a-upload :file-list="manualFileList" :before-upload="() => false" @change="(info: any) => {
                       if (info.fileList.length > 0) {
                        manualFileList = [info.fileList[info.fileList.length - 1]];
                        manualFormState.photo = info.file.originFileObj;
                      } else {
                        manualFileList = [];
                        manualFormState.photo = null;
                      }
                    }">
                      <a-button>选择文件</a-button>
                    </a-upload>
                  </a-form-item>
                  <a-form-item>
                    <a-button type="primary" @click="addToExportList">添加到导出列表</a-button>
                  </a-form-item>
                </a-form>
              </a-card>
            </a-col>

            <a-col :span="16">
              <a-card title="待导出列表">
                <template #extra>
                  <a-button type="primary" @click="saveAndExport" :loading="isSaving" :disabled="!exportList.length">
                    全部保存并导出XLSX
                  </a-button>
                </template>
                <a-table :data-source="exportList" :columns="[
                  { title: '物品定义', dataIndex: 'definitionName', key: 'definitionName' },
                  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
                  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
                  { title: '照片', key: 'photo', width: 80 },
                  { title: '操作', key: 'action', width: 80 },
                ]" row-key="tempId" size="small">
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'action'">
                      <a-popconfirm title="确定要移除吗?" @confirm="removeFromExportList(index)">
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
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- New Item Definition Modal -->
    <a-modal v-model:open="isNewItemDefVisible" title="新建物品定义" @ok="handleNewItemDefOk" :confirm-loading="itemDefinitionStore.loading">
      <ItemDefinitionForm ref="newItemDefFormRef" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useItemDefinitionStore, type CreateItemDefinitionPayload } from '../stores/itemDefinitionStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { message, type UploadProps, type FormInstance } from 'ant-design-vue';
import apiClient from '../services/api';
import ItemDefinitionForm from '../components/ItemDefinitionForm.vue';
import * as XLSX from 'xlsx';

// Stores
const itemDefinitionStore = useItemDefinitionStore();
const warehouseStore = useWarehouseStore();

// Common State
const activeTab = ref('quick');
const isSaving = ref(false);
const isNewItemDefVisible = ref(false);
const newItemDefFormRef = ref<InstanceType<typeof ItemDefinitionForm> | null>(null);

interface QuickFormState {
  shortId: string;
  itemDefinitionId: number | null;
  warehouseId: number | null;
  remarks: string;
  photo: File | null;
}

interface ManualFormState {
  itemDefinitionId: number | null;
  warehouseId: number | null;
  quantity: number;
  remarks: string;
  photo: File | null;
}

// --- Quick Inbound Tab ---
const quickFormRef = ref<FormInstance>();
const quickFormState = reactive<QuickFormState>({
  shortId: '',
  itemDefinitionId: null,
  warehouseId: null,
  remarks: '',
  photo: null,
});
let quickFileList = ref<UploadProps['fileList']>([]);

const resetQuickForm = () => {
  quickFormRef.value?.resetFields();
  quickFormState.remarks = '';
  quickFormState.photo = null;
  quickFileList.value = [];
};

const quickInbound = async () => {
  try {
    await quickFormRef.value?.validate();
    isSaving.value = true;
    const formData = new FormData();
    formData.append('shortId', quickFormState.shortId);
    formData.append('itemDefinitionId', String(quickFormState.itemDefinitionId!));
    formData.append('warehouseId', String(quickFormState.warehouseId!));
    if (quickFormState.remarks) formData.append('remarks', quickFormState.remarks);
    if (quickFormState.photo) formData.append('photo', quickFormState.photo);
    
    await apiClient.post('/items/create', formData);
    message.success(`物品 ${quickFormState.shortId} 已成功入库!`);
    resetQuickForm();
  } catch (error) {
    message.error('入库失败，请检查表单或条码是否已存在。');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

// --- Manual Inbound Tab ---
const manualFormRef = ref<FormInstance>();
const manualFormState = reactive<ManualFormState>({
  itemDefinitionId: null,
  warehouseId: null,
  quantity: 1,
  remarks: '',
  photo: null,
});
let manualFileList = ref<UploadProps['fileList']>([]);
const exportList = ref<any[]>([]);

const resetManualForm = () => {
  manualFormRef.value?.resetFields();
  manualFormState.remarks = '';
  manualFormState.photo = null;
  manualFileList.value = [];
};

const addToExportList = async () => {
  try {
    await manualFormRef.value?.validate();
    const definition = itemDefinitionStore.itemDefinitions.find(d => d.id === manualFormState.itemDefinitionId);
    const warehouse = warehouseStore.warehouses.find(w => w.id === manualFormState.warehouseId);

    for (let i = 0; i < manualFormState.quantity; i++) {
      exportList.value.push({
        tempId: Date.now() + i,
        itemDefinitionId: manualFormState.itemDefinitionId,
        warehouseId: manualFormState.warehouseId,
        remarks: manualFormState.remarks,
        photo: i === 0 ? manualFormState.photo : null,
        photoPreview: i === 0 && manualFormState.photo ? URL.createObjectURL(manualFormState.photo) : null,
        definitionName: definition?.name,
        warehouseName: warehouse?.name,
      });
    }
    resetManualForm();
  } catch (error) {
    message.error('请填写所有必填项。');
  }
};

const removeFromExportList = (index: number) => {
  const item = exportList.value[index];
  if (item.photoPreview) {
    URL.revokeObjectURL(item.photoPreview);
  }
  exportList.value.splice(index, 1);
};

const saveAndExport = async () => {
  isSaving.value = true;
  const savedItems = [];
  try {
    for (const item of exportList.value) {
      const formData = new FormData();
      formData.append('itemDefinitionId', String(item.itemDefinitionId));
      formData.append('warehouseId', String(item.warehouseId));
      if (item.remarks) formData.append('remarks', item.remarks);
      if (item.photo) formData.append('photo', item.photo);
      
      const response = await apiClient.post('/items/create', formData);
      savedItems.push(response.data);
    }
    message.success(`${exportList.value.length}个新物品已成功保存!`);
    
    const dataForExport = savedItems.map(item => ({
      '物品名称': item.itemDefinition?.name || '未知',
      '短ID': item.shortId,
      '备注': item.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '入库物品');
    XLSX.writeFile(workbook, `inbound_items_${Date.now()}.xlsx`);
    
    exportList.value = [];
  } catch (error) {
    message.error('保存过程中发生错误。');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

// --- New Item Definition Modal ---
const handleNewItemDefOk = async () => {
  try {
    const values = await newItemDefFormRef.value?.validateFields();
    if (!values) return;
    const newItem = await itemDefinitionStore.addItemDefinition(values as CreateItemDefinitionPayload);
    message.success('新物品定义创建成功！');
    
    if (activeTab.value === 'quick') {
      quickFormState.itemDefinitionId = newItem.id;
    } else {
      manualFormState.itemDefinitionId = newItem.id;
    }
    
    isNewItemDefVisible.value = false;
    newItemDefFormRef.value?.resetFields();
  } catch {
    message.error('请检查表单');
  }
};

// --- Lifecycle ---
onMounted(() => {
  itemDefinitionStore.fetchItemDefinitions();
  warehouseStore.fetchWarehouses();
});
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>
