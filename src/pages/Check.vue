<template>
  <div>
    <a-page-header title="连续盘点" sub-title="使用扫描枪或手动输入短ID进行快速盘点" />
    <div class="page-container">
      <a-card>
        <a-row :gutter="24">
          <!-- Left Side: Input and Controls -->
          <a-col :span="8">
            <a-form-item label="扫描或输入物品短ID">
              <a-input-search
                v-model:value="currentShortId"
                placeholder="在此处扫描或输入ID..."
                size="large"
                autofocus
                @search="handleSingleCheck"
                @keydown.enter.prevent="handleSingleCheck"
              >
                <template #enterButton>
                  <a-button type="primary">盘点</a-button>
                </template>
              </a-input-search>
            </a-form-item>
            
            <a-divider>统计</a-divider>
            
            <a-row :gutter="16">
              <a-col :span="8">
                <a-statistic title="成功" :value="stats.success" />
              </a-col>
              <a-col :span="8">
                <a-statistic title="失败" :value="stats.failed" />
              </a-col>
              <a-col :span="8">
                <a-statistic title="重复" :value="stats.duplicate" />
              </a-col>
            </a-row>

            <a-divider />
            <a-button @click="clearResults" block>清空列表</a-button>

          </a-col>

          <!-- Right Side: Results -->
          <a-col :span="16">
            <a-list :data-source="scannedItems" bordered :loading="isLoading">
              <template #renderItem="{ item }">
                <a-list-item :class="`status-${item.status.toLowerCase()}`">
                  <a-list-item-meta>
                    <template #title>
                      <span class="item-name">{{ item.name }}</span>
                      <span class="item-short-id"> ({{ item.shortId }})</span>
                    </template>
                    <template #description>
                      <span>{{ item.message }}</span>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-tag :color="item.tagColor">{{ item.status }}</a-tag>
                  </template>
                </a-list-item>
              </template>
               <template #header>
                <div>盘点结果 (最新扫描的在最上方)</div>
              </template>
            </a-list>
            <a-empty v-if="scannedItems.length === 0 && !isLoading" description="请开始扫描..." style="margin-top: 24px;" />
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useItemStore } from '../stores/itemStore';
import { message } from 'ant-design-vue';

type ScanStatus = '成功' | '失败' | '重复';

interface ScannedItem {
  shortId: string;
  name: string;
  message: string;
  status: ScanStatus;
  tagColor: string;
}

const itemStore = useItemStore();

const currentShortId = ref('');
const isLoading = ref(false);
const scannedItems = ref<ScannedItem[]>([]);
const scannedIds = new Set<string>();

const stats = reactive({
  success: 0,
  failed: 0,
  duplicate: 0,
});

// Sound effects for feedback - using simple base64 encoded sounds to avoid external files
const successSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaXRyYXRlOjMyMGtiL3MA');
const failSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaXRyYXRlOjI1NmtiL3MA');


const handleSingleCheck = async () => {
  const shortId = currentShortId.value.trim();
  if (!shortId) return;

  isLoading.value = true;

  if (scannedIds.has(shortId)) {
    stats.duplicate++;
    addScannedItem({
      shortId,
      name: '重复扫描',
      message: `该物品已在本次盘点中扫描过。`,
      status: '重复',
      tagColor: 'orange',
    });
    currentShortId.value = '';
    isLoading.value = false;
    failSound.play().catch(e => console.error("Audio play failed:", e));
    return;
  }

  try {
    await itemStore.fetchItems({ shortId });
    const item = itemStore.items.find(i => i.shortId === shortId);

    if (!item) {
      throw new Error('物品未在系统中找到');
    }

    const originalStatus = item.status;
    // Per user request, 'return' action forces status to 'InStock'
    const updatedItem = await itemStore.updateItemStatus(item.id, 'check');

    stats.success++;
    scannedIds.add(shortId);
    addScannedItem({
      shortId,
      name: updatedItem.itemDefinition?.name || '未知物品',
      message: `原状态: ${originalStatus} -> 新状态: ${updatedItem.status}`,
      status: '成功',
      tagColor: 'green',
    });
    successSound.play().catch(e => console.error("Audio play failed:", e));

  } catch (error: any) {
    stats.failed++;
    addScannedItem({
      shortId,
      name: '操作失败',
      message: error.message || '未知错误',
      status: '失败',
      tagColor: 'red',
    });
    failSound.play().catch(e => console.error("Audio play failed:", e));
  } finally {
    currentShortId.value = '';
    isLoading.value = false;
  }
};

const addScannedItem = (item: ScannedItem) => {
  scannedItems.value.unshift(item); // Add to the top of the list
};

const clearResults = () => {
  scannedItems.value = [];
  scannedIds.clear();
  stats.success = 0;
  stats.failed = 0;
  stats.duplicate = 0;
  message.info('结果已清空');
};

</script>

<style scoped>
.page-container { padding: 24px; }
.status-成功 { background-color: #f6ffed; }
.status-失败 { background-color: #fff1f0; }
.status-重复 { background-color: #fffbe6; }

.item-name { font-weight: 500; }
.item-short-id { color: #888; margin-left: 8px; }
</style>
