<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
        <div class="logo">
          <router-link to="/" class="logo-link">
            <span v-if="!collapsed">盘一个库</span>
          </router-link>
        </div>
        <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item key="dashboard">
          <router-link to="/dashboard"><dashboard-outlined /><span>仪表盘</span></router-link>
        </a-menu-item>
        <a-menu-item key="inventory">
          <router-link to="/inventory"><database-outlined /><span>库存总览</span></router-link>
        </a-menu-item>
        <a-menu-item key="warehouses">
          <router-link to="/warehouses"><home-outlined /><span>仓库管理</span></router-link>
        </a-menu-item>
        <a-menu-item key="categories">
          <router-link to="/categories"><appstore-outlined /><span>分类管理</span></router-link>
        </a-menu-item>
        <a-menu-item key="item-definitions">
            <router-link to="/item-definitions"><appstore-outlined /><span>物品定义</span></router-link>
          </a-menu-item>
          
          <a-sub-menu key="sub1">
          <template #title>
            <span><swap-outlined /><span>库存操作</span></span>
          </template>
          <a-menu-item key="inbound"><router-link to="/inbound"><arrow-left-outlined /> 入库</router-link></a-menu-item>
          <a-menu-item key="outbound"><router-link to="/outbound"><arrow-right-outlined /> 出库</router-link></a-menu-item>
          <a-menu-item key="check"><router-link to="/check"><check-circle-outlined /> 盘点</router-link></a-menu-item>
          <a-menu-item key="check-analysis"><router-link to="/check-analysis"><file-sync-outlined /> 盘点分析</router-link></a-menu-item>
          <a-menu-item key="return"><router-link to="/return"><undo-outlined /> 归还</router-link></a-menu-item>
        </a-sub-menu>
        <a-menu-item key="audit-log">
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
      <a-layout-header style="background: #fff; padding: 0 16px;">
        <!-- Header content can go here -->
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <div :style="{ padding: '24px', background: '#fff', minHeight: 'calc(100vh - 132px)' }">
          <router-view></router-view>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import {
  DashboardOutlined,
  UndoOutlined,
  DatabaseOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  FileSearchOutlined,
  UserOutlined,
  FileSyncOutlined,
} from '@ant-design/icons-vue';

const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['dashboard']);
const route = useRoute();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
};

watch(
  () => route.name,
  (routeName) => {
    if (typeof routeName === 'string') {
      selectedKeys.value = [routeName];
    }
  },
  { immediate: true }
);
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
  overflow: hidden; /* Hide text when collapsed */
}
.logo-link {
  color: white;
  text-decoration: none;
}
.logo:hover {
  background: #1890ff; /* Ant Design primary color */
}
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>