import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login.vue'),
  },
  {
    path: '/dingtalk-oauth',
    name: 'dingtalk-oauth',
    component: () => import('../pages/DingtalkOAuth.vue'),
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
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('../pages/InventoryView.vue'),
      },
      {
        path: 'inventory/:id',
        name: 'item-details',
        component: () => import('../pages/ItemDetails.vue'),
      },
      {
        path: 'warehouses',
        name: 'warehouses',
        component: () => import('../pages/WarehouseList.vue'),
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../pages/CategoryList.vue'),
      },
      {
        path: 'item-definitions',
        name: 'item-definitions',
        component: () => import('../pages/ItemDefinitionList.vue'),
      },
      {
        path: 'inbound',
        name: 'inbound',
        component: () => import('../pages/Inbound.vue'),
      },
      {
        path: 'outbound',
        name: 'outbound',
        component: () => import('../pages/Outbound.vue'),
      },
      {
        path: 'check',
        name: 'check',
        component: () => import('../pages/Check.vue'),
      },
      {
        path: 'return',
        name: 'return',
        component: () => import('../pages/Return.vue'),
      },
      {
        path: 'audit-log',
        name: 'audit-log',
        component: () => import('../pages/AuditLogView.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  // 在路由守卫外部获取 store 实例
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 如果目标路由需要认证但用户未登录，则重定向到登录页
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // 如果用户已登录，但试图访问登录页，则重定向到首页
    next({ path: '/' });
  } else {
    // 其他情况正常放行
    next();
  }
});

export default router;