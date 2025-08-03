export const STATUS_MAP: { [key: string]: { text: string; color: string } } = {
  InStock: { text: '在库', color: 'green' },
  LoanedOut: { text: '借出', color: 'orange' },
  Disposed: { text: '已处置', color: 'red' },
  SuspectedMissing: { text: '疑似丢失', color: 'purple' },
};
