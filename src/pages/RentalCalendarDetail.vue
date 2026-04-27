<template>
  <div>
    <a-page-header title="提醒日历" sub-title="按用户查看租期、发货和收货提醒" />
    <div class="calendar-page">
      <a-card :body-style="{ padding: isMobile ? '12px' : '20px' }">
        <RentalCalendarPanel
          :initial-month="initialMonth"
          :initial-date="initialDate"
          :initial-user="initialUser"
        />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import RentalCalendarPanel from '../components/RentalCalendarPanel.vue';
import { useBreakpoint } from '../composables/useBreakpoint';

const route = useRoute();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();

const initialDate = computed(() => typeof route.query.date === 'string' ? route.query.date : undefined);
const initialMonth = computed(() => {
  if (typeof route.query.month === 'string') return route.query.month;
  return initialDate.value?.slice(0, 7);
});
const initialUser = computed(() => typeof route.query.user === 'string' ? route.query.user : undefined);
</script>

<style scoped>
.calendar-page {
  padding: 24px;
}

@media (max-width: 767.98px) {
  .calendar-page {
    padding: 12px;
  }
}
</style>
