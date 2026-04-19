<template>
  <nav class="mobile-tabbar">
    <router-link
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="tab-item"
      :class="{ active: isActive(item) }"
    >
      <a-badge
        v-if="item.key === 'reminders'"
        :count="reminderStore.unreadCount"
        :offset="[2, 0]"
        :number-style="{ boxShadow: 'none' }"
      >
        <component :is="item.icon" class="tab-icon" />
      </a-badge>
      <component v-else :is="item.icon" class="tab-icon" />
      <span class="tab-label">{{ item.title }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';
import {
  DashboardOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '../../stores/authStore';
import { useReminderStore } from '../../stores/reminderStore';
import { PermissionCodes as P } from '../../utils/permissions';

interface TabItem {
  key: string;
  title: string;
  to: string;
  icon: Component;
  match: string;
  permission?: string;
}

const allItems: TabItem[] = [
  { key: 'dashboard', title: '仪表盘', to: '/dashboard', icon: DashboardOutlined, match: '/dashboard' },
  { key: 'inventory', title: '库存', to: '/inventory', icon: DatabaseOutlined, match: '/inventory', permission: P.ItemView },
  { key: 'rentals', title: '租赁', to: '/rentals', icon: FileDoneOutlined, match: '/rentals', permission: P.RentalView },
  { key: 'reminders', title: '提醒', to: '/reminders', icon: BellOutlined, match: '/reminders', permission: P.ReminderView },
  { key: 'profile', title: '我的', to: '/profile', icon: UserOutlined, match: '/profile' },
];

const route = useRoute();
const auth = useAuthStore();
const reminderStore = useReminderStore();

const items = computed(() =>
  allItems.filter(item => !item.permission || auth.hasPermission(item.permission))
);

function isActive(item: TabItem) {
  const path = route.path;
  return path === item.match || path.startsWith(item.match + '/');
}
</script>

<style scoped>
.mobile-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: stretch;
  z-index: 90;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #888;
  text-decoration: none;
  font-size: 12px;
  padding: 4px 0;
  transition: color 0.2s;
}

.tab-item.active {
  color: #1890ff;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 11px;
  line-height: 1.2;
}
</style>
