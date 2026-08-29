import type { Rental, RentalStatus, ReturnCondition, ShipmentDirection } from '../stores/rentalStore';
import type { ReminderLevel, ReminderType } from '../stores/reminderStore';

export const rentalStatusText = (status?: RentalStatus | string | null) => {
  switch (status) {
    case 'Pending':
      return '待发货';
    case 'PartiallyShipped':
      return '未完全发货';
    case 'Active':
      return '进行中';
    case 'Overdue':
      return '逾期';
    case 'Returned':
      return '已归还';
    case 'Cancelled':
      return '已取消';
    case 'Renewed':
      return '已续租';
    default:
      return status || '-';
  }
};

export const rentalStatusColor = (status?: RentalStatus | string | null) => {
  if (status === 'Pending') return 'default';
  if (status === 'PartiallyShipped') return 'orange';
  if (status === 'Active') return 'blue';
  if (status === 'Overdue') return 'red';
  if (status === 'Returned') return 'green';
  if (status === 'Renewed') return 'cyan';
  return 'orange';
};

export const isReturnUnsignedRental = (rental?: Pick<Rental, 'status' | 'shipments'> | null) =>
  rental?.status === 'Returned'
  && !!rental.shipments?.some(shipment => shipment.direction === 'Inbound')
  && !rental.shipments?.some(shipment => shipment.direction === 'Inbound' && !!shipment.deliveredAt);

export const isPartiallyReturnedRental = (
  rental?: Pick<Rental, 'status' | 'items'> | null,
) => {
  if (!rental || !['Active', 'Overdue'].includes(rental.status)) return false;
  const items = rental.items || [];
  return items.some(item => !!item.returnedAt) && items.some(item => !item.returnedAt);
};

export const rentalDisplayStatusText = (
  rental?: Pick<Rental, 'status' | 'shipments' | 'items'> | null,
) => {
  if (isReturnUnsignedRental(rental)) return '待回货签收';
  if (isPartiallyReturnedRental(rental)) {
    return rental?.status === 'Overdue' ? '部分归还（逾期）' : '部分归还';
  }
  return rentalStatusText(rental?.status);
};

export const rentalDisplayStatusColor = (
  rental?: Pick<Rental, 'status' | 'shipments' | 'items'> | null,
) =>
  isReturnUnsignedRental(rental) ? 'orange' : rentalStatusColor(rental?.status);

export const shipmentDirectionText = (direction?: ShipmentDirection | string | null) => {
  if (direction === 'Outbound') return '发货';
  if (direction === 'Inbound') return '回货';
  return direction || '-';
};

export const shipmentDirectionColor = (direction?: ShipmentDirection | string | null) =>
  direction === 'Outbound' ? 'blue' : 'geekblue';

export const returnConditionText = (condition?: ReturnCondition | string | null) => {
  switch (condition) {
    case 'Good':
      return '良好';
    case 'MinorDamage':
      return '轻微损坏';
    case 'MajorDamage':
      return '严重损坏';
    case 'Lost':
      return '丢失';
    default:
      return condition || '-';
  }
};

export const reminderTypeText = (type?: ReminderType | string | null, short = false) => {
  if (type === 'RentalShipmentSoon') return '发货提醒';
  if (type === 'RentalDeliveryUnsigned') return short ? '发货待签' : '发货待签收';
  if (type === 'RentalReturnUnsigned') return short ? '回货待签' : '回货待签收';
  if (type === 'RentalDueSoon') return '到期提醒';
  if (type === 'RentalOverdue') return '逾期提醒';
  if (type === 'Manual') return '普通提醒';
  return type || '-';
};

export const reminderLevelText = (level?: ReminderLevel | string | null) => {
  if (level === 'Critical') return '紧急';
  if (level === 'Warning') return '重要';
  if (level === 'Info') return '普通';
  return level || '-';
};

export const userStatusText = (status?: string | null) => {
  if (status === 'Active') return '在职';
  if (status === 'Left') return '离职';
  return status || '-';
};

export const listingStatusText = (status?: string | null) => {
  if (status === 'Draft') return '草稿';
  if (status === 'Listed') return '已上架';
  if (status === 'Hidden') return '已隐藏';
  if (status === 'Sold') return '已售出';
  return status || '-';
};
