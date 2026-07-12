<template>
  <div class="item-availability-page">
    <a-page-header
      :title="`设备空闲日历 ${calendar?.item.shortId || ''}`"
      :sub-title="calendar?.item.itemDefinitionName || ''"
      @back="$router.back()"
    />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="calendar-toolbar">
        <div class="calendar-navigation">
          <div class="calendar-nav-buttons">
            <a-button :size="isMobile ? 'large' : 'middle'" @click="moveMonth(-1)">上月</a-button>
            <a-button :size="isMobile ? 'large' : 'middle'" @click="goToday">今天</a-button>
            <a-button :size="isMobile ? 'large' : 'middle'" @click="moveMonth(1)">下月</a-button>
          </div>
          <span class="month-title">{{ visibleMonth.format('YYYY年MM月') }}</span>
        </div>
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
            @click="selectDate(day)"
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
                :class="{ returning: busy.occupancyStatus === 'Returning', renewal: busy.occupancyStatus === 'RenewalIntent', manual: busy.isManualLoan }"
                @click.stop="!busy.isManualLoan && $router.push(`/rentals/${busy.rentalId}`)"
              >
                {{ busy.isManualLoan ? '普通借出' : busy.occupancyStatus === 'Returning' ? '未回货' : busy.occupancyStatus === 'RenewalIntent' ? '续租意愿' : busy.rentalNumber }}
              </span>
            </template>
          </button>
        </div>
      </a-spin>

      <a-divider>{{ selectedDate.format('YYYY-MM-DD') }}</a-divider>
      <a-list size="small" :data-source="selectedBusy" :locale="{ emptyText: '当天设备空闲' }">
        <template #renderItem="{ item }">
          <a-list-item
            class="busy-list-item"
            :class="{ 'is-link': !item.isManualLoan }"
            @click="!item.isManualLoan && $router.push(`/rentals/${item.rentalId}`)"
          >
            <a-list-item-meta>
              <template #title>
                <a-space wrap>
                    <a-tag v-if="item.isManualLoan" color="orange">普通借出</a-tag>
                    <a-tag v-if="item.occupancyStatus === 'Returning'" color="red">未回货</a-tag>
                    <a-tag v-if="item.occupancyStatus === 'RenewalIntent'" color="blue">续租意愿</a-tag>
                    <a-tag v-if="!item.isManualLoan" :color="item.isOpen ? 'orange' : 'default'">
                      {{ rentalStatusText(item.rentalStatus) }}
                    </a-tag>
                    <router-link v-if="!item.isManualLoan" :to="`/rentals/${item.rentalId}`">{{ item.rentalNumber }}</router-link>
                    <span v-else>{{ item.rentalNumber }}</span>
                </a-space>
              </template>
              <template #description>
                {{ formatDate(item.startAt) }} ~ {{ formatDate(item.endAt) }}
                <span v-if="item.hasRenewalIntent && item.renewalIntentEndDate">
                  | 续租意愿至 {{ formatDate(item.renewalIntentEndDate) }}
                </span>
                <span v-if="item.isManualLoan && item.expectedReturnDate"> | 预计回库 {{ formatDate(item.expectedReturnDate) }}</span>
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
import { useRoute, useRouter } from 'vue-router';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useItemAvailabilityStore, type ItemBusyPeriod } from '../stores/itemAvailabilityStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { getStatusText as getItemStatusText } from '../stores/itemStore';
import { rentalStatusText } from '../utils/rentalDisplay';
import { readQueryDay, readQueryMonth } from '../utils/routeQuery';
import RenterLink from '../components/RenterLink.vue';

const route = useRoute();
const router = useRouter();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const availabilityStore = useItemAvailabilityStore();
const initialSelectedDate = readQueryDay(route.query.date, dayjs());
const visibleMonth = ref(readQueryMonth(route.query.month, initialSelectedDate));
const selectedDate = ref(initialSelectedDate);
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

const syncCalendarQuery = async () => {
  await router.replace({
    query: {
      ...route.query,
      month: visibleMonth.value.format('YYYY-MM'),
      date: selectedDate.value.format('YYYY-MM-DD'),
    },
  });
};

const selectDate = async (day: Dayjs) => {
  selectedDate.value = day;
  await syncCalendarQuery();
};

const moveMonth = async (step: number) => {
  visibleMonth.value = visibleMonth.value.add(step, 'month');
  selectedDate.value = visibleMonth.value.startOf('month');
  await syncCalendarQuery();
  await loadCalendar();
};

const goToday = async () => {
  visibleMonth.value = dayjs().startOf('month');
  selectedDate.value = dayjs();
  await syncCalendarQuery();
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

.calendar-navigation,
.calendar-nav-buttons {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.busy-pill.returning {
  color: #b91c1c;
  background: #fee2e2;
}

.busy-pill.renewal {
  color: #1d4ed8;
  background: #dbeafe;
}

.busy-pill.manual {
  color: #1d4ed8;
  background: #eff6ff;
}

.busy-list-item {
  cursor: default;
}

.busy-list-item.is-link {
  cursor: pointer;
}

@media (max-width: 767.98px) {
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .calendar-navigation {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-nav-buttons {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }

  .calendar-nav-buttons :deep(.ant-btn) {
    width: 100%;
  }

  .month-title {
    text-align: center;
  }

  .day-cell {
    min-height: 76px;
    padding: 4px;
  }

  .free-pill,
  .busy-pill {
    padding: 0 3px;
    font-size: 10px;
  }
}
</style>
