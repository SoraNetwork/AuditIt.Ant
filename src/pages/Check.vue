<template>
  <div>
    <a-page-header
      title="连续盘点"
      sub-title="扫描短 ID，或从分类候选清单中选择物品完成盘点。"
    />
    <div class="page-container">
      <a-card class="check-shell" :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-row :gutter="isMobile ? [0, 12] : 24">
          <a-col :xs="24" :span="8">
            <div :class="['check-controls', { 'mobile-sticky-controls': isMobile }]">
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
                <a-form-item label="分类候选范围" :style="isMobile ? { marginBottom: '10px' } : {}">
                  <a-select
                    v-model:value="candidateFilters.categoryId"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="请选择物品分类"
                    :style="{ width: '100%', marginBottom: '8px' }"
                    @change="handleCandidateScopeChange"
                  >
                    <a-select-option
                      v-for="category in categoryStore.categories"
                      :key="category.id"
                      :value="category.id"
                      :label="category.name"
                    >
                      {{ category.name }}
                    </a-select-option>
                  </a-select>
                  <a-select
                    v-model:value="candidateFilters.warehouseId"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                    placeholder="所有库房"
                    style="width: 100%"
                    @change="handleCandidateScopeChange"
                  >
                    <a-select-option
                      v-for="warehouse in warehouseStore.warehouses"
                      :key="warehouse.id"
                      :value="warehouse.id"
                      :label="warehouse.name"
                    >
                      {{ warehouse.name }}
                    </a-select-option>
                  </a-select>
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

            <div class="candidate-panel">
              <a-divider :style="isMobile ? { margin: '12px 0 8px' } : {}">
                分类候选（{{ candidateItems.length }}）
              </a-divider>
              <a-empty
                v-if="!candidateFilters.categoryId"
                description="选择物品分类后显示在库候选"
                :image-style="{ height: '48px' }"
              />
              <a-list
                v-else
                class="candidate-list"
                size="small"
                bordered
                :data-source="candidateItems"
                :loading="isCandidateLoading"
                :locale="{ emptyText: '该范围暂无在库候选' }"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>{{ getItemName(item) }}</template>
                      <template #description>
                        {{ item.shortId }} · {{ item.warehouseName || '未知库房' }}
                      </template>
                    </a-list-item-meta>
                    <template #actions>
                      <a-button
                        type="link"
                        size="small"
                        :disabled="isLoading || scannedItemIds.has(item.id)"
                        @click="handleCandidateCheck(item)"
                      >
                        {{ scannedItemIds.has(item.id) ? '已盘点' : '盘点' }}
                      </a-button>
                    </template>
                  </a-list-item>
                </template>
                <template #header>
                  <a-button type="link" size="small" :loading="isCandidateLoading" @click="loadCandidateItems">
                    刷新候选
                  </a-button>
                </template>
              </a-list>
            </div>
          </a-col>

          <a-col :xs="24" :span="16">
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
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import MobileScanInput from '../components/mobile/MobileScanInput.vue';
import { getStatusText as getItemStatusText, type Item, useItemStore } from '../stores/itemStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useWarehouseStore } from '../stores/warehouseStore';

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
const categoryStore = useCategoryStore();
const warehouseStore = useWarehouseStore();
const scanInputRef = ref();
const currentShortId = ref('');
const isLoading = ref(false);
const isCandidateLoading = ref(false);
const scannedItems = ref<ScannedItem[]>([]);
const scannedShortIds = new Set<string>();
const scannedItemIds = new Set<string>();
const lastProcessedId = ref<string | null>(null);
const lastProcessedTime = ref(0);
const candidateItems = ref<Item[]>([]);
const candidateFilters = reactive<{
  categoryId: number | undefined;
  warehouseId: number | undefined;
}>({
  categoryId: undefined,
  warehouseId: undefined,
});
let candidateLoadRequest = 0;

const stats = reactive({
  success: 0,
  failed: 0,
  duplicate: 0,
});

const hasResults = computed(() => scannedItems.value.length > 0);

const getItemName = (item: Item) =>
  item.itemDefinition?.name || item.itemDefinitionName || item.name || '未命名物品';

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

const addDuplicateResult = (shortId: string) => {
  stats.duplicate += 1;
  addScannedItem({
    shortId,
    name: '重复盘点',
    message: '该物品已在本次盘点中处理过。',
    status: 'duplicate',
  });
  failSound.play().catch(() => {});
};

const assertWithinCandidateScope = (item: Item) => {
  if (candidateFilters.categoryId && item.categoryId !== candidateFilters.categoryId) {
    throw new Error('当前盘点范围仅限所选物品分类。');
  }

  if (candidateFilters.warehouseId && item.warehouseId !== candidateFilters.warehouseId) {
    throw new Error('当前盘点范围仅限所选库房。');
  }
};

const updateCandidateItem = (updatedItem: Item) => {
  const index = candidateItems.value.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    candidateItems.value[index] = updatedItem;
  }
};

const checkResolvedItem = async (item: Item, shortId: string) => {
  const originalStatus = item.status;
  const updatedItem = await itemStore.updateItemStatus(item.id, 'check');
  const checkedItem = updatedItem || item;

  stats.success += 1;
  scannedShortIds.add(shortId);
  scannedItemIds.add(item.id);
  updateCandidateItem(checkedItem);
  addScannedItem({
    shortId,
    name: getItemName(checkedItem),
    message: `状态：${getItemStatusText(originalStatus)} -> ${getItemStatusText(checkedItem.status)}`,
    status: 'success',
  });
  successSound.play().catch(() => {});
};

const loadCandidateItems = async () => {
  const requestId = ++candidateLoadRequest;
  if (!candidateFilters.categoryId) {
    candidateItems.value = [];
    return;
  }

  isCandidateLoading.value = true;
  try {
    await itemStore.fetchItems({
      categoryId: candidateFilters.categoryId,
      warehouseId: candidateFilters.warehouseId,
      status: 'InStock',
    });
    if (itemStore.error) {
      throw new Error(itemStore.error);
    }
    if (requestId === candidateLoadRequest) {
      candidateItems.value = [...itemStore.items];
    }
  } catch (error: any) {
    if (requestId === candidateLoadRequest) {
      candidateItems.value = [];
      message.error('加载分类候选失败：' + (error?.message || error));
    }
  } finally {
    if (requestId === candidateLoadRequest) {
      isCandidateLoading.value = false;
    }
  }
};

const handleCandidateScopeChange = () => {
  candidateItems.value = [];
  if (!candidateFilters.categoryId) {
    candidateLoadRequest += 1;
    return;
  }
  void loadCandidateItems();
};

const handleCandidateCheck = async (item: Item) => {
  if (scannedItemIds.has(item.id)) {
    addDuplicateResult(item.shortId);
    await focusInput();
    return;
  }

  isLoading.value = true;
  try {
    assertWithinCandidateScope(item);
    await checkResolvedItem(item, item.shortId);
  } catch (error: any) {
    stats.failed += 1;
    addScannedItem({
      shortId: item.shortId,
      name: getItemName(item),
      message: error?.message || '未知错误',
      status: 'failed',
    });
    failSound.play().catch(() => {});
  } finally {
    isLoading.value = false;
    await focusInput();
  }
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

  if (scannedShortIds.has(shortIdValue)) {
    addDuplicateResult(shortIdValue);
    currentShortId.value = '';
    isLoading.value = false;
    await focusInput();
    return;
  }

  try {
    await itemStore.fetchItems({ shortId: shortIdValue });
    if (itemStore.error) {
      throw new Error(itemStore.error);
    }
    const item = itemStore.items.find(i => i.shortId === shortIdValue);

    if (!item) {
      throw new Error('物品未在系统中找到。');
    }

    if (scannedItemIds.has(item.id)) {
      addDuplicateResult(shortIdValue);
      return;
    }

    assertWithinCandidateScope(item);
    await checkResolvedItem(item, shortIdValue);
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

onMounted(() => {
  categoryStore.fetchCategories();
  warehouseStore.fetchWarehouses();
});

const clearResults = () => {
  scannedItems.value = [];
  scannedShortIds.clear();
  scannedItemIds.clear();
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

.candidate-panel {
  margin-top: 8px;
}

.candidate-list {
  max-height: 420px;
  overflow-y: auto;
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
