<template>
  <div class="drawer-menu">
    <div class="drawer-header">
      <a-avatar :size="40" style="background: #1890ff">
        {{ (auth.user?.name || '?').slice(0, 1) }}
      </a-avatar>
      <div class="user-info">
        <div class="name">{{ auth.user?.name || '未登录' }}</div>
        <div class="role">{{ auth.permissions.length }} 项权限</div>
      </div>
    </div>

    <a-menu
      v-model:selectedKeys="selectedKeys"
      v-model:openKeys="openKeys"
      mode="inline"
      class="drawer-menu-body"
      @click="onClick"
    >
      <template v-for="node in visibleMenu" :key="node.key">
        <a-sub-menu v-if="node.children && node.children.length" :key="node.key">
          <template #title>
            <span>
              <component :is="node.icon" v-if="node.icon" />
              <span>{{ node.title }}</span>
            </span>
          </template>
          <a-menu-item v-for="child in node.children" :key="child.key" :data-to="child.to">
            <component :is="child.icon" v-if="child.icon" />
            <span>{{ child.title }}</span>
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else :key="node.key" :data-to="node.to">
          <component :is="node.icon" v-if="node.icon" />
          <span>{{ node.title }}</span>
          <a-badge
            v-if="node.key === 'reminders' && reminderStore.unreadCount > 0"
            :count="reminderStore.unreadCount"
            :number-style="{ boxShadow: 'none' }"
            class="reminder-badge"
          />
        </a-menu-item>
      </template>
    </a-menu>

    <div class="drawer-footer">
      <a-button block @click="handleLogout">
        <logout-outlined />
        退出登录
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogoutOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '../../stores/authStore';
import { useReminderStore } from '../../stores/reminderStore';
import { getVisibleMenu, menuTree } from '../../utils/menuConfig';

const emit = defineEmits<{ (e: 'close'): void }>();

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const reminderStore = useReminderStore();

const visibleMenu = computed(() => getVisibleMenu(auth));
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>([]);

function findParentKey(key: string): string | null {
  for (const node of menuTree) {
    if (node.children?.some(c => c.key === key)) return node.key;
  }
  return null;
}

watch(
  () => route.name,
  name => {
    if (typeof name !== 'string') return;
    selectedKeys.value = [name];
    const parent = findParentKey(name);
    if (parent && !openKeys.value.includes(parent)) {
      openKeys.value = [...openKeys.value, parent];
    }
  },
  { immediate: true }
);

function onClick({ key, domEvent }: { key: string; domEvent: MouseEvent }) {
  const target = (domEvent.currentTarget || domEvent.target) as HTMLElement;
  const to = target?.getAttribute?.('data-to') || findMenuTo(key);
  if (to) router.push(to);
  emit('close');
}

function findMenuTo(key: string): string | undefined {
  for (const node of menuTree) {
    if (node.key === key) return node.to;
    const hit = node.children?.find(c => c.key === key);
    if (hit) return hit.to;
  }
  return undefined;
}

function handleLogout() {
  emit('close');
  auth.logout();
}
</script>

<style scoped>
.drawer-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info .name {
  font-weight: 600;
  font-size: 15px;
}

.user-info .role {
  color: #888;
  font-size: 12px;
  margin-top: 2px;
}

.drawer-menu-body {
  flex: 1;
  overflow-y: auto;
  border-right: 0;
}

.drawer-footer {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #f0f0f0;
}

.reminder-badge {
  margin-left: auto;
}

.reminder-badge :deep(.ant-badge-count) {
  box-shadow: none;
}
</style>
