import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dashboard = readFileSync(join(root, 'src/pages/Dashboard.vue'), 'utf8');
const rentalStore = readFileSync(join(root, 'src/stores/rentalStore.ts'), 'utf8');

const listStart = dashboard.indexOf('const outboundPendingDeliveryList');
const listEnd = dashboard.indexOf('const returnInTransitList', listStart);
const outboundPendingListSource = dashboard.slice(listStart, listEnd);

const checks = [
  {
    name: 'dashboard renders the outbound pending-delivery section',
    pass: dashboard.includes('<a-card title="发货待签收">')
      && dashboard.includes(':data-source="outboundPendingDeliveryList"'),
  },
  {
    name: 'pending outbound shipment excludes delivered shipments',
    pass: /direction\s*===\s*'Outbound'\s*&&\s*!shipment\.deliveredAt/.test(dashboard),
  },
  {
    name: 'returned rentals are excluded from pending outbound delivery',
    pass: /rental\.status\s*!==\s*'Returned'[\s\S]*Boolean\(latestPendingOutboundShipment\(rental\)\)/.test(outboundPendingListSource),
  },
  {
    name: 'pending-delivery list has no UI item limit',
    pass: listStart >= 0 && listEnd > listStart && !outboundPendingListSource.includes('.slice('),
  },
  {
    name: 'dashboard loads every rentals page',
    pass: dashboard.includes('rentalStore.fetchAllRentals()')
      && /do\s*{[\s\S]*page\s*\+=\s*1;[\s\S]*}\s*while\s*\(rentalsById\.size\s*<\s*total\)/.test(rentalStore),
  },
  {
    name: 'signed inbound shipments awaiting return confirmation are shown',
    pass: dashboard.includes('<a-card title="回货已签收待确认归还">')
      && dashboard.includes(':data-source="returnDeliveredPendingConfirmationList"')
      && /direction\s*===\s*'Inbound'\s*&&\s*Boolean\(shipment\.deliveredAt\)/.test(dashboard)
      && /rental\.items\.some\(item\s*=>\s*!item\.returnedAt\)/.test(dashboard),
  },
];

const failures = checks.filter(check => !check.pass);

if (failures.length > 0) {
  console.error('Dashboard outbound pending-delivery verification failed:');
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

console.log(`Dashboard outbound pending-delivery verification passed (${checks.length} checks).`);
