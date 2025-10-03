import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore'; // 导入 UI store

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/print-preview',
    name: 'print-preview',
    component: () => import('../pages/PrintPreview.vue'),
    meta: { title: '打印预览' },
  },
  {
    path: '/',
    component: () => import('../layouts/Default.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../pages/Dashboard.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('../pages/InventoryView.vue'),
        meta: { title: '库存总览' },
      },
      {
        path: 'inventory/:id',
        name: 'item-details',
        component: () => import('../pages/ItemDetails.vue'),
        meta: { title: '物品详情' },
      },
      {
        path: 'inventory/edit/:id',
        name: 'item-edit',
        component: () => import('../pages/ItemEdit.vue'),
        meta: { title: '编辑物品' },
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('../pages/WarehouseList.vue'),
        meta: { title: '仓库管理' },
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../pages/CategoryList.vue'),
        meta: { title: '分类管理' },
      },
      {
        path: 'item-definitions',
        name: 'item-definitions',
        component: () => import('../pages/ItemDefinitionList.vue'),
        meta: { title: '物品定义' },
      },
      
      {
        path: 'inbound',
        name: 'inbound',
        component: () => import('../pages/Inbound.vue'),
        meta: { title: '入库' },
      },
      {
        path: 'outbound',
        name: 'outbound',
        component: () => import('../pages/Outbound.vue'),
        meta: { title: '出库' },
      },
      {
        path: 'transfer',
        name: 'TransferWarehouse',
        component: () => import('../pages/TransferWarehouse.vue'),
        meta: { title: '仓库调拨' },
      },
      {
        path: 'check',
        name: 'check',
        component: () => import('../pages/Check.vue'),
        meta: { title: '盘点' },
      },
      {
        path: 'check-analysis',
        name: 'check-analysis',
        component: () => import('../pages/CheckAnalysis.vue'),
        meta: { title: '盘点分析' },
      },
      {
        path: 'return',
        name: 'return',
        component: () => import('../pages/Return.vue'),
        meta: { title: '归还' },
      },
      {
        path: 'audit-log',
        name: 'audit-log',
        component: () => import('../pages/AuditLogView.vue'),
        meta: { title: '审计日志' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../pages/Profile.vue'),
        meta: { title: '我的' },
      },
      
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const uiStore = useUiStore();
  uiStore.startLoading(); // 开始加载

  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    next({ path: '/dashboard' });
  } else {
    next();
  }
});

router.afterEach((to) => {
  const uiStore = useUiStore();
  // 更新页面标题
  if (to.meta.title) {
    document.title = `盘一个库 | ${to.meta.title}`;
  } else {
    document.title = '盘一个库';
  }
  uiStore.stopLoading(); // 结束加载
});

export default router;
