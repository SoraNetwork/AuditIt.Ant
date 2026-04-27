<template>
  <div>
    <a-page-header
      title="连续盘点"
      sub-title="使用扫码枪或手动输入短 ID，快速完成在库盘点。"
    />
    <div class="page-container">
      <a-card class="check-shell" :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-row :gutter="isMobile ? [0, 12] : 24">
          <a-col :xs="24" :span="8">
            <div :class="['check-controls', { 'mobile-sticky-controls': isMobile }]">
              <div v-if="isMobile" class="mobile-section-note">
                <strong>扫描入口</strong>
                <span>支持连续扫码，最近一次扫描结果会固定排在最上方。</span>
              </div>

              <a-form layout="vertical" class="check-form">
                <a-form-item label="扫描或输入物品短 ID" :style="isMobile ? { marginBottom: '10px' } : {}">
                  <a-space-compact block style="width: 100%">
                    <MobileScanInput
                      ref="scanInputRef"
                      v-model="currentShortId"
                      placeholder="在这里扫码或输入短 ID"
                      size="large"
                      autofocus
                      @pressEnter="handleSingleCheck"
                      @scan-success="handleSingleCheck"
                    />
                    <a-button type="primary" size="large" @click="handleSingleCheck">盘点</a-button>
                  </a-space-compact>
                </a-form-item>
              </a-form>

              <div v-if="isMobile" class="mobile-summary-grid">
                <div class="mobile-summary-card">
                  <div class="mobile-summary-label">成功</div>
                  <div class="mobile-summary-value success-text">{{ stats.success }}</div>
                </div>
                <div class="mobile-summary-card">
                  <div class="mobile-summary-label">失败</div>
                  <div class="mobile-summary-value failed-text">{{ stats.failed }}</div>
                </div>
                <div class="mobile-summary-card">
                  <div class="mobile-summary-label">重复</div>
                  <div class="mobile-summary-value duplicate-text">{{ stats.duplicate }}</div>
                </div>
                <div class="mobile-summary-card">
                  <div class="mobile-summary-label">累计扫描</div>
                  <div class="mobile-summary-value">{{ scannedItems.length }}</div>
                </div>
              </div>

              <template v-else>
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
              </template>

              <a-divider :style="isMobile ? { margin: '10px 0' } : {}" />
              <a-button @click="clearResults" block>清空结果</a-button>
            </div>
          </a-col>

          <a-col :xs="24" :span="16">
            <div v-if="isMobile && hasResults" class="mobile-section-note">
              <strong>盘点结果</strong>
              <span>共 {{ scannedItems.length }} 条记录，列表按时间倒序显示，方便连续复核。</span>
            </div>

            <a-list
              v-if="!isMobile"
              :data-source="scannedItems"
              bordered
              :loading="isLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item :class="`status-${item.status}`">
                  <a-list-item-meta>
                    <template #title>
                      <span class="item-name">{{ item.name }}</span>
                      <span class="item-short-id">({{ item.shortId }})</span>
                    </template>
                    <template #description>
                      <span>{{ item.message }}</span>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
                  </template>
                </a-list-item>
              </template>
              <template #header>
                <div>盘点结果（最近扫描在最上方）</div>
              </template>
            </a-list>

            <div v-else>
              <a-skeleton :loading="isLoading" active :paragraph="{ rows: 4 }">
                <div v-if="hasResults" class="mobile-card-list">
                  <MobileListCard
                    v-for="item in scannedItems"
                    :key="`${item.shortId}-${item.scannedAt}`"
                    :active="item.status === 'success'"
                  >
                    <template #title>{{ item.name }}</template>
                    <template #tags>
                      <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
                    </template>
                    <template #subtitle>{{ item.shortId }}</template>
                    <template #meta>
                      <div>{{ item.message }}</div>
                      <div>时间：{{ formatTime(item.scannedAt) }}</div>
                    </template>
                  </MobileListCard>
                </div>
                <a-empty v-else description="请开始扫描物品" class="check-empty" />
              </a-skeleton>
            </div>

            <a-empty
              v-if="!isMobile && !hasResults && !isLoading"
              description="请开始扫描物品"
              class="check-empty"
            />
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import MobileScanInput from '../components/mobile/MobileScanInput.vue';
import { getStatusText as getItemStatusText, useItemStore } from '../stores/itemStore';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();

type ScanStatus = 'success' | 'failed' | 'duplicate';

interface ScannedItem {
  shortId: string;
  name: string;
  message: string;
  status: ScanStatus;
  scannedAt: number;
}

const itemStore = useItemStore();
const scanInputRef = ref();
const currentShortId = ref('');
const isLoading = ref(false);
const scannedItems = ref<ScannedItem[]>([]);
const scannedIds = new Set<string>();
const lastProcessedId = ref<string | null>(null);
const lastProcessedTime = ref(0);

const stats = reactive({
  success: 0,
  failed: 0,
  duplicate: 0,
});

const hasResults = computed(() => scannedItems.value.length > 0);

const successSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaXRyYXRlOjMyMGtiL3MA');
const failSound = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaXRyYXRlOjI1NmtiL3MA');

const focusInput = async () => {
  await nextTick();
  scanInputRef.value?.focus?.();
};

const getStatusText = (status: ScanStatus) => {
  if (status === 'success') return '成功';
  if (status === 'duplicate') return '重复';
  return '失败';
};

const getStatusColor = (status: ScanStatus) => {
  if (status === 'success') return 'green';
  if (status === 'duplicate') return 'orange';
  return 'red';
};

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const addScannedItem = (item: Omit<ScannedItem, 'scannedAt'>) => {
  scannedItems.value.unshift({
    ...item,
    scannedAt: Date.now(),
  });
};

const handleSingleCheck = async () => {
  const now = Date.now();
  const shortIdValue = currentShortId.value.trim();

  if (!shortIdValue) return;

  if (shortIdValue === lastProcessedId.value && now - lastProcessedTime.value < 500) {
    return;
  }

  lastProcessedId.value = shortIdValue;
  lastProcessedTime.value = now;
  isLoading.value = true;

  if (scannedIds.has(shortIdValue)) {
    stats.duplicate += 1;
    addScannedItem({
      shortId: shortIdValue,
      name: '重复扫描',
      message: '该物品已在本次盘点中扫描过。',
      status: 'duplicate',
    });
    currentShortId.value = '';
    isLoading.value = false;
    failSound.play().catch(() => {});
    await focusInput();
    return;
  }

  try {
    await itemStore.fetchItems({ shortId: shortIdValue });
    const item = itemStore.items.find(i => i.shortId === shortIdValue);

    if (!item) {
      throw new Error('物品未在系统中找到。');
    }

    const originalStatus = item.status;
    const updatedItem = await itemStore.updateItemStatus(item.id, 'check');

    stats.success += 1;
    scannedIds.add(shortIdValue);
    addScannedItem({
      shortId: shortIdValue,
      name: updatedItem.itemDefinition?.name || '未命名物品',
      message: `状态：${getItemStatusText(originalStatus)} -> ${getItemStatusText(updatedItem.status)}`,
      status: 'success',
    });
    successSound.play().catch(() => {});
  } catch (error: any) {
    stats.failed += 1;
    addScannedItem({
      shortId: shortIdValue,
      name: '操作失败',
      message: error?.message || '未知错误',
      status: 'failed',
    });
    failSound.play().catch(() => {});
  } finally {
    currentShortId.value = '';
    isLoading.value = false;
    await focusInput();
  }
};

const clearResults = () => {
  scannedItems.value = [];
  scannedIds.clear();
  stats.success = 0;
  stats.failed = 0;
  stats.duplicate = 0;
  message.info('结果已清空');
  focusInput();
};
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.check-shell {
  overflow: visible;
}

.check-controls {
  position: relative;
}

.item-name {
  font-weight: 600;
}

.item-short-id {
  margin-left: 8px;
  color: #667085;
}

.status-success {
  background: #f6ffed;
}

.status-failed {
  background: #fff1f0;
}

.status-duplicate {
  background: #fffbe6;
}

.success-text {
  color: #15803d;
}

.failed-text {
  color: #dc2626;
}

.duplicate-text {
  color: #d97706;
}

.check-empty {
  margin-top: 24px;
}

@media (max-width: 767.98px) {
  .page-container {
    padding: 0;
  }

  .mobile-sticky-controls {
    position: sticky;
    top: 56px;
    z-index: 10;
    background: #fff;
    padding-bottom: 8px;
  }

  .check-empty {
    margin-top: 12px;
  }
}
</style>
