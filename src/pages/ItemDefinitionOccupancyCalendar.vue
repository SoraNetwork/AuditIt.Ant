<template>
  <div class="definition-calendar-page">
    <a-page-header
      title="物品定义占用日历"
      sub-title="展示对应时间段剩余库存，支持手动选择定义"
    />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }" class="calendar-card">
      <div class="calendar-header-toolbar">
        <a-space :direction="isMobile ? 'vertical' : 'horizontal'" wrap class="filter-controls">
          <div class="filter-field">
            <span class="toolbar-label">物品分类：</span>
            <a-select
              v-model:value="selectedCategoryId"
              allow-clear
              show-search
              option-filter-prop="label"
              :options="categoryOptions"
              :loading="categoryStore.loading"
              placeholder="先筛选分类"
              :size="isMobile ? 'large' : 'middle'"
              class="category-select"
              @change="onCategoryChange"
            />
          </div>
          <div class="filter-field">
            <span class="toolbar-label">物品定义：</span>
            <a-select
              v-model:value="selectedDefinitionId"
              show-search
              option-filter-prop="label"
              :options="definitionOptions"
              :loading="itemDefStore.loading"
              placeholder="请选择物品定义"
              :size="isMobile ? 'large' : 'middle'"
              class="definition-select"
              @change="onDefinitionChange"
            />
          </div>
        </a-space>

        <a-space :direction="isMobile ? 'vertical' : 'horizontal'" wrap class="navigation-controls" v-if="selectedDefinitionId">
          <div class="nav-buttons">
            <a-button :size="isMobile ? 'large' : 'middle'" @click="moveMonth(-1)">上月</a-button>
            <a-button :size="isMobile ? 'large' : 'middle'" @click="goToday">今天</a-button>
            <a-button :size="isMobile ? 'large' : 'middle'" @click="moveMonth(1)">下月</a-button>
          </div>
          <span class="month-title">{{ visibleMonth.format('YYYY年MM月') }}</span>
        </a-space>
      </div>

      <div v-if="!selectedDefinitionId" class="select-prompt">
        <a-empty description="请选择上方物品定义以查看占用日历" />
      </div>

      <a-spin v-else :spinning="loading">
        <div class="calendar-wrapper">
          <div class="calendar-grid">
            <div v-for="dayName in weekNames" :key="dayName" class="weekday">{{ dayName }}</div>
            <button
              v-for="day in calendarDays"
              :key="day.format('YYYY-MM-DD')"
              type="button"
              class="day-cell"
                :class="{
                  muted: day.month() !== visibleMonth.month(),
                  active: day.isSame(selectedDate, 'day'),
                  alert: isStockShort(day),
                  warning: isStockWarning(day)
                }"
              @click="selectedDate = day"
            >
              <div class="day-header">
                <span class="day-number">{{ day.date() }}</span>
                <span class="day-markers">
                  <span v-if="isStockShort(day)" class="stock-shortage" title="库存不足">缺</span>
                  <span v-else-if="isStockWarning(day)" class="stock-warning" title="仅剩一件">紧</span>
                  <span v-if="day.isSame(dayjs(), 'day')" class="today-tag">今</span>
                </span>
              </div>
              
              <div class="day-content">
                <template v-if="hasStockData(day)">
                  <div class="stock-info">
                    <span class="stock-remaining">余: {{ remainingStockForDate(day) }}</span>
                    <span class="stock-total">/{{ totalStock }}</span>
                  </div>
                  <div class="occupy-count" v-if="occupiedCountForDate(day) > 0">
                    已占: {{ occupiedCountForDate(day) }}
                  </div>
                </template>
                <template v-else-if="selectedDefinitionId">
                  <span class="no-data">-</span>
                </template>
              </div>
            </button>
          </div>
        </div>

        <a-divider class="detail-divider">
          {{ selectedDate.format('YYYY-MM-DD') }} 占用明细 (余: {{ remainingStockForDate(selectedDate) }} / 共: {{ totalStock }})
        </a-divider>

        <a-list
          size="small"
          :data-source="selectedDailyOccupancies"
          :locale="{ emptyText: '当天该定义无租赁占用，库存充裕' }"
          class="occupancy-list"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="occupancy-list-item"
              :class="{ 'is-link': !item.isManualLoan }"
              @click="!item.isManualLoan && $router.push(`/rentals/${item.rentalId}`)"
            >
              <a-list-item-meta>
                <template #title>
                  <a-space wrap>
                    <a-tag v-if="item.isManualLoan" color="orange">普通借出</a-tag>
                    <a-tag v-else :color="item.isUncertain ? 'orange' : 'blue'">
                      {{ item.isUncertain ? '待发货不确定商品' : '具体库存分配' }}
                    </a-tag>
                    <a-tag v-if="item.occupancyStatus === 'Returning'" color="red">未回货</a-tag>
                    <a-tag v-if="item.occupancyStatus === 'RenewalIntent'" color="blue">续租意愿</a-tag>
                    <a-tag v-if="!item.isManualLoan" color="cyan">{{ rentalStatusText(item.rentalStatus) }}</a-tag>
                    <router-link v-if="!item.isManualLoan" :to="`/rentals/${item.rentalId}`" class="rental-link">
                      {{ item.rentalNumber }}
                    </router-link>
                    <span v-else class="manual-loan-reference">{{ item.rentalNumber }}</span>
                  </a-space>
                </template>
                <template #description>
                  <div class="occupancy-desc">
                    <span v-if="item.renterName" class="renter-name">租客: <RenterLink :renter-id="item.renterId" :name="item.renterName" /></span>
                    <span class="occupy-qty">占用数量: <strong style="color: #1f2937;">{{ item.quantity }}</strong> 件</span>
                    <span v-if="item.hasRenewalIntent && item.renewalIntentEndDate" class="occupy-qty">
                      续租意愿至: <strong style="color: #1d4ed8;">{{ dayjs(item.renewalIntentEndDate).format('YYYY-MM-DD') }}</strong>
                    </span>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useCategoryStore } from '../stores/categoryStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { useItemAvailabilityStore, type ItemDefinitionDailyStock } from '../stores/itemAvailabilityStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { rentalStatusText } from '../utils/rentalDisplay';
import RenterLink from '../components/RenterLink.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const categoryStore = useCategoryStore();
const itemDefStore = useItemDefinitionStore();
const availabilityStore = useItemAvailabilityStore();

const selectedCategoryId = ref<number | undefined>();
const selectedDefinitionId = ref<number | undefined>();
const visibleMonth = ref(dayjs().startOf('month'));
const selectedDate = ref(dayjs());
const loading = ref(false);
const calendarData = ref<Record<string, ItemDefinitionDailyStock>>({});
const totalStock = ref(0);

const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

const categoryOptions = computed(() =>
  categoryStore.categories.map(category => ({
    value: category.id,
    label: category.name,
  }))
);

const filteredDefinitions = computed(() => {
  if (!selectedCategoryId.value) {
    return itemDefStore.itemDefinitions;
  }

  return itemDefStore.itemDefinitions.filter(def => def.categoryId === selectedCategoryId.value);
});

const definitionOptions = computed(() =>
  filteredDefinitions.value.map(def => ({
    value: def.id,
    label: `${def.name} (ID: ${def.id})`,
  }))
);

const calendarDays = computed(() => {
  const start = visibleMonth.value.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
});

const rangeStart = computed(() => calendarDays.value[0].format('YYYY-MM-DD'));
const rangeEnd = computed(() => calendarDays.value[calendarDays.value.length - 1].format('YYYY-MM-DD'));

const loadOccupancy = async () => {
  if (!selectedDefinitionId.value) return;

  loading.value = true;
  try {
    const data = await availabilityStore.fetchDefinitionOccupancy(
      selectedDefinitionId.value,
      rangeStart.value,
      rangeEnd.value
    );
    totalStock.value = data.totalStock;
    
    // Map list to daily lookup
    const lookup: Record<string, ItemDefinitionDailyStock> = {};
    data.dailyStocks.forEach(stock => {
      const key = dayjs(stock.date).format('YYYY-MM-DD');
      lookup[key] = stock;
    });
    calendarData.value = lookup;
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '获取占用日历数据失败');
  } finally {
    loading.value = false;
  }
};

const onDefinitionChange = async () => {
  const today = dayjs();
  visibleMonth.value = today.startOf('month');
  selectedDate.value = today;
  await loadOccupancy();
};

const onCategoryChange = () => {
  const selectedDefinitionStillVisible =
    selectedDefinitionId.value
    && filteredDefinitions.value.some(def => def.id === selectedDefinitionId.value);

  if (selectedDefinitionStillVisible) {
    return;
  }

  selectedDefinitionId.value = undefined;
  calendarData.value = {};
  totalStock.value = 0;
};

const moveMonth = async (step: number) => {
  visibleMonth.value = visibleMonth.value.add(step, 'month');
  selectedDate.value = visibleMonth.value.startOf('month');
  await loadOccupancy();
};

const goToday = async () => {
  visibleMonth.value = dayjs().startOf('month');
  selectedDate.value = dayjs();
  await loadOccupancy();
};

const getStockForDate = (day: Dayjs): ItemDefinitionDailyStock | undefined => {
  return calendarData.value[day.format('YYYY-MM-DD')];
};

const hasStockData = (day: Dayjs): boolean => {
  return !!getStockForDate(day);
};

const remainingStockForDate = (day: Dayjs): number => {
  const stock = getStockForDate(day);
  return stock ? stock.remainingStock : totalStock.value;
};

const isStockShort = (day: Dayjs): boolean => remainingStockForDate(day) < 1;

const isStockWarning = (day: Dayjs): boolean => {
  const remainingStock = remainingStockForDate(day);
  return remainingStock > 0
    && ((totalStock.value > 1 && remainingStock === 1) || remainingStock <= totalStock.value * 0.3);
};

const occupiedCountForDate = (day: Dayjs): number => {
  const stock = getStockForDate(day);
  return stock ? stock.occupiedCount : 0;
};

const selectedDailyOccupancies = computed(() => {
  const stock = getStockForDate(selectedDate.value);
  return stock ? stock.details : [];
});

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    itemDefStore.fetchItemDefinitions(),
  ]);
});
</script>

<style scoped>
.definition-calendar-page {
  min-width: 0;
}

.calendar-card {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  border: 1px solid #edf0f5;
  border-radius: 8px;
}

.calendar-header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.filter-controls {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
}

.filter-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-weight: 500;
  color: #475467;
  white-space: nowrap;
}

.category-select {
  width: 200px;
}

.definition-select {
  width: 280px;
}

.navigation-controls {
  display: flex;
  align-items: center;
}

.nav-buttons {
  display: inline-flex;
  gap: 8px;
}

.month-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
  margin-left: 8px;
}

.select-prompt {
  padding: 60px 0;
}

.calendar-wrapper {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.weekday {
  padding: 12px 6px;
  background: #f1f5f9;
  color: #475467;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
}

.day-cell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 96px;
  padding: 8px;
  border: 0;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-cell:hover {
  background: #f8fafc;
  transform: scale(1.01);
  box-shadow: inset 0 0 0 2px #cbd5e1;
  z-index: 10;
}

.day-cell.muted {
  background: #f8fafc;
  color: #94a3b8;
}

.day-cell.active {
  background: #eff6ff;
  box-shadow: inset 0 0 0 2px #3b82f6;
  z-index: 10;
}

.day-cell.warning {
  background: #fffbeb;
}

.day-cell.warning:hover {
  background: #fef3c7;
}

.day-cell.alert {
  background: #fef2f2;
}

.day-cell.alert:hover {
  background: #fee2e2;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.day-number {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.day-cell.muted .day-number {
  color: #94a3b8;
}

.today-tag {
  background: #3b82f6;
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.day-markers {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 3px;
}

.day-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-top: 8px;
}

.stock-info {
  font-size: 12px;
  font-weight: 600;
}

.day-cell.alert .stock-info {
  color: #ef4444;
}

.day-cell.warning .stock-info {
  color: #d97706;
}

.stock-remaining {
  font-weight: 700;
}

.stock-total {
  color: #64748b;
  font-size: 10px;
}

.occupy-count {
  font-size: 10px;
  color: #475467;
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
}

.day-cell.warning .occupy-count {
  background: #fef3c7;
  color: #b45309;
}

.day-cell.alert .occupy-count {
  background: #fee2e2;
  color: #b91c1c;
}

.stock-shortage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #dc2626;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.stock-warning {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.no-data {
  color: #94a3b8;
  font-size: 11px;
}

.detail-divider {
  margin-top: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #475467;
}

.occupancy-list {
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 8px;
}

.occupancy-list-item {
  padding: 12px 16px;
  transition: background 0.15s ease;
  cursor: default;
}

.occupancy-list-item.is-link {
  cursor: pointer;
}

.occupancy-list-item.is-link:hover {
  background: #f8fafc;
}

.rental-link {
  font-weight: 600;
  color: #3b82f6;
}

.manual-loan-reference {
  font-weight: 600;
  color: #475467;
}

.occupancy-desc {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.renter-name {
  color: #475467;
}

.occupy-qty {
  color: #64748b;
}

@media (max-width: 767.98px) {
  .calendar-header-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls,
  .navigation-controls {
    width: 100%;
  }

  .filter-field {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .category-select,
  .definition-select {
    width: 100%;
  }

  .nav-buttons {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .nav-buttons :deep(.ant-btn) {
    width: 100%;
  }

  .month-title {
    margin-left: 0;
    text-align: center;
  }

  .day-cell {
    min-height: 72px;
    padding: 4px;
  }

  .stock-info {
    font-size: 10px;
  }

  .occupy-count {
    display: none;
  }

  .occupancy-desc {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
