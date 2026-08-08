export const PermissionCodes = {
  UserView: 'user.view',
  UserManage: 'user.manage',
  RoleManage: 'role.manage',

  WarehouseManage: 'warehouse.manage',
  CategoryManage: 'category.manage',
  ItemDefinitionManage: 'itemdefinition.manage',

  ItemView: 'item.view',
  ItemCreate: 'item.create',
  ItemUpdate: 'item.update',
  ItemDelete: 'item.delete',
  ItemTransfer: 'item.transfer',

  ListingManage: 'listing.manage',

  RenterView: 'renter.view',
  RenterManage: 'renter.manage',

  RentalView: 'rental.view',
  RentalCreate: 'rental.create',
  RentalUpdate: 'rental.update',
  RentalShip: 'rental.ship',
  RentalReturn: 'rental.return',
  RentalCancel: 'rental.cancel',

  ReminderView: 'reminder.view',
  ReminderCreate: 'reminder.create',
  ReminderDismissAny: 'reminder.dismiss.any',
  ShipmentReminderManage: 'shipmentreminder.manage',

  FinanceReportView: 'finance.report.view',

  AuditLogView: 'auditlog.view',
} as const;

export type PermissionCode = (typeof PermissionCodes)[keyof typeof PermissionCodes];
