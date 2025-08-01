<template>
  <div>
    <a-page-header title="入库操作" sub-title="先生成并打印标签，再确认入库" />
    <div class="page-container">
      <a-row :gutter="16">
        <!-- Step 1: Generate Labels -->
        <a-col :span="10">
          <a-card title="第一步：生成标签">
            <a-form ref="form1Ref" :model="form1State" :rules="rules1" layout="vertical">
              <a-form-item label="入库物品" name="itemDefinitionId">
                <a-space-compact style="width: 100%">
                  <a-select v-model:value="form1State.itemDefinitionId" placeholder="请选择或新建物品" style="width: calc(100% - 120px)" show-search>
                    <a-select-option v-for="idef in itemDefStore.itemDefinitions" :key="idef.id" :value="idef.id">{{ idef.name }}</a-select-option>
                  </a-select>
                  <a-button type="dashed" @click="showNewItemDefModal">新建物品定义</a-button>
                </a-space-compact>
              </a-form-item>
              <a-form-item label="数量" name="quantity">
                <a-input-number v-model:value="form1State.quantity" :min="1" style="width: 100%" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleGenerateLabels">生成并准备打印</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>

        <!-- Step 2: Confirm Inbound -->
        <a-col :span="14">
          <a-card title="第二步：确认入库">
            <div v-if="itemStore.preInboundItems.length > 0">
              <a-alert :message="`已生成 ${itemStore.preInboundItems.length} 个待入库物品标签`" type="info" show-icon style="margin-bottom: 16px;" />
              <a-form ref="form2Ref" :model="form2State" :rules="rules2" layout="vertical">
                <a-form-item label="目标仓库" name="warehouseId">
                  <a-select v-model:value="form2State.warehouseId" placeholder="请选择一个仓库" show-search>
                    <a-select-option v-for="wh in warehouseStore.warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item>
                  <a-button type="success" @click="handleConfirmInbound" :loading="itemStore.loading">确认入库</a-button>
                </a-form-item>
              </a-form>
            </div>
            <a-empty v-else description="请先在左侧生成物品标签" />
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- Modals -->
    <a-modal v-model:open="isNewItemDefVisible" title="新建物品定义" @ok="handleNewItemDefOk" :confirm-loading="itemDefStore.loading"><ItemDefinitionForm ref="newItemDefFormRef" /></a-modal>
    <a-modal v-model:open="isPrintModalVisible" title="打印入库标签" width="80%">
      <div id="print-area" class="label-grid">
        <div v-for="item in itemStore.preInboundItems" :key="item.id" class="label">
          <p class="item-name">{{ getItemDefName(item.itemDefinitionId) }}</p>
          <canvas :id="'qr-' + item.id" class="qrcode"></canvas>
          <p class="item-id">{{ item.shortId }}</p>
          <p class="date">{{ new Date().toLocaleDateString() }}</p>
        </div>
      </div>
      <template #footer>
        <a-button key="back" @click="isPrintModalVisible = false">关闭</a-button>
        <a-button key="submit" type="primary" @click="handlePrint">打印</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useItemDefinitionStore, type CreateItemDefinitionPayload } from '../stores/itemDefinitionStore';
import { useItemStore } from '../stores/itemStore';
import ItemDefinitionForm from '../components/ItemDefinitionForm.vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import QRCode from 'qrcode';

// Stores
const warehouseStore = useWarehouseStore();
const itemDefStore = useItemDefinitionStore();
const itemStore = useItemStore();

// Refs
const form1Ref = ref<FormInstance>();
const form2Ref = ref<FormInstance>();
const newItemDefFormRef = ref<InstanceType<typeof ItemDefinitionForm> | null>(null);
const isNewItemDefVisible = ref(false);
const isPrintModalVisible = ref(false);

// Form States
const form1State = reactive<{ itemDefinitionId: number | undefined, quantity: number }>({ itemDefinitionId: undefined, quantity: 1 });
const form2State = reactive<{ warehouseId: number | undefined }>({ warehouseId: undefined });

// Rules
const rules1 = {
  itemDefinitionId: [{ required: true, message: '请选择物品！' }],
  quantity: [{ required: true, message: '请输入数量！', type: 'number', min: 1 }],
};
const rules2 = {
  warehouseId: [{ required: true, message: '请选择目标仓库！' }],
};

// Lifecycle
onMounted(() => {
  warehouseStore.fetchWarehouses();
  itemDefStore.fetchItemDefinitions();
  itemStore.preInboundItems = []; // Clear on page load
});

// Methods
const showNewItemDefModal = () => isNewItemDefVisible.value = true;

const handleNewItemDefOk = async () => {
  try {
    const values = await newItemDefFormRef.value?.validate();
    if (!values) return;
    await itemDefStore.addItemDefinition(values as CreateItemDefinitionPayload);
    message.success('新物品定义创建成功！');
    form1State.itemDefinitionId = itemDefStore.itemDefinitions[0].id;
    isNewItemDefVisible.value = false;
  } catch {
    message.error('请检查表单');
  }
};

const handleGenerateLabels = async () => {
  try {
    await form1Ref.value?.validate();
    itemStore.preInbound(form1State.itemDefinitionId!, form1State.quantity);
    isPrintModalVisible.value = true;
    await nextTick();
    generateQRCodes();
  } catch {
    message.error('请先选择物品和数量');
  }
};

const handleConfirmInbound = async () => {
  try {
    await form2Ref.value?.validate();
    await itemStore.confirmInbound(form2State.warehouseId!);
    message.success('确认入库成功！');
    form1Ref.value?.resetFields();
    form2Ref.value?.resetFields();
  } catch {
    message.error('请选择目标仓库');
  }
};

const generateQRCodes = () => {
  itemStore.preInboundItems.forEach(item => {
    const canvas = document.getElementById(`qr-${item.id}`);
    if (canvas) {
      QRCode.toCanvas(canvas, item.shortId, { width: 80, margin: 1 }, (error) => {
        if (error) console.error(error);
      });
    }
  });
};

const getItemDefName = (id: number) => itemDefStore.itemDefinitions.find(def => def.id === id)?.name || '未知';

const handlePrint = () => {
  const printArea = document.getElementById('print-area');
  if (!printArea) {
    message.error('找不到打印区域');
    return;
  }

  const canvases = printArea.getElementsByTagName('canvas');
  if (canvases.length === 0) {
    message.error('没有找到要打印的二维码');
    return;
  }

  const labelsHtml = Array.from(canvases).map((canvas, index) => {
    const item = itemStore.preInboundItems[index];
    if (!item) return '';

    const dataUrl = canvas.toDataURL('image/png');
    const itemName = getItemDefName(item.itemDefinitionId);
    const itemShortId = item.shortId;
    const date = new Date().toLocaleDateString();

    return `
      <div class="label-wrapper">
        <div class="label">
          <div class="qr-container">
            <img src="${dataUrl}" class="qrcode" />
          </div>
          <div class="info-container">
            <p class="item-name">${itemName}</p>
            <p class="item-id">${itemShortId}</p>
            <p class="date">${date}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>打印标签</title>
          <style>
            /* 
             * Counter-intuitive Rotated Layout.
             * This attempts a different transform order to achieve the same result,
             * which may bypass certain browser/driver rendering bugs.
            */
            @page {
              size: 30mm 40mm;
              margin: 0;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
            }
            body { 
              margin: 0; 
              font-family: 'Arial', sans-serif;
            }
            .label-wrapper {
              width: 30mm;
              height: 40mm;
              page-break-after: always;
              overflow: hidden;
            }
            .label { 
              width: 40mm;
              height: 30mm;
              padding: 2mm;
              box-sizing: border-box;
              
              transform-origin: top left;
              
              /* The counter-intuitive approach: translate then rotate(-90deg) */
              transform: rotate(-90deg) translateX(30mm) ;

              /* --- Content layout (remains horizontal) --- */
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
            }
            .qr-container {
              flex-shrink: 0;
              width: 24mm;
              height: 24mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qrcode {
              max-width: 100%;
              max-height: 100%;
            }
            .info-container {
              flex-grow: 1;
              padding-left: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              text-align: left;
              overflow: hidden;
              height: 100%;
            }
            .item-name { 
              font-weight: bold; 
              font-size: 9pt; 
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .item-id { 
              font-size: 8pt; 
              word-break: break-all; 
              margin: auto 0;
            }
            .date {
              font-size: 7pt;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.addEventListener('afterprint', () => window.close());
            window.onload = () => {
              window.focus();
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    message.error('无法打开打印窗口，请检查是否被浏览器拦截。');
  }
};
</script>

<style scoped>
.page-container { padding: 24px; }
.label-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
.label { border: 1px solid #ccc; padding: 8px; text-align: center; font-family: 'Verdana', sans-serif; page-break-inside: avoid; }
.item-name { font-weight: bold; font-size: 14px; margin: 0; }
.qrcode { margin: 8px 0; }
.item-id { font-size: 10px; word-break: break-all; margin: 0; }
.date { font-size: 9px; color: #555; }
</style>
