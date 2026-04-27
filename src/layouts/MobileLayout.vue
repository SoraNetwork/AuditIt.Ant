<template>
  <a-config-provider :component-size="'large'">
    <a-layout class="mobile-root">
      <header class="mobile-header">
        <a-button type="text" class="icon-btn" @click="drawerOpen = true">
          <menu-outlined />
        </a-button>
        <div class="title">{{ title }}</div>
        <router-link
          v-if="auth.hasPermission(P.ReminderView)"
          to="/reminders"
          class="icon-btn"
        >
          <a-badge
            :count="reminderStore.unreadCount"
            :overflow-count="99"
            :offset="[-1, 3]"
            class="header-reminder-badge"
          >
            <bell-outlined style="font-size: 18px; color: #333" />
          </a-badge>
        </router-link>
        <router-link to="/profile" class="icon-btn">
          <user-outlined style="font-size: 18px; color: #333" />
        </router-link>
      </header>

      <a-drawer
        v-model:open="drawerOpen"
        placement="left"
        width="80vw"
        :closable="false"
        :body-style="{ padding: 0 }"
        :header-style="{ display: 'none' }"
      >
        <MobileDrawerMenu @close="drawerOpen = false" />
      </a-drawer>

      <a-layout-content class="mobile-content">
        <router-view />
      </a-layout-content>

      <MobileTabbar />
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BellOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '../stores/authStore';
import { useReminderStore } from '../stores/reminderStore';
import { PermissionCodes as P } from '../utils/permissions';
import MobileDrawerMenu from '../components/mobile/MobileDrawerMenu.vue';
import MobileTabbar from '../components/mobile/MobileTabbar.vue';

const route = useRoute();
const auth = useAuthStore();
const reminderStore = useReminderStore();

const drawerOpen = ref(false);
const title = computed(() => (route.meta.title as string) || '租一个铺');

watch(() => route.fullPath, () => {
  drawerOpen.value = false;
});

let pollTimer: number | undefined;
onMounted(() => {
  if (auth.hasPermission(P.ReminderView)) {
    reminderStore.fetchUnreadCount();
    pollTimer = window.setInterval(() => reminderStore.fetchUnreadCount(), 60_000);
  }
});
onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});
</script>

<style scoped>
.mobile-root {
  min-height: 100vh;
  background: #f5f7fa;
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 12px;
  padding-top: env(safe-area-inset-top);
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.mobile-header .title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
}

.icon-btn :deep(.anticon) {
  font-size: 18px;
}

.header-reminder-badge :deep(.ant-badge-count) {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  box-shadow: none;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}

.mobile-content {
  padding: 16px 16px calc(88px + env(safe-area-inset-bottom));
  min-height: calc(100vh - 52px);
}
</style>
