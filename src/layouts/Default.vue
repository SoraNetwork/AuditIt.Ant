<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <router-link to="/" class="logo-link">
          <span v-if="!collapsed">租一个铺</span>
        </router-link>
      </div>

      <a-menu v-model:selectedKeys="selectedKeys" v-model:openKeys="openKeys" theme="dark" mode="inline">
        <template v-for="node in visibleMenu" :key="node.key">
          <a-sub-menu v-if="node.children && node.children.length" :key="node.key">
            <template #title>
              <span>
                <component :is="node.icon" v-if="node.icon" />
                <span>{{ node.title }}</span>
              </span>
            </template>
            <a-menu-item v-for="child in node.children" :key="child.key">
              <router-link :to="child.to || '/'">
                <component :is="child.icon" v-if="child.icon" />
                {{ child.title }}
              </router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="node.key">
            <router-link v-if="node.key === 'reminders'" :to="node.to || '/'" class="menu-link-with-badge">
              <component :is="node.icon" v-if="node.icon" />
              <span>{{ node.title }}</span>
              <a-badge
                v-if="reminderStore.unreadCount > 0"
                :count="reminderStore.unreadCount"
                :number-style="{ boxShadow: 'none' }"
                class="reminder-badge"
              />
            </router-link>
            <router-link v-else :to="node.to || '/'">
              <component :is="node.icon" v-if="node.icon" />
              <span>{{ node.title }}</span>
            </router-link>
          </a-menu-item>
        </template>

        <a-menu-item key="logout" @click="handleLogout">
          <logout-outlined />
          <span>退出登录</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <div class="header-right">
          <a-tooltip title="提醒中心" v-if="auth.hasPermission(P.ReminderView)">
            <router-link to="/reminders" class="bell-link">
              <a-badge :count="reminderStore.unreadCount">
                <bell-outlined style="font-size: 18px" />
              </a-badge>
            </router-link>
          </a-tooltip>
          <span class="username" v-if="auth.user">{{ auth.user.name }}</span>
        </div>
      </a-layout-header>

      <a-layout-content style="margin: 16px">
        <div :style="{ padding: '24px', background: '#fff', minHeight: 'calc(100vh - 132px)' }">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useReminderStore } from '../stores/reminderStore';
import { PermissionCodes as P } from '../utils/permissions';
import { BellOutlined, LogoutOutlined } from '@ant-design/icons-vue';
import { getVisibleMenu, menuTree } from '../utils/menuConfig';

const collapsed = ref(false);
const selectedKeys = ref<string[]>(['dashboard']);
const openKeys = ref<string[]>([]);
const route = useRoute();
const auth = useAuthStore();
const reminderStore = useReminderStore();

const visibleMenu = computed(() => getVisibleMenu(auth));

function findParentKey(key: string): string | null {
  for (const node of menuTree) {
    if (node.children?.some(c => c.key === key)) return node.key;
  }
  return null;
}

watch(
  () => route.name,
  routeName => {
    if (typeof routeName !== 'string') return;
    selectedKeys.value = [routeName];
    const parent = findParentKey(routeName);
    if (parent && !openKeys.value.includes(parent)) {
      openKeys.value = [...openKeys.value, parent];
    }
  },
  { immediate: true }
);

const handleLogout = () => {
  auth.logout();
};

let pollTimer: number | undefined;

onMounted(() => {
  if (auth.hasPermission(P.ReminderView)) {
    reminderStore.fetchUnreadCount();
    pollTimer = window.setInterval(() => {
      reminderStore.fetchUnreadCount();
    }, 60_000);
  }
});

onUnmounted(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer);
  }
});
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  transition: background 0.3s;
  overflow: hidden;
}

.logo-link {
  color: white;
  text-decoration: none;
}

.logo:hover {
  background: #1890ff;
}

.app-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bell-link {
  color: inherit;
  display: inline-flex;
  align-items: center;
}

.username {
  color: #333;
  font-weight: 500;
}

.menu-link-with-badge {
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.menu-link-with-badge .reminder-badge {
  margin-left: auto;
}

.menu-link-with-badge .reminder-badge :deep(.ant-badge-count) {
  box-shadow: none;
}
</style>
