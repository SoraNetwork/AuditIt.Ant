import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { PermissionCodes } from '../utils/permissions';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('../pages/Forbidden.vue'),
    meta: { requiresAuth: true, title: '无权限' },
  },
  {
    path: '/print-preview',
    name: 'print-preview',
    component: () => import('../pages/PrintPreview.vue'),
    meta: { title: '打印预览' },
  },
  {
    path: '/',
    component: () => import('../layouts/LayoutSwitcher.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('../pages/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'inventory', name: 'inventory', component: () => import('../pages/InventoryView.vue'), meta: { title: '库存总览', permissions: [PermissionCodes.ItemView] } },
      { path: 'inventory/:id', name: 'item-details', component: () => import('../pages/ItemDetails.vue'), meta: { title: '物品详情', permissions: [PermissionCodes.ItemView] } },
      { path: 'inventory/:id/calendar', name: 'item-availability-calendar', component: () => import('../pages/ItemAvailabilityCalendar.vue'), meta: { title: '设备空闲日历', permissions: [PermissionCodes.ItemView] } },
      { path: 'inventory/edit/:id', name: 'item-edit', component: () => import('../pages/ItemEdit.vue'), meta: { title: '编辑物品', permissions: [PermissionCodes.ItemUpdate] } },

      { path: 'warehouses', name: 'warehouses', component: () => import('../pages/WarehouseList.vue'), meta: { title: '仓库管理', permissions: [PermissionCodes.WarehouseManage] } },
      { path: 'categories', name: 'categories', component: () => import('../pages/CategoryList.vue'), meta: { title: '分类管理', permissions: [PermissionCodes.CategoryManage] } },
      { path: 'item-definitions', name: 'item-definitions', component: () => import('../pages/ItemDefinitionList.vue'), meta: { title: '物品定义', permissions: [PermissionCodes.ItemDefinitionManage] } },

      { path: 'inbound', name: 'inbound', component: () => import('../pages/Inbound.vue'), meta: { title: '入库', permissions: [PermissionCodes.ItemCreate] } },
      { path: 'outbound', name: 'outbound', component: () => import('../pages/Outbound.vue'), meta: { title: '出库', permissions: [PermissionCodes.ItemUpdate] } },
      { path: 'transfer', name: 'TransferWarehouse', component: () => import('../pages/TransferWarehouse.vue'), meta: { title: '仓库调拨', permissions: [PermissionCodes.ItemTransfer] } },
      { path: 'check', name: 'check', component: () => import('../pages/Check.vue'), meta: { title: '盘点', permissions: [PermissionCodes.ItemUpdate] } },
      { path: 'check-analysis', name: 'check-analysis', component: () => import('../pages/CheckAnalysis.vue'), meta: { title: '盘点分析', permissions: [PermissionCodes.ItemView] } },
      { path: 'return', name: 'return', component: () => import('../pages/Return.vue'), meta: { title: '归还', permissions: [PermissionCodes.ItemUpdate] } },

      { path: 'renters', name: 'renters', component: () => import('../pages/RentersList.vue'), meta: { title: '租客管理', permissions: [PermissionCodes.RenterView] } },
      { path: 'rentals', name: 'rentals', component: () => import('../pages/RentalsList.vue'), meta: { title: '租赁列表', permissions: [PermissionCodes.RentalView] } },
      { path: 'rentals/new', name: 'rental-new', component: () => import('../pages/RentalCreate.vue'), meta: { title: '新建租赁', permissions: [PermissionCodes.RentalCreate] } },
      { path: 'rentals/:id', name: 'rental-detail', component: () => import('../pages/RentalDetail.vue'), meta: { title: '租赁详情', permissions: [PermissionCodes.RentalView] } },
      { path: 'calendar', name: 'rental-calendar', component: () => import('../pages/RentalCalendarDetail.vue'), meta: { title: '提醒日历', permissions: [PermissionCodes.RentalView] } },
      { path: 'item-definition-calendar', name: 'item-definition-calendar', component: () => import('../pages/ItemDefinitionOccupancyCalendar.vue'), meta: { title: '定义占用日历', permissions: [PermissionCodes.RentalView] } },
      { path: 'finance-reports', name: 'finance-reports', component: () => import('../pages/FinanceReports.vue'), meta: { title: '财务报表', permissions: [PermissionCodes.FinanceReportView] } },
      { path: 'finance-reports/settlement-settings', name: 'settlement-settings', component: () => import('../pages/SettlementSettings.vue'), meta: { title: '设置结算单', permissions: [PermissionCodes.FinanceReportView] } },

      { path: 'reminders', name: 'reminders', component: () => import('../pages/RemindersInbox.vue'), meta: { title: '提醒中心', permissions: [PermissionCodes.ReminderView] } },

      { path: 'users', name: 'users', component: () => import('../pages/UsersList.vue'), meta: { title: '用户管理', permissions: [PermissionCodes.UserView] } },
      { path: 'roles', name: 'roles', component: () => import('../pages/RolesList.vue'), meta: { title: '角色管理', permissions: [PermissionCodes.RoleManage] } },

      { path: 'audit-log', name: 'audit-log', component: () => import('../pages/AuditLogView.vue'), meta: { title: '审计日志', permissions: [PermissionCodes.AuditLogView] } },
      { path: 'profile', name: 'profile', component: () => import('../pages/Profile.vue'), meta: { title: '我的' } },
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
  uiStore.startLoading();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
    return;
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ path: '/dashboard' });
    return;
  }

  const requiredPermissions = (to.meta.permissions as string[] | undefined) || [];
  if (requiredPermissions.length > 0 && authStore.isAuthenticated && !authStore.hasAnyPermission(requiredPermissions)) {
    uiStore.showNotification('无权限访问该页面', 'warning');
    next({ name: 'forbidden' });
    return;
  }

  next();
});

router.afterEach(to => {
  const uiStore = useUiStore();
  if (to.name === 'login') {
    document.title = '租一个铺';
  } else if (to.meta.title) {
    document.title = `租一个铺 | ${to.meta.title}`;
  } else {
    document.title = '租一个铺';
  }
  uiStore.stopLoading();
});

export default router;
