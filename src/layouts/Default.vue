<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <router-link to="/" class="logo-link">
          <span v-if="!collapsed">租一个铺</span>
        </router-link>
      </div>

      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="dashboard">
          <router-link to="/dashboard"><dashboard-outlined /><span>仪表盘</span></router-link>
        </a-menu-item>

        <a-menu-item key="inventory" v-if="auth.hasPermission(P.ItemView)">
          <router-link to="/inventory"><database-outlined /><span>库存总览</span></router-link>
        </a-menu-item>

        <a-sub-menu key="master-data" v-if="showMasterData">
          <template #title><span><appstore-outlined /><span>基础数据</span></span></template>
          <a-menu-item key="warehouses" v-if="auth.hasPermission(P.WarehouseManage)">
            <router-link to="/warehouses"><home-outlined />仓库管理</router-link>
          </a-menu-item>
          <a-menu-item key="categories" v-if="auth.hasPermission(P.CategoryManage)">
            <router-link to="/categories"><appstore-outlined />分类管理</router-link>
          </a-menu-item>
          <a-menu-item key="item-definitions" v-if="auth.hasPermission(P.ItemDefinitionManage)">
            <router-link to="/item-definitions"><appstore-outlined />物品定义</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="ops" v-if="showOps">
          <template #title><span><swap-outlined /><span>库存操作</span></span></template>
          <a-menu-item key="inbound" v-if="auth.hasPermission(P.ItemCreate)">
            <router-link to="/inbound"><arrow-left-outlined />入库</router-link>
          </a-menu-item>
          <a-menu-item key="outbound" v-if="auth.hasPermission(P.ItemUpdate)">
            <router-link to="/outbound"><arrow-right-outlined />出库</router-link>
          </a-menu-item>
          <a-menu-item key="TransferWarehouse" v-if="auth.hasPermission(P.ItemTransfer)">
            <router-link to="/transfer"><select-outlined />调拨</router-link>
          </a-menu-item>
          <a-menu-item key="check" v-if="auth.hasPermission(P.ItemUpdate)">
            <router-link to="/check"><check-circle-outlined />盘点</router-link>
          </a-menu-item>
          <a-menu-item key="check-analysis" v-if="auth.hasPermission(P.ItemView)">
            <router-link to="/check-analysis"><file-sync-outlined />盘点分析</router-link>
          </a-menu-item>
          <a-menu-item key="return" v-if="auth.hasPermission(P.ItemUpdate)">
            <router-link to="/return"><undo-outlined />归还</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="rental" v-if="showRental">
          <template #title><span><shop-outlined /><span>租赁业务</span></span></template>
          <a-menu-item key="renters" v-if="auth.hasPermission(P.RenterView)">
            <router-link to="/renters"><team-outlined />租客管理</router-link>
          </a-menu-item>
          <a-menu-item key="rentals" v-if="auth.hasPermission(P.RentalView)">
            <router-link to="/rentals"><file-done-outlined />租赁列表</router-link>
          </a-menu-item>
          <a-menu-item key="rental-new" v-if="auth.hasPermission(P.RentalCreate)">
            <router-link to="/rentals/new"><plus-outlined />新建租赁</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-menu-item key="reminders" v-if="auth.hasPermission(P.ReminderView)">
          <router-link to="/reminders" class="menu-link-with-badge">
            <bell-outlined />
            <span>提醒中心</span>
            <a-badge
              v-if="reminderStore.unreadCount > 0"
              :count="reminderStore.unreadCount"
              :number-style="{ boxShadow: 'none' }"
              class="reminder-badge"
            />
          </router-link>
        </a-menu-item>

        <a-sub-menu key="admin" v-if="showAdmin">
          <template #title><span><safety-outlined /><span>权限管理</span></span></template>
          <a-menu-item key="users" v-if="auth.hasPermission(P.UserView)">
            <router-link to="/users"><user-outlined />用户管理</router-link>
          </a-menu-item>
          <a-menu-item key="roles" v-if="auth.hasPermission(P.RoleManage)">
            <router-link to="/roles"><safety-outlined />角色管理</router-link>
          </a-menu-item>
        </a-sub-menu>

        <a-menu-item key="audit-log" v-if="auth.hasPermission(P.AuditLogView)">
          <router-link to="/audit-log"><file-search-outlined /><span>审计日志</span></router-link>
        </a-menu-item>

        <a-menu-item key="profile">
          <router-link to="/profile"><user-outlined /><span>我的</span></router-link>
        </a-menu-item>

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
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  HomeOutlined,
  LogoutOutlined,
  PlusOutlined,
  SafetyOutlined,
  SelectOutlined,
  ShopOutlined,
  SwapOutlined,
  TeamOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';

const collapsed = ref(false);
const selectedKeys = ref<string[]>(['dashboard']);
const route = useRoute();
const auth = useAuthStore();
const reminderStore = useReminderStore();

const showMasterData = computed(() => auth.hasAnyPermission([P.WarehouseManage, P.CategoryManage, P.ItemDefinitionManage]));
const showOps = computed(() => auth.hasAnyPermission([P.ItemCreate, P.ItemUpdate, P.ItemTransfer, P.ItemView]));
const showRental = computed(() => auth.hasAnyPermission([P.RenterView, P.RentalView, P.RentalCreate]));
const showAdmin = computed(() => auth.hasAnyPermission([P.UserView, P.RoleManage]));

watch(
  () => route.name,
  routeName => {
    if (typeof routeName === 'string') {
      selectedKeys.value = [routeName];
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
