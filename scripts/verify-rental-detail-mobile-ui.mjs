import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rentalDetail = readFileSync(resolve(root, 'src/pages/RentalDetail.vue'), 'utf8');

const requiredSnippets = [
  'class="rental-mobile-shell"',
  'class="rental-mobile-hero"',
  'class="rental-mobile-status"',
  'class="rental-mobile-money-grid"',
  'class="rental-mobile-info-section"',
  'class="rental-primary-actions"',
  'class="rental-secondary-actions"',
  'class="rental-mobile-toolbar"',
  'class="rental-mobile-upload"',
  '租期与发货',
  '金额与订单',
  '收货与备注',
  '.rental-mobile-shell',
  '.rental-mobile-hero',
  '.rental-mobile-money-grid',
  '.rental-mobile-info-section',
  '.rental-mobile-toolbar',
  '.rental-mobile-upload',
  'useNativeDateInput',
  'type="date"',
  'inputmode="none"',
  'class="mobile-native-date-input"',
  'selectedRentalItemPrices',
  '删除物流',
  'overflow-wrap: anywhere',
];

const missing = requiredSnippets.filter(snippet => !rentalDetail.includes(snippet));

if (rentalDetail.includes('class="mobile-detail-list"')) {
  missing.push('replace legacy mobile-detail-list with grouped mobile info sections');
}

if (missing.length > 0) {
  console.error('RentalDetail mobile UI regression check failed.');
  console.error('Missing or outdated mobile UI markers:');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('RentalDetail mobile UI regression check passed.');
