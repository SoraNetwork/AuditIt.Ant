import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

const read = path => readFileSync(join(root, path), 'utf8');

const checks = [
  {
    name: 'router exposes renter detail route',
    pass: () => /path:\s*'renters\/:id'/.test(read('src/router/index.ts')),
  },
  {
    name: 'shared renter link component exists',
    pass: () => read('src/components/RenterLink.vue').includes('name: \'renter-detail\''),
  },
  {
    name: 'rental detail uses renter link',
    pass: () => read('src/pages/RentalDetail.vue').includes('RenterLink'),
  },
  {
    name: 'rentals list uses renter link',
    pass: () => read('src/pages/RentalsList.vue').includes('RenterLink'),
  },
  {
    name: 'dashboard uses renter link',
    pass: () => read('src/pages/Dashboard.vue').includes('RenterLink'),
  },
  {
    name: 'finance reports use renter link',
    pass: () => read('src/pages/FinanceReports.vue').includes('RenterLink'),
  },
  {
    name: 'item availability calendar uses renter link',
    pass: () => read('src/pages/ItemAvailabilityCalendar.vue').includes('RenterLink'),
  },
  {
    name: 'item definition occupancy calendar uses renter link',
    pass: () => read('src/pages/ItemDefinitionOccupancyCalendar.vue').includes('RenterLink'),
  },
  {
    name: 'rental calendar panel uses renter link',
    pass: () => read('src/components/RentalCalendarPanel.vue').includes('RenterLink'),
  },
  {
    name: 'rental detail reloads when route id changes',
    pass: () => /watch\(\s*\(\)\s*=>\s*route\.params\.id/.test(read('src/pages/RentalDetail.vue')),
  },
];

const failures = checks.filter(check => {
  try {
    return !check.pass();
  } catch {
    return true;
  }
});

if (failures.length > 0) {
  console.error('Renter link verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Renter link verification passed (${checks.length} checks).`);
