<template>
  <div>
    <a-page-header title="入库" sub-title="执行快速入库或手动生成新物品" />

    <div class="page-container">
      <a-tabs v-model:activeKey="activeTab">
        <!-- Tab 1: Quick Inbound with External Barcode -->
        <a-tab-pane key="quick" tab="快速入库 (带条码)">
          <a-card title="扫描或输入已有条码的物品">
            <a-form ref="quickFormRef" :model="quickFormState" :rules="quickFormRules" layout="vertical" style="max-width: 500px; margin: auto;">
              <a-form-item label="外部条码 (ShortId)" name="shortId">
                <a-input v-model:value="quickFormState.shortId" placeholder="扫描或输入外部条码" />
              </a-form-item>
              <a-form-item label="物品定义" name="itemDefinitionId">
                 <a-space-compact style="width: 100%">
                  <a-select
                    v-model:value="quickFormState.itemDefinitionId"
                    show-search
                    placeholder="搜索或选择物品定义"
                    :options="itemDefinitionStore.itemDefinitions.map(d => ({ value: d.id, label: d.name }))"
                    style="width: calc(100% - 60px)"
                  ></a-select>
                  <a-button @click="showNewItemDefModal">新建</a-button>
                </a-space-compact>
              </a-form-item>
              <a-form-item label="存放仓库" name="warehouseId">
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
                <a-upload :file-list="quickFileList" :before-upload="() => false" @change="handleQuickFileChange">
                  <a-button><upload-outlined /> 选择文件</a-button>
                </a-upload>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleQuickInbound" :loading="isSaving">确认入库</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- Tab 2: Manual Inbound for New Items -->
        <a-tab-pane key="manual" tab="手动入库 (生成新条码)">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-card title="录入新物品信息">
                <a-form ref="manualFormRef" :model="manualFormState" :rules="manualFormRules" layout="vertical">
                  <a-form-item label="物品定义" name="itemDefinitionId">
                     <a-space-compact style="width: 100%">
                        <a-select
                          v-model:value="manualFormState.itemDefinitionId"
                          show-search
                          placeholder="搜索或选择物品定义"
                          :options="itemDefinitionStore.itemDefinitions.map(d => ({ value: d.id, label: d.name }))"
                           style="width: calc(100% - 60px)"
                        ></a-select>
                        <a-button @click="showNewItemDefModal">新建</a-button>
                      </a-space-compact>
                  </a-form-item>
                  <a-form-item label="存放仓库" name="warehouseId">
                    <a-select
                      v-model:value="manualFormState.warehouseId"
                      placeholder="选择仓库"
                      :options="warehouseStore.warehouses.map(w => ({ value: w.id, label: w.name }))"
                    ></a-select>
                  </a-form-item>
                   <a-form-item label="数量" name="quantity">
                    <a-input-number v-model:value="manualFormState.quantity" :min="1" style="width: 100%" />
                  </a-form-item>
                  <a-form-item label="备注">
                    <a-textarea v-model:value="manualFormState.remarks" />
                  </a-form-item>
                  <a-form-item label="照片">
                    <a-upload :file-list="manualFileList" :before-upload="() => false" @change="handleManualFileChange">
                      <a-button><upload-outlined /> 选择文件</a-button>
                    </a-upload>
                  </a-form-item>
                  <a-form-item>
                    <a-button type="primary" @click="handleAddToPrintList">添加到待打印列表</a-button>
                  </a-form-item>
                </a-form>
              </a-card>
            </a-col>

            <a-col :span="16">
              <a-card title="待打印列表">
                <template #extra>
                  <a-button type="primary" @click="handleSaveAndPrint" :loading="isSaving" :disabled="!printList.length">
                    全部保存并打开打印预览
                  </a-button>
                </template>
                <a-table :data-source="printList" :columns="printListColumns" row-key="tempId" size="small">
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'action'">
                      <a-popconfirm title="确定要移除吗?" @confirm="handleRemoveFromPrintList(index)">
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
import { UploadOutlined } from '@ant-design/icons-vue';
import apiClient from '../services/api';
import { useRouter } from 'vue-router';
import ItemDefinitionForm from '../components/ItemDefinitionForm.vue';

// Stores & Router
const itemDefinitionStore = useItemDefinitionStore();
const warehouseStore = useWarehouseStore();
const router = useRouter();

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
const quickFileList = ref<UploadProps['fileList']>([]);
const quickFormRules = {
  shortId: [{ required: true, message: '请输入外部条码' }],
  itemDefinitionId: [{ required: true, message: '请选择物品定义' }],
  warehouseId: [{ required: true, message: '请选择仓库' }],
};

const handleQuickFileChange = (info: any) => {
  if (info.fileList.length > 0) {
    quickFileList.value = [info.fileList[info.fileList.length - 1]];
    quickFormState.photo = info.file.originFileObj;
  } else {
    quickFileList.value = [];
    quickFormState.photo = null;
  }
};

const resetQuickForm = () => {
  quickFormRef.value?.resetFields();
  quickFormState.remarks = '';
  quickFormState.photo = null;
  quickFileList.value = [];
};

const handleQuickInbound = async () => {
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
const manualFileList = ref<UploadProps['fileList']>([]);
const printList = ref<any[]>([]);

const manualFormRules = {
  itemDefinitionId: [{ required: true, message: '请选择物品定义' }],
  warehouseId: [{ required: true, message: '请选择仓库' }],
  quantity: [{ required: true, message: '请输入数量', type: 'number', min: 1 }],
};

const handleManualFileChange = (info: any) => {
   if (info.fileList.length > 0) {
    manualFileList.value = [info.fileList[info.fileList.length - 1]];
    manualFormState.photo = info.file.originFileObj;
  } else {
    manualFileList.value = [];
    manualFormState.photo = null;
  }
};

const resetManualForm = () => {
  manualFormRef.value?.resetFields();
  manualFormState.remarks = '';
  manualFormState.photo = null;
  manualFileList.value = [];
};

const handleAddToPrintList = async () => {
  try {
    await manualFormRef.value?.validate();
    const definition = itemDefinitionStore.itemDefinitions.find(d => d.id === manualFormState.itemDefinitionId);
    const warehouse = warehouseStore.warehouses.find(w => w.id === manualFormState.warehouseId);

    for (let i = 0; i < manualFormState.quantity; i++) {
      printList.value.push({
        tempId: Date.now() + i,
        itemDefinitionId: manualFormState.itemDefinitionId,
        warehouseId: manualFormState.warehouseId,
        remarks: manualFormState.remarks,
        // Only attach photo to the first item in a batch
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

const handleRemoveFromPrintList = (index: number) => {
  const item = printList.value[index];
  if (item.photoPreview) {
    URL.revokeObjectURL(item.photoPreview);
  }
  printList.value.splice(index, 1);
};

const handleSaveAndPrint = async () => {
  isSaving.value = true;
  const savedItems = [];
  try {
    for (const item of printList.value) {
      const formData = new FormData();
      formData.append('itemDefinitionId', item.itemDefinitionId);
      formData.append('warehouseId', item.warehouseId);
      if (item.remarks) formData.append('remarks', item.remarks);
      if (item.photo) formData.append('photo', item.photo);
      // No ShortId is sent, backend will generate it
      const response = await apiClient.post('/items/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      savedItems.push(response.data);
    }
    message.success(`${printList.value.length}个新物品已成功保存!`);
    
    const idsToPrint = savedItems.map(item => item.id);
    const routeData = router.resolve({
      name: 'print-preview',
      query: { ids: idsToPrint.join(',') },
    });
    window.open(routeData.href, '_blank');
    
    printList.value = []; // Clear the list after saving and printing
  } catch (error) {
    message.error('保存过程中发生错误。');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

const printListColumns = [
  { title: '物品定义', dataIndex: 'definitionName', key: 'definitionName' },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { title: '照片', key: 'photo', width: 80 },
  { title: '操作', key: 'action', width: 80 },
];

// --- New Item Definition Modal ---
const showNewItemDefModal = () => {
  isNewItemDefVisible.value = true;
};

const handleNewItemDefOk = async () => {
  try {
    const values = await newItemDefFormRef.value?.validateFields();
    if (!values) return;
    const newItem = await itemDefinitionStore.addItemDefinition(values as CreateItemDefinitionPayload);
    message.success('新物品定义创建成功！');
    
    // Auto-select the new definition in the currently active form
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
