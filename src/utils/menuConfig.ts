import type { Component } from 'vue';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  FundOutlined,
  HomeOutlined,
  PlusOutlined,
  SafetyOutlined,
  SelectOutlined,
  ShopOutlined,
  SwapOutlined,
  TeamOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { PermissionCodes as P } from './permissions';

export interface MenuNode {
  key: string;
  title: string;
  icon?: Component;
  to?: string;
  permission?: string;
  /** 需要任一权限即可显示 */
  anyPermission?: string[];
  children?: MenuNode[];
}

export const menuTree: MenuNode[] = [
  { key: 'dashboard', title: '仪表盘', icon: DashboardOutlined, to: '/dashboard' },
  {
    key: 'inventory',
    title: '库存总览',
    icon: DatabaseOutlined,
    to: '/inventory',
    permission: P.ItemView,
  },
  {
    key: 'master-data',
    title: '基础数据',
    icon: AppstoreOutlined,
    anyPermission: [P.WarehouseManage, P.CategoryManage, P.ItemDefinitionManage],
    children: [
      { key: 'warehouses', title: '仓库管理', icon: HomeOutlined, to: '/warehouses', permission: P.WarehouseManage },
      { key: 'categories', title: '分类管理', icon: AppstoreOutlined, to: '/categories', permission: P.CategoryManage },
      { key: 'item-definitions', title: '物品定义', icon: AppstoreOutlined, to: '/item-definitions', permission: P.ItemDefinitionManage },
    ],
  },
  {
    key: 'ops',
    title: '库存操作',
    icon: SwapOutlined,
    anyPermission: [P.ItemCreate, P.ItemUpdate, P.ItemTransfer, P.ItemView],
    children: [
      { key: 'inbound', title: '入库', icon: ArrowLeftOutlined, to: '/inbound', permission: P.ItemCreate },
      { key: 'outbound', title: '出库', icon: ArrowRightOutlined, to: '/outbound', permission: P.ItemUpdate },
      { key: 'TransferWarehouse', title: '调拨', icon: SelectOutlined, to: '/transfer', permission: P.ItemTransfer },
      { key: 'check', title: '盘点', icon: CheckCircleOutlined, to: '/check', permission: P.ItemUpdate },
      { key: 'check-analysis', title: '盘点分析', icon: FileSyncOutlined, to: '/check-analysis', permission: P.ItemView },
      { key: 'return', title: '归还', icon: UndoOutlined, to: '/return', permission: P.ItemUpdate },
    ],
  },
  {
    key: 'rental',
    title: '租赁业务',
    icon: ShopOutlined,
    anyPermission: [P.RenterView, P.RentalView, P.RentalCreate, P.FinanceReportView],
    children: [
      { key: 'renters', title: '租客管理', icon: TeamOutlined, to: '/renters', permission: P.RenterView },
      { key: 'rentals', title: '租赁列表', icon: FileDoneOutlined, to: '/rentals', permission: P.RentalView },
      { key: 'rental-calendar', title: '提醒日历', icon: CalendarOutlined, to: '/calendar', permission: P.RentalView },
      { key: 'item-definition-calendar', title: '定义占用日历', icon: CalendarOutlined, to: '/item-definition-calendar', permission: P.RentalView },
      { key: 'finance-reports', title: '财务报表', icon: FundOutlined, to: '/finance-reports', permission: P.FinanceReportView },
      { key: 'settlement-settings', title: '设置结算单', icon: FundOutlined, to: '/finance-reports/settlement-settings', permission: P.FinanceReportView },
      { key: 'rental-new', title: '新建租赁', icon: PlusOutlined, to: '/rentals/new', permission: P.RentalCreate },
    ],
  },
  {
    key: 'reminders',
    title: '提醒中心',
    icon: BellOutlined,
    anyPermission: [P.ReminderView, P.ShipmentReminderManage],
    children: [
      { key: 'messages', title: '消息提醒', icon: BellOutlined, to: '/reminders', permission: P.ReminderView },
      { key: 'shipment-reminder-settings', title: '发货通知设置', icon: BellOutlined, to: '/shipment-reminder-settings', permission: P.ShipmentReminderManage },
    ],
  },
  {
    key: 'admin',
    title: '权限管理',
    icon: SafetyOutlined,
    anyPermission: [P.UserView, P.RoleManage],
    children: [
      { key: 'users', title: '用户管理', icon: UserOutlined, to: '/users', permission: P.UserView },
      { key: 'roles', title: '角色管理', icon: SafetyOutlined, to: '/roles', permission: P.RoleManage },
    ],
  },
  { key: 'audit-log', title: '审计日志', icon: FileSearchOutlined, to: '/audit-log', permission: P.AuditLogView },
  { key: 'profile', title: '我的', icon: UserOutlined, to: '/profile' },
];

export interface PermissionChecker {
  hasPermission(code: string): boolean;
  hasAnyPermission(codes: string[]): boolean;
}

function filterNode(node: MenuNode, auth: PermissionChecker): MenuNode | null {
  if (node.permission && !auth.hasPermission(node.permission)) return null;
  if (node.anyPermission && !auth.hasAnyPermission(node.anyPermission)) return null;
  if (node.children) {
    const children = node.children.map(c => filterNode(c, auth)).filter((n): n is MenuNode => n !== null);
    if (children.length === 0) return null;
    return { ...node, children };
  }
  return node;
}

export function getVisibleMenu(auth: PermissionChecker): MenuNode[] {
  return menuTree.map(n => filterNode(n, auth)).filter((n): n is MenuNode => n !== null);
}
