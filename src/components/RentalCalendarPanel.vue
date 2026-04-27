<template>
  <div class="rental-calendar-panel">
    <div class="calendar-toolbar">
      <a-space wrap>
        <a-button size="small" @click="moveMonth(-1)">上月</a-button>
        <a-button size="small" @click="goToday">今天</a-button>
        <a-button size="small" @click="moveMonth(1)">下月</a-button>
        <span class="calendar-title">{{ visibleMonth.format('YYYY年MM月') }}</span>
      </a-space>
      <a-space wrap>
        <a-select
          v-if="canPickUser"
          v-model:value="targetUser"
          size="small"
          class="target-select"
          :options="targetOptions"
          @change="loadEvents"
        />
        <router-link v-if="compact" :to="{ path: '/calendar', query: { month: visibleMonth.format('YYYY-MM'), user: targetUser } }">
          详情
        </router-link>
      </a-space>
    </div>

    <a-spin :spinning="calendarStore.loading">
      <div class="calendar-grid">
        <div v-for="dayName in weekNames" :key="dayName" class="calendar-weekday">{{ dayName }}</div>
        <button
          v-for="day in calendarDays"
          :key="day.format('YYYY-MM-DD')"
          type="button"
          class="calendar-day"
          :class="{
            'is-muted': day.month() !== visibleMonth.month(),
            'is-today': day.isSame(today, 'day'),
            'is-selected': day.isSame(selectedDate, 'day'),
            'has-critical': hasLevel(day, 'Critical'),
            'has-warning': hasLevel(day, 'Warning'),
          }"
          @click="selectDate(day)"
        >
          <span class="day-number">{{ day.date() }}</span>
          <span class="day-events">
            <span
              v-for="event in eventsForDate(day).slice(0, compact ? 2 : 4)"
              :key="`${day.format('YYYY-MM-DD')}-${event.id}`"
              class="event-pill"
              :class="eventClass(event)"
              @click.stop="openEvent(event)"
            >
              {{ eventTitle(event) }}
            </span>
            <span v-if="eventsForDate(day).length > (compact ? 2 : 4)" class="event-more">
              +{{ eventsForDate(day).length - (compact ? 2 : 4) }}
            </span>
          </span>
        </button>
      </div>
    </a-spin>

    <div v-if="!compact" class="calendar-detail">
      <div class="detail-heading">{{ selectedDate.format('YYYY-MM-DD') }}</div>
      <a-list size="small" :data-source="selectedEvents" :locale="{ emptyText: '当天没有日程' }">
        <template #renderItem="{ item }">
          <a-list-item class="detail-event" @click="openEvent(item)">
            <a-list-item-meta>
              <template #title>
                <a-space wrap>
                  <a-tag :color="tagColor(item)">{{ kindText(item.kind) }}</a-tag>
                  <span>{{ item.title }}</span>
                </a-space>
              </template>
              <template #description>
                <span>{{ formatEventRange(item) }}</span>
                <span v-if="item.renterName"> | {{ item.renterName }}</span>
                <span v-if="item.description"> | {{ item.description }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs, { type Dayjs } from 'dayjs';
import type { SelectProps } from 'ant-design-vue';
import { PermissionCodes } from '../utils/permissions';
import { useAuthStore } from '../stores/authStore';
import { useCalendarStore, type RentalCalendarEvent } from '../stores/calendarStore';
import { useUserStore } from '../stores/userStore';
import { formatDateTime } from '../utils/formatters';

const props = defineProps<{
  compact?: boolean;
  initialMonth?: string;
  initialDate?: string;
  initialUser?: string;
}>();

const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
const today = dayjs();
const visibleMonth = ref(props.initialMonth ? dayjs(`${props.initialMonth}-01`) : today.startOf('month'));
const selectedDate = ref(props.initialDate ? dayjs(props.initialDate) : today);
const authStore = useAuthStore();
const calendarStore = useCalendarStore();
const userStore = useUserStore();
const router = useRouter();
const canPickUser = computed(() => authStore.hasPermission(PermissionCodes.ReminderDismissAny));
const canLoadUsers = computed(() => authStore.hasPermission(PermissionCodes.UserView));
const targetUser = ref(props.initialUser || authStore.user?.name || '');

const targetOptions = computed<SelectProps['options']>(() => {
  const options: { value: string; label: string }[] = [];
  if (authStore.user?.name) {
    options.push({ value: authStore.user.name, label: '我的日历' });
  }

  if (canPickUser.value) {
    options.push({ value: 'all', label: '全部员工' });
    if (canLoadUsers.value) {
      for (const user of userStore.users) {
        if (user.status === 'Active' && user.name && !options.some(option => option.value === user.name)) {
          options.push({ value: user.name, label: user.name });
        }
      }
    }
  }

  return options.filter(option => option.value);
});

const calendarDays = computed(() => {
  const start = visibleMonth.value.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, index) => start.add(index, 'day'));
});

const rangeStart = computed(() => calendarDays.value[0].format('YYYY-MM-DD'));
const rangeEnd = computed(() => calendarDays.value[calendarDays.value.length - 1].format('YYYY-MM-DD'));

const loadEvents = async () => {
  await calendarStore.fetchCalendar(rangeStart.value, rangeEnd.value, targetUser.value);
};

const moveMonth = async (step: number) => {
  visibleMonth.value = visibleMonth.value.add(step, 'month');
  selectedDate.value = visibleMonth.value.startOf('month');
  await loadEvents();
};

const goToday = async () => {
  visibleMonth.value = today.startOf('month');
  selectedDate.value = today;
  await loadEvents();
};

const selectDate = (day: Dayjs) => {
  selectedDate.value = day;
  if (props.compact) {
    router.push({ path: '/calendar', query: { date: day.format('YYYY-MM-DD'), user: targetUser.value } });
  }
};

const eventsForDate = (day: Dayjs) => {
  const start = day.startOf('day');
  const end = day.endOf('day');
  return calendarStore.events
    .filter(event => !dayjs(event.startAt).isAfter(end) && !dayjs(event.endAt).isBefore(start))
    .sort(sortEvents);
};

const selectedEvents = computed(() => eventsForDate(selectedDate.value));

const hasLevel = (day: Dayjs, level: string) =>
  eventsForDate(day).some(event => event.level === level && event.isOpen);

const openEvent = (event: RentalCalendarEvent) => {
  if (event.rentalId) {
    router.push(`/rentals/${event.rentalId}`);
    return;
  }
  if (event.reminderId) {
    router.push('/reminders');
  }
};

const eventTitle = (event: RentalCalendarEvent) =>
  event.rentalNumber || event.title;

const sortEvents = (a: RentalCalendarEvent, b: RentalCalendarEvent) => {
  const priority = (event: RentalCalendarEvent) => {
    if (event.level === 'Critical') return 0;
    if (event.level === 'Warning') return 1;
    if (event.kind === 'ShipmentRequired' || event.kind === 'ReturnRequired') return 2;
    if (event.kind === 'RentalPeriod') return 3;
    return 4;
  };
  return priority(a) - priority(b) || dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf();
};

const eventClass = (event: RentalCalendarEvent) => ({
  'event-critical': event.level === 'Critical',
  'event-warning': event.level === 'Warning',
  'event-period': event.kind === 'RentalPeriod',
  'event-logistics': event.kind === 'OutboundShipment' || event.kind === 'InboundShipment',
  'event-closed': !event.isOpen,
});

const tagColor = (event: RentalCalendarEvent) => {
  if (event.level === 'Critical') return 'red';
  if (event.level === 'Warning') return 'orange';
  if (event.kind === 'RentalPeriod') return 'blue';
  if (event.kind === 'OutboundShipment' || event.kind === 'InboundShipment') return 'cyan';
  return 'default';
};

const kindText = (kind: string) => {
  if (kind === 'RentalPeriod') return '租期';
  if (kind === 'ShipmentRequired') return '发货';
  if (kind === 'ReturnRequired') return '收货';
  if (kind === 'OutboundShipment') return '出库';
  if (kind === 'InboundShipment') return '回货';
  return '提醒';
};

const formatEventRange = (event: RentalCalendarEvent) => {
  const start = formatDateTime(event.startAt, event.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm');
  const end = formatDateTime(event.endAt, event.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm');
  return start === end ? start : `${start} 至 ${end}`;
};

watch(() => props.initialMonth, value => {
  if (value) visibleMonth.value = dayjs(`${value}-01`);
});

onMounted(async () => {
  if (canPickUser.value && canLoadUsers.value) {
    await userStore.fetchUsers({ status: 'Active', limit: 300 });
  }
  await loadEvents();
});
</script>

<style scoped>
.rental-calendar-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calendar-title {
  font-weight: 600;
}

.target-select {
  min-width: 132px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-weekday {
  padding: 8px;
  background: #fafafa;
  color: #5f6b7a;
  font-size: 12px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
}

.calendar-weekday:nth-child(7) {
  border-right: 0;
}

.calendar-day {
  min-height: 92px;
  padding: 6px;
  text-align: left;
  border: 0;
  border-top: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  background: #fff;
  cursor: pointer;
}

.calendar-day:nth-child(7n) {
  border-right: 0;
}

.calendar-day.is-muted {
  background: #fbfbfb;
  color: #a8b0ba;
}

.calendar-day.is-today .day-number {
  color: #1677ff;
  font-weight: 700;
}

.calendar-day.is-selected {
  box-shadow: inset 0 0 0 2px #1677ff;
}

.calendar-day.has-warning {
  background: #fffaf0;
}

.calendar-day.has-critical {
  background: #fff1f0;
}

.day-number {
  display: block;
  font-size: 13px;
  line-height: 18px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.event-pill {
  display: block;
  overflow: hidden;
  padding: 1px 5px;
  border-radius: 4px;
  background: #e6f4ff;
  color: #0958d9;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.event-warning {
  background: #fff7e6;
  color: #ad6800;
}

.event-critical {
  background: #fff1f0;
  color: #cf1322;
}

.event-period {
  background: #e6f4ff;
  color: #0958d9;
}

.event-logistics {
  background: #e6fffb;
  color: #006d75;
}

.event-closed {
  opacity: 0.56;
}

.event-more {
  color: #697386;
  font-size: 11px;
}

.calendar-detail {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.detail-heading {
  margin-bottom: 8px;
  font-weight: 600;
}

.detail-event {
  cursor: pointer;
}

@media (max-width: 767.98px) {
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .calendar-day {
    min-height: 72px;
    padding: 4px;
  }

  .event-pill {
    padding: 0 3px;
    font-size: 10px;
    line-height: 16px;
  }
}
</style>
