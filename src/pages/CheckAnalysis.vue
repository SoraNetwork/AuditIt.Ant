<template>
  <div>
    <a-page-header
      title="盘点分析"
      sub-title="查看已盘点与未盘点物品，快速标记异常库存。"
    />
    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-form
          :layout="isMobile ? 'vertical' : 'inline'"
          :model="filterState"
          class="analysis-form"
          @finish="runAnalysis"
        >
          <a-form-item label="选择库房">
            <a-select
              v-model:value="filterState.warehouseId"
              show-search
              option-filter-prop="label"
              placeholder="请选择库房"
              :style="isMobile ? { width: '100%' } : { width: '200px' }"
              allow-clear
            >
              <a-select-option
                v-for="wh in warehouseStore.warehouses"
                :key="wh.id"
                :value="wh.id"
                :label="wh.name"
              >
                {{ wh.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="物品分类">
            <a-select
              v-model:value="filterState.categoryId"
              show-search
              option-filter-prop="label"
              placeholder="所有分类"
              :style="isMobile ? { width: '100%' } : { width: '200px' }"
              allow-clear
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
          </a-form-item>
          <a-form-item label="盘点时间范围">
            <a-range-picker
              v-model:value="filterState.dateRange"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              :placeholder="['开始时间', '结束时间']"
              :style="isMobile ? { width: '100%' } : {}"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :block="isMobile" :loading="isLoading">
              开始分析
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <template v-if="analysisRan">
        <div v-if="isMobile" class="mobile-summary-grid analysis-summary">
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">总数</div>
            <div class="mobile-summary-value">{{ totalCount }}</div>
          </div>
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">已盘点</div>
            <div class="mobile-summary-value checked-text">{{ checkedItems.length }}</div>
          </div>
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">未盘点</div>
            <div class="mobile-summary-value unchecked-text">{{ unCheckedItems.length }}</div>
          </div>
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">已选待处理</div>
            <div class="mobile-summary-value">{{ selectedCount }}</div>
          </div>
        </div>

        <a-row v-if="!isMobile" :gutter="16" class="analysis-result-row">
          <a-col :span="12">
            <a-card title="已盘点物品">
              <a-list :data-source="checkedItems" :loading="isLoading" bordered>
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta :title="getItemName(item)" :description="item.shortId" />
                  </a-list-item>
                </template>
              </a-list>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card title="未盘点物品（疑似丢失）">
              <template #extra>
                <a-button
                  type="primary"
                  danger
                  :disabled="!hasSelection"
                  :loading="isMarking"
                  @click="markAsMissing"
                >
                  标记选中为疑似丢失
                </a-button>
              </template>
              <a-list :data-source="unCheckedItems" :loading="isLoading" bordered>
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-checkbox :checked="!!selectedItemIds[item.id]" @change="toggleSelected(item.id)">
                      {{ getItemName(item) }} ({{ item.shortId }})
                    </a-checkbox>
                  </a-list-item>
                </template>
              </a-list>
            </a-card>
          </a-col>
        </a-row>

        <a-tabs v-else class="analysis-mobile-tabs">
          <a-tab-pane key="checked" :tab="`已盘点 (${checkedItems.length})`">
            <div v-if="checkedItems.length > 0" class="mobile-card-list">
              <MobileListCard v-for="item in checkedItems" :key="item.id">
                <template #title>{{ getItemName(item) }}</template>
                <template #tags>
                  <a-tag color="green">已盘点</a-tag>
                </template>
                <template #subtitle>{{ item.shortId }}</template>
                <template #meta>
                  <div v-if="item.warehouseName">库房：{{ item.warehouseName }}</div>
                  <div>最后更新：{{ formatDateTime(item.lastUpdated) || '-' }}</div>
                </template>
              </MobileListCard>
            </div>
            <a-empty v-else description="暂无已盘点物品" />
          </a-tab-pane>
          <a-tab-pane key="unchecked" :tab="`未盘点 (${unCheckedItems.length})`">
            <div v-if="unCheckedItems.length > 0" class="mobile-selection-toolbar">
              <div class="meta">
                <div class="title">待处理 {{ unCheckedItems.length }} 件</div>
                <div class="desc">
                  {{
                    hasSelection
                      ? `已选中 ${selectedCount} 件，可直接在底部执行异常标记。`
                      : '点击卡片或复选框，选中需要标记为疑似丢失的物品。'
                  }}
                </div>
              </div>
              <div class="actions">
                <a-button v-if="hasSelection" @click="clearSelection">清空选择</a-button>
              </div>
            </div>

            <div v-if="unCheckedItems.length > 0" class="mobile-card-list">
              <MobileListCard
                v-for="item in unCheckedItems"
                :key="item.id"
                clickable
                :active="!!selectedItemIds[item.id]"
                @click="toggleSelected(item.id)"
              >
                <template #title>
                  <a-checkbox
                    :checked="!!selectedItemIds[item.id]"
                    style="margin-right: 8px"
                    @click.stop="toggleSelected(item.id)"
                  />
                  {{ getItemName(item) }}
                </template>
                <template #tags>
                  <a-tag color="orange">未盘点</a-tag>
                </template>
                <template #subtitle>{{ item.shortId }}</template>
                <template #meta>
                  <div v-if="item.warehouseName">库房：{{ item.warehouseName }}</div>
                  <div>最后更新：{{ formatDateTime(item.lastUpdated) || '-' }}</div>
                </template>
              </MobileListCard>
            </div>
            <a-empty v-else description="暂无待处理物品" />
          </a-tab-pane>
        </a-tabs>

        <template v-if="isMobile && hasSelection">
          <div class="mobile-action-bar">
            <a-button type="primary" danger :loading="isMarking" @click="markAsMissing">
              标记疑似丢失 ({{ selectedCount }})
            </a-button>
          </div>
          <div class="mobile-selection-spacer" />
        </template>
      </template>

      <a-empty
        v-else
        class="analysis-empty"
        description="选择库房和时间范围后开始分析"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import { useItemStore, type Item } from '../stores/itemStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useCategoryStore } from '../stores/categoryStore';
import { formatDateTime } from '../utils/formatters';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const warehouseStore = useWarehouseStore();
const categoryStore = useCategoryStore();
const itemStore = useItemStore();

const filterState = reactive<{
  warehouseId: number | undefined;
  categoryId: number | undefined;
  dateRange: [Dayjs, Dayjs];
}>({
  warehouseId: undefined,
  categoryId: undefined,
  dateRange: [dayjs().subtract(1, 'day'), dayjs()],
});

const isLoading = ref(false);
const isMarking = ref(false);
const analysisRan = ref(false);
const checkedItems = ref<Item[]>([]);
const unCheckedItems = ref<Item[]>([]);
const selectedItemIds = ref<Record<string, boolean>>({});

const totalCount = computed(() => checkedItems.value.length + unCheckedItems.value.length);
const selectedCount = computed(() =>
  Object.values(selectedItemIds.value).filter(Boolean).length
);
const hasSelection = computed(() => selectedCount.value > 0);

const getItemName = (item: Item) =>
  item.itemDefinition?.name || item.itemDefinitionName || item.name || '未命名物品';

const clearSelection = () => {
  selectedItemIds.value = {};
};

const toggleSelected = (id: string) => {
  selectedItemIds.value = {
    ...selectedItemIds.value,
    [id]: !selectedItemIds.value[id],
  };
};

onMounted(() => {
  warehouseStore.fetchWarehouses();
  categoryStore.fetchCategories();
});

watch(
  () => [filterState.warehouseId, filterState.categoryId],
  () => {
    analysisRan.value = false;
    checkedItems.value = [];
    unCheckedItems.value = [];
    clearSelection();
  }
);

const runAnalysis = async () => {
  if (!filterState.warehouseId) {
    message.error('请先选择一个库房');
    return;
  }

  if (!filterState.dateRange || filterState.dateRange.length !== 2) {
    message.error('请选择完整的时间范围');
    return;
  }

  isLoading.value = true;
  checkedItems.value = [];
  unCheckedItems.value = [];
  clearSelection();

  try {
    const result = await itemStore.fetchCheckAnalysis({
      warehouseId: filterState.warehouseId,
      categoryId: filterState.categoryId,
      startAt: filterState.dateRange[0].toISOString(),
      endAt: filterState.dateRange[1].toISOString(),
    });
    checkedItems.value = result.checkedItems;
    unCheckedItems.value = result.uncheckedItems;
    analysisRan.value = true;
  } catch (error: any) {
    message.error('分析失败: ' + (error.message || error));
  } finally {
    isLoading.value = false;
  }
};

const markAsMissing = async () => {
  const idsToMark = Object.entries(selectedItemIds.value)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id);

  if (idsToMark.length === 0) {
    message.warn('请至少选择一个物品');
    return;
  }

  isMarking.value = true;
  try {
    await itemStore.updateStatusBatch(idsToMark, 'SuspectedMissing');
    message.success('已标记为疑似丢失');
    await runAnalysis();
  } catch (error: any) {
    message.error('标记失败: ' + (error.message || error));
  } finally {
    isMarking.value = false;
  }
};
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.analysis-result-row,
.analysis-summary {
  margin-top: 16px;
}

.checked-text {
  color: #15803d;
}

.unchecked-text {
  color: #d97706;
}

.analysis-empty {
  margin-top: 24px;
}

@media (max-width: 767.98px) {
  .page-container {
    padding: 0;
  }

  .analysis-summary {
    margin-top: 12px;
  }

  .analysis-empty {
    margin-top: 12px;
  }
}
</style>
