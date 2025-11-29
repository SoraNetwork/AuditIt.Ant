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
                    :options="itemDefinitionStore.itemDefinitions. map(d => ({ value: d.id, label: d.name }))"
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
                <a-space-compact style="width: 100%;">
                  <a-textarea id="quick-remarks-textarea" ref="quickRemarksTextarea" v-model:value="quickFormState.remarks" style="width: calc(100% - 200px)" />
                  <div style="width:200px; display:flex; flex-direction:column; gap:6px;">
                    <!-- Popover for Quick Remarks 用 Popover 替代 Modal -->
                    <a-popover 
                      v-model:open="isQuickRemarkPickerVisible" 
                      title="快捷备注" 
                      placement="topRight"
                      trigger="click"
                      :overlayStyle="{ maxWidth: '400px' }"
                    >
                      <template #content>
                        <div style="width: 100%;">
                          <a-input 
                            v-model:value="quickRemarkSearch" 
                            placeholder="搜索快捷备注" 
                            allowClear 
                            style="margin-bottom: 12px;"
                            @input="quickRemarkSearch = $event.target.value"
                          />
                          <div style="max-height: 320px; overflow-y: auto; padding: 8px; border: 1px solid #f0f0f0; border-radius: 4px; background: #fafafa;">
                            <div v-if="filteredQuickRemarks.length === 0" style="color: #999; text-align: center; padding: 16px;">
                              暂无匹配的快捷备注
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                              <a-tag
                                v-for="r in filteredQuickRemarks"
                                :key="r. id"
                                style="cursor: pointer; padding: 6px 12px; background: #1890ff; color: white; border-radius: 4px; text-align: center; user-select: none; transition: all 0.3s;"
                                @click="insertQuickRemark(r. content)"
                                @mouseenter="$event.target.style.background = '#40a9ff'"
                                @mouseleave="$event.target.style.background = '#1890ff'"
                              >
                                <span style="word-break: break-all; white-space: normal;">{{ r.content }}</span>
                              </a-tag>
                            </div>
                          </div>
                          <a-divider style="margin: 12px 0;" />
                          <div style="display: flex; gap: 8px;">
                            <a-button type="link" size="small" @click="openManageFromPopover">管理</a-button>
                            <a-button size="small" @click="isQuickRemarkPickerVisible = false">关闭</a-button>
                          </div>
                        </div>
                      </template>
                      <a-button>快捷备注</a-button>
                    </a-popover>
                    <a-button type="link" @click="isManageQuickRemarksVisible = true">管理</a-button>
                  </div>
                </a-space-compact>
              </a-form-item>
              <a-form-item label="照片">
                <a-upload
                  v-model:file-list="quickFileList"
                  :before-upload="() => false"
                  @change="handleQuickFileChange"
                  list-type="picture-card"
                  :max-count="1"
                >
                  <div v-if="! quickFileList || quickFileList.length < 1">
                    <plus-outlined />
                    <div style="margin-top: 8px">上传</div>
                  </div>
                </a-upload>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="quickInbound" :loading="isSaving">确认入库</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- Tab 2: Batch Import -->
        <a-tab-pane key="batch" tab="批量导入">
          <a-row :gutter="16">
            <a-col :span="10">
              <a-card title="批量导入设置">
                <a-form :model="batchFormState" layout="vertical">
                  <a-form-item label="物品定义" name="itemDefinitionId" :rules="[{ required: true, message: '请选择物品定义' }]">
                    <a-space-compact style="width: 100%">
                      <a-select
                        v-model:value="batchFormState.itemDefinitionId"
                        show-search
                        placeholder="搜索或选择物品定义"
                        :options="itemDefinitionStore.itemDefinitions.map(d => ({ value: d. id, label: d.name }))"
                        style="width: calc(100% - 60px)"
                      ></a-select>
                      <a-button @click="isNewItemDefVisible = true">新建</a-button>
                    </a-space-compact>
                  </a-form-item>
                  <a-form-item label="存放仓库" name="warehouseId" :rules="[{ required: true, message: '请选择仓库' }]">
                    <a-select
                      v-model:value="batchFormState.warehouseId"
                      placeholder="选择仓库"
                      :options="warehouseStore.warehouses.map(w => ({ value: w.id, label: w.name }))"
                    ></a-select>
                  </a-form-item>
                  <a-form-item label="默认备注（可选）">
                    <a-input v-model:value="batchFormState.defaultRemarks" placeholder="此备注将应用到所有物品" />
                  </a-form-item>
                </a-form>

                <a-divider />

                <div style="margin-bottom: 16px;">
                  <h4>导入方式</h4>
                  <a-radio-group v-model:value="importMode" button-style="solid">
                    <a-radio-button value="text">文本输入</a-radio-button>
                    <a-radio-button value="excel">Excel导入</a-radio-button>
                  </a-radio-group>
                </div>

                <!-- 文本输入模式 -->
                <div v-if="importMode === 'text'">
                  <a-form-item label="批量输入条码">
                    <a-textarea 
                      v-model:value="batchTextInput"
                      :rows="8"
                      placeholder="每行一个条码，格式：
条码
条码,备注
条码,备注

示例：
ABC123
DEF456,需要维修
GHI789"
                    />
                  </a-form-item>
                  <a-button type="primary" @click="parseTextInput" block>解析并预览</a-button>
                </div>

                <!-- Excel导入模式 -->
                <div v-if="importMode === 'excel'">
                  <a-upload
                    :before-upload="handleExcelUpload"
                    :file-list="[]"
                    accept=".xlsx,.xls,. csv"
                  >
                    <a-button block>
                      <upload-outlined />
                      选择Excel/CSV文件
                    </a-button>
                  </a-upload>
                  <a-alert
                    message="Excel格式说明"
                    description="第一列：条码（必填）｜第二列：备注（选填）"
                    type="info"
                    show-icon
                    style="margin-top: 12px"
                  />
                  <a-button type="link" @click="downloadTemplate">下载模板</a-button>
                </div>
              </a-card>
            </a-col>

            <a-col :span="14">
              <a-card title="待导入预览" :loading="batchLoading">
                <template #extra>
                  <a-space>
                    <a-badge :count="batchItems.length" :number-style="{ backgroundColor: '#52c41a' }" />
                    <a-button 
                      type="primary" 
                      @click="executeBatchImport" 
                      :disabled="! batchItems.length || ! batchFormState.itemDefinitionId || !batchFormState.warehouseId"
                      :loading="isSaving"
                    >
                      确认导入
                    </a-button>
                    <a-button @click="clearBatchItems" :disabled="!batchItems.length">清空</a-button>
                  </a-space>
                </template>

                <a-table
                  :data-source="batchItems"
                  :columns="batchColumns"
                  :pagination="{ pageSize: 10 }"
                  size="small"
                  row-key="tempId"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'shortId'">
                      <a-input 
                        v-model:value="record.shortId" 
                        @blur="validateShortId(record)"
                        :status="record.error ? 'error' : ''"
                      />
                      <div v-if="record.error" style="color: red; font-size: 12px;">{{ record.error }}</div>
                    </template>
                    <template v-if="column.key === 'remarks'">
                      <a-input v-model:value="record.remarks" />
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-button type="link" danger size="small" @click="removeBatchItem(index)">删除</a-button>
                    </template>
                  </template>
                </a-table>

                <!-- 添加单个物品 -->
                <a-divider />
                <a-space>
                  <a-input v-model:value="singleItemInput. shortId" placeholder="条码" style="width: 200px" />
                  <a-input v-model:value="singleItemInput.remarks" placeholder="备注（选填）" style="width: 200px" />
                  <a-button @click="addSingleItem">添加</a-button>
                </a-space>
              </a-card>

              <!-- 导入结果 -->
              <a-card v-if="importResult" title="导入结果" style="margin-top: 16px">
                <a-result
                  :status="importResult.success ? 'success' : 'error'"
                  :title="importResult.message"
                  :sub-title="`成功: ${importResult.successCount} / 失败: ${importResult.failCount}`"
                >
                  <template v-if="importResult.success" #extra>
                    <a-button type="primary" @click="downloadImportResult">下载结果</a-button>
                    <a-button @click="resetBatchImport">继续导入</a-button>
                  </template>
                </a-result>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <!-- Tab 3: Manual Inbound for New Items -->
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
                          :options="itemDefinitionStore.itemDefinitions. map(d => ({ value: d.id, label: d.name }))"
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
                    <a-upload
                      v-model:file-list="manualFileList"
                      :before-upload="() => false"
                      @change="handleManualFileChange"
                      list-type="picture-card"
                      :max-count="1"
                    >
                      <div v-if="! manualFileList || manualFileList.length < 1">
                        <plus-outlined />
                        <div style="margin-top: 8px">上传</div>
                      </div>
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
                      <a-image v-if="record.photoPreview" :width="50" :src="record.photoPreview" />
                    </template>
                  </template>
                </a-table>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- Manage Quick Remarks Modal -->
    <a-modal v-model:open="isManageQuickRemarksVisible" title="管理快捷备注" :confirm-loading="quickRemarksLoading" @ok="isManageQuickRemarksVisible = false" :footer="null">
      <div>
        <a-space style="width: 100%; margin-bottom: 12px;">
          <a-input v-model:value="newQuickRemarkText" placeholder="请输入新快捷备注" />
          <a-button type="primary" @click="createQuickRemark" :loading="quickRemarksLoading">添加</a-button>
        </a-space>
        <a-divider />
        <div v-if="! quickRemarks.length" style="color:#888">暂无快捷备注</div>
        <div v-for="r in quickRemarks" :key="r.id" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom: 1px solid #f0f0f0">
          <div style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.content">{{ r.content }}</div>
          <a-button type="text" danger size="small" @click="deleteQuickRemark(r.id)">删除</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="isNewItemDefVisible" title="新建物品定义" @ok="handleNewItemDefOk" :confirm-loading="itemDefinitionStore.loading">
      <ItemDefinitionForm ref="newItemDefFormRef" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { computed } from 'vue';
import { useItemDefinitionStore, type CreateItemDefinitionPayload } from '../stores/itemDefinitionStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemStore } from '../stores/itemStore';
import { message, type UploadProps, type FormInstance } from 'ant-design-vue';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import ItemDefinitionForm from '../components/ItemDefinitionForm.vue';
import * as XLSX from 'xlsx';
import apiClient from '../services/api';
interface QuickRemarkDto { id: number; content: string; }
const quickRemarks = ref<QuickRemarkDto[]>([]);
const quickRemarksLoading = ref(false);
const isManageQuickRemarksVisible = ref(false);
const newQuickRemarkText = ref('');
// Popover picker visibility and textarea ref for inserting tags into remarks
const isQuickRemarkPickerVisible = ref(false);
const quickRemarksTextarea = ref<HTMLElement | null>(null);
const quickRemarkSearch = ref('');
const filteredQuickRemarks = computed(() => {
  const q = quickRemarkSearch.value.trim(). toLowerCase();
  if (!q) return quickRemarks. value;
  return quickRemarks.value.filter(r => r.content.toLowerCase().includes(q));
});

const fetchQuickRemarks = async () => {
  quickRemarksLoading.value = true;
  try {
    const res = await apiClient.get('/QuickRemarks');
    quickRemarks. value = res.data || [];
  } catch (err) {
    console.error('fetchQuickRemarks', err);
  } finally {
    quickRemarksLoading. value = false;
  }
};

const insertQuickRemark = (text: string) => {
  // 插入到备注输入框的光标位置（优先使用带 id 的 textarea）
  const ta = document.getElementById('quick-remarks-textarea') as HTMLTextAreaElement | null;
  if (! ta) {
    // fallback: 直接追加并添加空格分隔
    quickFormState.remarks = quickFormState.remarks ?  (quickFormState.remarks + ' ' + text) : text;
  } else {
    const start = ta.selectionStart ??  ta.value.length;
    const end = ta.selectionEnd ??  ta.value.length;
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const newVal = before + text + after;
    quickFormState.remarks = newVal;

    // 聚焦并把光标移动到插入后的位置
    setTimeout(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  // 插入后关闭选择器并清空搜索
  isQuickRemarkPickerVisible. value = false;
  quickRemarkSearch.value = '';
};

const openManageFromPopover = () => {
  isQuickRemarkPickerVisible.value = false;
  isManageQuickRemarksVisible.value = true;
};

const createQuickRemark = async () => {
  const content = newQuickRemarkText. value?. trim();
  if (!content) {
    message.warning('请输入备注内容');
    return;
  }
  quickRemarksLoading.value = true;
  try {
    const res = await apiClient.post('/QuickRemarks', { content });
    quickRemarks.value.unshift(res.data);
    newQuickRemarkText.value = '';
    message.success('添加成功');
  } catch (err) {
    console.error('createQuickRemark', err);
    message.error('添加失败');
  } finally {
    quickRemarksLoading. value = false;
  }
};

const deleteQuickRemark = async (id: number) => {
  quickRemarksLoading.value = true;
  try {
    await apiClient.delete(`/QuickRemarks/${id}`);
    quickRemarks.value = quickRemarks.value.filter(r => r.id !== id);
    message.success('已删除');
  } catch (err) {
    console.error('deleteQuickRemark', err);
    message.error('删除失败');
  } finally {
    quickRemarksLoading.value = false;
  }
};

// Stores
const itemDefinitionStore = useItemDefinitionStore();
const warehouseStore = useWarehouseStore();
const itemStore = useItemStore();

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
  photo?: File;
}

interface ManualFormState {
  itemDefinitionId: number | null;
  warehouseId: number | null;
  quantity: number;
  remarks: string;
  photo?: File;
}

interface BatchFormState {
  itemDefinitionId: number | null;
  warehouseId: number | null;
  defaultRemarks: string;
}

interface BatchItem {
  tempId: number;
  shortId: string;
  remarks: string;
  error?: string;
}

// --- Quick Inbound Tab ---
const quickFormRef = ref<FormInstance>();
const quickFormState = reactive<QuickFormState>({
  shortId: '',
  itemDefinitionId: null,
  warehouseId: null,
  remarks: '',
});
const quickFileList = ref<UploadProps['fileList']>([]);

const handleQuickFileChange = (info: any) => {
  quickFileList.value = info.fileList. slice(-1);
  if (quickFileList.value && quickFileList.value. length > 0) {
    quickFormState.photo = quickFileList.value[0]. originFileObj;
  } else {
    quickFormState. photo = undefined;
  }
};

const resetQuickForm = () => {
  quickFormRef.value?.resetFields();
  quickFormState.remarks = '';
  quickFormState. photo = undefined;
  quickFileList.value = [];
};

const quickInbound = async () => {
  try {
    await quickFormRef.value?.validate();
    isSaving.value = true;
    await itemStore.createItem({
      shortId: quickFormState.shortId,
      itemDefinitionId: quickFormState. itemDefinitionId! ,
      warehouseId: quickFormState.warehouseId! ,
      remarks: quickFormState.remarks,
      photo: quickFormState.photo,
    });
    message.success(`物品 ${quickFormState.shortId} 已成功入库! `);
    resetQuickForm();
  } catch (error) {
    message.error('入库失败，请检查表单或条码是否已存在。');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

// --- Batch Import Tab ---
const batchFormState = reactive<BatchFormState>({
  itemDefinitionId: null,
  warehouseId: null,
  defaultRemarks: '',
});

const importMode = ref<'text' | 'excel'>('text');
const batchTextInput = ref('');
const batchItems = ref<BatchItem[]>([]);
const batchLoading = ref(false);
const singleItemInput = reactive({
  shortId: '',
  remarks: ''
});

const importResult = ref<{
  success: boolean;
  message: string;
  successCount: number;
  failCount: number;
  data?: any[];
} | null>(null);

const batchColumns = [
  { title: '条码', key: 'shortId', width: 200 },
  { title: '备注', key: 'remarks' },
  { title: '操作', key: 'action', width: 80 },
];

// 解析文本输入
const parseTextInput = () => {
  const lines = batchTextInput.value. trim().split('\n'). filter(line => line.trim());
  const items: BatchItem[] = [];
  const existingIds = new Set<string>();

  for (const line of lines) {
    const parts = line.split(','). map(p => p.trim());
    const shortId = parts[0];
    
    if (! shortId) continue;
    
    if (existingIds.has(shortId)) {
      message.warning(`条码 ${shortId} 重复，已跳过`);
      continue;
    }
    
    existingIds.add(shortId);
    items.push({
      tempId: Date.now() + Math.random(),
      shortId,
      remarks: parts[1] || batchFormState.defaultRemarks || ''
    });
  }

  if (items.length === 0) {
    message.warning('未解析到有效的条码');
    return;
  }

  batchItems.value = [... batchItems.value, ...items];
  message.success(`成功解析 ${items.length} 个条码`);
  batchTextInput.value = '';
};

// Excel上传处理
const handleExcelUpload = async (file: File) => {
  batchLoading.value = true;
  try {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      const items: BatchItem[] = [];
      const existingIds = new Set(batchItems.value.map(item => item.shortId));
      
      // 跳过标题行（如果有）
      const startIndex = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                        (jsonData[0][0].toLowerCase(). includes('条码') || 
                         jsonData[0][0].toLowerCase(). includes('code')) ?  1 : 0;
      
      for (let i = startIndex; i < jsonData. length; i++) {
        const row = jsonData[i];
        const shortId = row[0]?.toString(). trim();
        
        if (! shortId) continue;
        
        if (existingIds.has(shortId)) {
          message.warning(`条码 ${shortId} 已存在，跳过`);
          continue;
        }
        
        existingIds.add(shortId);
        items.push({
          tempId: Date.now() + Math.random() + i,
          shortId,
          remarks: row[1]?.toString(). trim() || batchFormState. defaultRemarks || ''
        });
      }
      
      if (items.length === 0) {
        message.warning('未从文件中解析到有效的条码');
      } else {
        batchItems.value = [...batchItems. value, ...items];
        message.success(`成功从Excel导入 ${items.length} 个条码`);
      }
    };
    
    reader.readAsArrayBuffer(file);
  } catch (error) {
    message.error('文件解析失败，请检查文件格式');
    console.error(error);
  } finally {
    batchLoading.value = false;
  }
  return false; // 阻止默认上传
};

// 下载模板
const downloadTemplate = () => {
  const template = [
    ['条码', '备注'],
    ['ABC123', '示例备注'],
    ['DEF456', ''],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX. utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '批量导入模板');
  XLSX.writeFile(wb, '批量导入模板.xlsx');
};

// 添加单个物品
const addSingleItem = () => {
  if (!singleItemInput.shortId) {
    message.warning('请输入条码');
    return;
  }
  
  const exists = batchItems.value.some(item => item.shortId === singleItemInput.shortId);
  if (exists) {
    message.warning('该条码已存在');
    return;
  }
  
  batchItems.value.push({
    tempId: Date. now(),
    shortId: singleItemInput.shortId,
    remarks: singleItemInput.remarks || batchFormState.defaultRemarks || ''
  });
  
  singleItemInput.shortId = '';
  singleItemInput.remarks = '';
  message.success('添加成功');
};

// 删除批量项目
const removeBatchItem = (index: number) => {
  batchItems.value.splice(index, 1);
};

// 清空批量项目
const clearBatchItems = () => {
  batchItems.value = [];
  importResult.value = null;
};

// 验证ShortId
const validateShortId = (item: BatchItem) => {
  if (!item.shortId) {
    item.error = '条码不能为空';
    return;
  }
  
  const duplicates = batchItems.value.filter(i => 
    i.shortId === item.shortId && i.tempId !== item.tempId
  );
  
  if (duplicates.length > 0) {
    item.error = '条码重复';
  } else {
    item.error = undefined;
  }
};

// 执行批量导入
const executeBatchImport = async () => {
  if (! batchFormState.itemDefinitionId || ! batchFormState.warehouseId) {
    message.error('请选择物品定义和仓库');
    return;
  }
  
  // 验证所有条码
  const hasErrors = batchItems.value.some(item => {
    validateShortId(item);
    return item.error;
  });
  
  if (hasErrors) {
    message.error('请修正错误后再导入');
    return;
  }
  
  isSaving.value = true;
  try {
    const payload = {
      itemDefinitionId: batchFormState.itemDefinitionId,
      warehouseId: batchFormState.warehouseId,
      items: batchItems.value. map(item => ({
        shortId: item.shortId,
        remarks: item.remarks || undefined
      }))
    };
    
    const response = await apiClient.post('/items/create/batch', payload);
    
    // 获取物品定义和仓库名称
    const definition = itemDefinitionStore.itemDefinitions.find(d => d.id === batchFormState. itemDefinitionId);
    const warehouse = warehouseStore.warehouses.find(w => w.id === batchFormState.warehouseId);
    
    importResult.value = {
      success: true,
      message: response.data.message,
      successCount: batchItems.value.length,
      failCount: 0,
      data: batchItems.value. map(item => ({
        ... item,
        itemDefinition: definition?. name,
        warehouse: warehouse?. name
      }))
    };
    
    message.success('批量导入成功！');
    
    // 清空待导入列表
    batchItems.value = [];
    
    // 刷新物品列表
    await itemStore.fetchItems({ warehouseId: batchFormState.warehouseId });
    
  } catch (error: any) {
    message.error('批量导入失败: ' + (error.response?.data?.message || error.message));
    importResult.value = {
      success: false,
      message: '导入失败',
      successCount: 0,
      failCount: batchItems.value.length
    };
  } finally {
    isSaving.value = false;
  }
};

// 下载导入结果
const downloadImportResult = () => {
  if (!importResult.value?. data) return;
  
  const data = importResult.value.data. map(item => ({
    '物品定义': item.itemDefinition,
    '仓库': item.warehouse,
    '条码': item.shortId,
    '备注': item.remarks || '',
    '状态': '已导入'
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '导入结果');
  XLSX.writeFile(wb, `批量导入结果_${Date.now()}.xlsx`);
};

// 重置批量导入
const resetBatchImport = () => {
  batchItems.value = [];
  importResult.value = null;
  batchTextInput.value = '';
};

// --- Manual Inbound Tab ---
const manualFormRef = ref<FormInstance>();
const manualFormState = reactive<ManualFormState>({
  itemDefinitionId: null,
  warehouseId: null,
  quantity: 1,
  remarks: '',
});
const manualFileList = ref<UploadProps['fileList']>([]);
const exportList = ref<any[]>([]);

const handleManualFileChange = (info: any) => {
  manualFileList.value = info. fileList. slice(-1);
  if (manualFileList.value && manualFileList.value. length > 0) {
    manualFormState.photo = manualFileList.value[0].originFileObj;
  } else {
    manualFormState.photo = undefined;
  }
};

const resetManualForm = () => {
  manualFormRef.value?.resetFields();
  manualFormState.remarks = '';
  manualFormState.photo = undefined;
  manualFileList.value = [];
};

const addToExportList = async () => {
  try {
    await manualFormRef.value?.validate();
    const definition = itemDefinitionStore.itemDefinitions.find(d => d. id === manualFormState.itemDefinitionId);
    const warehouse = warehouseStore.warehouses.find(w => w.id === manualFormState.warehouseId);

    for (let i = 0; i < manualFormState.quantity; i++) {
      exportList.value.push({
        tempId: Date.now() + i,
        itemDefinitionId: manualFormState.itemDefinitionId,
        warehouseId: manualFormState.warehouseId,
        remarks: manualFormState.remarks,
        photo: i === 0 ? manualFormState.photo : undefined,
        photoPreview: i === 0 && manualFormState.photo ? URL.createObjectURL(manualFormState.photo) : null,
        definitionName: definition?.name,
        warehouseName: warehouse?. name,
      });
    }
    resetManualForm();
  } catch (error) {
    message.error('请填写所有必填项。');
  }
};

const removeFromExportList = (index: number) => {
  const item = exportList.value[index];
  if (item. photoPreview) {
    URL. revokeObjectURL(item. photoPreview);
  }
  exportList.value.splice(index, 1);
};

const saveAndExport = async () => {
  isSaving.value = true;
  const savedItems = [];
  try {
    for (const item of exportList.value) {
      const savedItem = await itemStore.createItem({
        itemDefinitionId: item.itemDefinitionId,
        warehouseId: item.warehouseId,
        remarks: item.remarks,
        photo: item.photo,
      });
      savedItems.push(savedItem);
    }
    message.success(`${exportList.value.length}个新物品已成功保存! `);
    
    const dataForExport = savedItems.map(item => ({
      '物品名称': item.itemDefinition?. name || '未知',
      '短ID': item.shortId,
      '备注': item. remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX. utils.book_append_sheet(workbook, worksheet, '入库物品');
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
    } else if (activeTab.value === 'batch') {
      batchFormState.itemDefinitionId = newItem.id;
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
  fetchQuickRemarks();
});
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>
