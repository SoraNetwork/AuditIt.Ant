<template>
  <div class="item-availability-page">
    <a-page-header
      :title="`设备空闲日历 ${calendar?.item.shortId || ''}`"
      :sub-title="calendar?.item.itemDefinitionName || ''"
      @back="$router.back()"
    />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="calendar-toolbar">
        <a-space wrap>
          <a-button @click="moveMonth(-1)">上月</a-button>
          <a-button @click="goToday">今天</a-button>
          <a-button @click="moveMonth(1)">下月</a-button>
          <span class="month-title">{{ visibleMonth.format('YYYY年MM月') }}</span>
        </a-space>
        <a-tag v-if="calendar?.item.status" :color="calendar.item.status === 'InStock' ? 'green' : 'blue'">
          {{ getItemStatusText(calendar.item.status) }}
        </a-tag>
      </div>

      <a-spin :spinning="availabilityStore.loading">
        <div class="availability-grid">
          <div v-for="dayName in weekNames" :key="dayName" class="weekday">{{ dayName }}</div>
          <button
            v-for="day in calendarDays"
            :key="day.format('YYYY-MM-DD')"
            type="button"
            class="day-cell"
            :class="{ muted: day.month() !== visibleMonth.month(), busy: busyForDate(day).length > 0 }"
            @click="selectedDate = day"
          >
            <span class="day-number">{{ day.date() }}</span>
            <template v-if="busyForDate(day).length === 0">
              <span class="free-pill">空闲</span>
            </template>
            <template v-else>
              <span
                v-for="busy in busyForDate(day).slice(0, 2)"
                :key="`${day.format('YYYY-MM-DD')}-${busy.rentalId}`"
                class="busy-pill"
                @click.stop="$router.push(`/rentals/${busy.rentalId}`)"
              >
                {{ busy.rentalNumber }}
              </span>
            </template>
          </button>
        </div>
      </a-spin>

      <a-divider>{{ selectedDate.format('YYYY-MM-DD') }}</a-divider>
      <a-list size="small" :data-source="selectedBusy" :locale="{ emptyText: '当天设备空闲' }">
        <template #renderItem="{ item }">
          <a-list-item class="busy-list-item" @click="$router.push(`/rentals/${item.rentalId}`)">
            <a-list-item-meta>
              <template #title>
                <a-space wrap>
                  <a-tag :color="item.isOpen ? 'orange' : 'default'">{{ rentalStatusText(item.rentalStatus) }}</a-tag>
                  <router-link :to="`/rentals/${item.rentalId}`">{{ item.rentalNumber }}</router-link>
                </a-space>
              </template>
              <template #description>
                {{ formatDate(item.startAt) }} ~ {{ formatDate(item.endAt) }}
                <span v-if="item.renterName"> | <RenterLink :renter-id="item.renterId" :name="item.renterName" /></span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useItemAvailabilityStore, type ItemBusyPeriod } from '../stores/itemAvailabilityStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { getStatusText as getItemStatusText } from '../stores/itemStore';
import { rentalStatusText } from '../utils/rentalDisplay';
import RenterLink from '../components/RenterLink.vue';

const route = useRoute();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const availabilityStore = useItemAvailabilityStore();
const visibleMonth = ref(dayjs().startOf('month'));
const selectedDate = ref(dayjs());
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

const calendar = computed(() => availabilityStore.calendar);
const calendarDays = computed(() => {
  const start = visibleMonth.value.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
});

const rangeStart = computed(() => calendarDays.value[0].format('YYYY-MM-DD'));
const rangeEnd = computed(() => calendarDays.value[calendarDays.value.length - 1].format('YYYY-MM-DD'));

const loadCalendar = async () => {
  try {
    await availabilityStore.fetchAvailability(String(route.params.id), rangeStart.value, rangeEnd.value);
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '获取设备空闲日历失败');
  }
};

const moveMonth = async (step: number) => {
  visibleMonth.value = visibleMonth.value.add(step, 'month');
  selectedDate.value = visibleMonth.value.startOf('month');
  await loadCalendar();
};

const goToday = async () => {
  visibleMonth.value = dayjs().startOf('month');
  selectedDate.value = dayjs();
  await loadCalendar();
};

const intersectsDay = (period: ItemBusyPeriod, day: Dayjs) =>
  !dayjs(period.startAt).isAfter(day.endOf('day')) && !dayjs(period.endAt).isBefore(day.startOf('day'));

const busyForDate = (day: Dayjs) =>
  (calendar.value?.busyPeriods || []).filter(period => intersectsDay(period, day));

const selectedBusy = computed(() => busyForDate(selectedDate.value));
const formatDate = (value?: string | null) => value ? dayjs(value).format('YYYY-MM-DD') : '';

onMounted(loadCalendar);
</script>

<style scoped>
.item-availability-page {
  min-width: 0;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.month-title {
  font-weight: 600;
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-radius: 8px;
}

.weekday {
  padding: 8px;
  background: #fafafa;
  color: #667085;
  font-size: 12px;
  text-align: center;
}

.day-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 92px;
  padding: 6px;
  border: 0;
  border-top: 1px solid #edf0f5;
  border-right: 1px solid #edf0f5;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.day-cell:nth-child(7n) {
  border-right: 0;
}

.day-cell.muted {
  background: #fbfbfb;
  color: #a8b0ba;
}

.day-cell.busy {
  background: #fff7e6;
}

.day-number {
  font-size: 12px;
  font-weight: 600;
}

.free-pill,
.busy-pill {
  overflow: hidden;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.free-pill {
  color: #237804;
  background: #f6ffed;
}

.busy-pill {
  color: #ad6800;
  background: #fff1d6;
}

.busy-list-item {
  cursor: pointer;
}

@media (max-width: 767.98px) {
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .day-cell {
    min-height: 68px;
    padding: 4px;
  }

  .free-pill,
  .busy-pill {
    padding: 0 3px;
    font-size: 10px;
  }
}
</style>
