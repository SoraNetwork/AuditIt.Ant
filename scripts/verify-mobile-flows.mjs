// Run against a local Vite server. Every API response is synthetic; no live
// account, inventory, logistics or notification service is contacted.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.MOBILE_TEST_URL || 'http://localhost:5173';
const output = new URL('../logs/mobile-ui/', import.meta.url);
await mkdir(output, { recursive: true });
const permissions = [...(await readFile(new URL('../src/utils/permissions.ts', import.meta.url), 'utf8')).matchAll(/: '([^']+)'/g)].map(m => m[1]);
const warehouse = { id: 1, name: '主仓库', location: '上海', description: '测试仓库' };
const category = { id: 1, name: '摄影设备', description: '相机与镜头' };
const definition = { id: 1, name: '专业摄影相机与配件', categoryId: 1, category, unit: '件', description: '测试物品定义' };
const items = Array.from({ length: 95 }, (_, i) => ({ id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`, shortId: `CAM-${String(i + 1).padStart(3, '0')}`, itemDefinitionId: 1, itemDefinitionName: definition.name, categoryId: 1, categoryName: category.name, warehouseId: 1, warehouseName: warehouse.name, status: 'InStock', ownerUserNames: ['测试用户'], entryDate: '2026-09-01T00:00:00', lastUpdated: '2026-09-29T00:00:00', remarks: '完整测试物品备注', itemValue: 1000 }));
const renter = { id: 'renter-1', name: '测试租客', phone: '13800000000', defaultAddress: '上海市测试地址', platformRemark: '', createdAt: '2026-09-01' };
const rental = { id: 'rental-1', rentalNumber: 'R20260929-0001', status: 'Pending', renterId: renter.id, renter, startDate: '2026-10-02', expectedShipDate: '2026-09-29', expectedEndDate: '2026-10-07', expectedReturnDate: '2026-10-09', totalPrice: 1200, deposit: 500, totalShippingFee: 0, otherFee: 0, accountedAmount: 1200, assignedTo: '测试用户', createdBy: '测试用户', createdAt: '2026-09-29', updatedAt: '2026-09-29', shippingAddress: renter.defaultAddress, notes: '手机端测试订单', items: [{ id: 1, itemId: items[0].id, itemDefinitionId: 1, itemNameSnapshot: definition.name, itemShortIdSnapshot: items[0].shortId, perItemPrice: 1200 }], shipments: [] };
let slowCalendar = false;
let calendarResponses = 0;
function fixture(url) {
  const path = url.pathname.split('/api')[1]?.toLowerCase() || '';
  if (/\/itemdefinitions\/\d+\/occupancy/.test(path)) {
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const days = [];
    for (let date = new Date(from); date <= new Date(to); date.setUTCDate(date.getUTCDate() + 1)) days.push({ date: date.toISOString().slice(0, 10), totalStock: 95, occupiedCount: 1, remainingStock: 94, details: [{ rentalId: rental.id, rentalNumber: rental.rentalNumber, rentalStatus: 'Pending', renterId: renter.id, renterName: renter.name, quantity: 1, isUncertain: true, occupancyStatus: 'Scheduled' }] });
    return { itemDefinitionId: 1, warehouseId: 1, name: definition.name, from, to, totalStock: 95, dailyStocks: days };
  }
  if (path.includes('/availability')) return { item: items[0], from: url.searchParams.get('from'), to: url.searchParams.get('to'), busyPeriods: [], freePeriods: [] };
  if (path === '/warehouses') return [warehouse];
  if (path === '/categories') return [category];
  if (path === '/itemdefinitions') return [definition];
  if (path === '/items') return url.searchParams.get('warehouseId') === '2' ? [items[94]] : items;
  if (path === '/items/check-analysis') return { checkedItems: [], uncheckedItems: items };
  if (/\/items\/[^/]+$/.test(path)) return items[0];
  if (path === '/renters') return [renter];
  if (path === '/renters/renter-1') return renter;
  if (path === '/rentals') return { items: [rental], total: 1 };
  if (path === '/rentals/rental-1') return rental;
  if (path.endsWith('/owner-options')) return { employees: ['测试用户'] };
  if (path.endsWith('/payment-account-default')) return { defaultPaymentAccount: '', paymentAccountPresets: [] };
  if (path.endsWith('/sf-routes')) return { rental, routes: [] };
  if (path.endsWith('/settlement')) return { rentalId: rental.id, ownerShares: [], shipperShares: [], canSend: false };
  if (path.endsWith('/summary')) return { rentalCount: 0, activeRentalCount: 0, closedRentalCount: 0, totalOrderAmount: 0, totalDeposit: 0, totalShippingFee: 0, totalOtherFee: 0, accountedAmount: 0, categories: [], statuses: [], paymentAccounts: [] };
  if (path.endsWith('/settlement-settings')) return { technicianPercent: 20, creatorPercent: 20, shipperPercent: 20, itemOwnerPercent: 40, paymentAccountPresets: [] };
  if (path === '/shipment-reminder-settings') return { enabled: false, smsEnabled: false, voiceEnabled: false, sendHour: 12, sendMinute: 0, voiceSendHour: 12, voiceSendMinute: 30, templateVariables: [], administratorUserIds: [], templateBody: '发货提醒', aliyunCredentialsConfigured: false };
  return [];
}

const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const failures = [];
const results = [];
try {
  for (const width of (process.env.MOBILE_TEST_WIDTHS || '360,390,768,1440').split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 800, hasTouch: width < 800, reducedMotion: 'reduce' });
    await context.addInitScript(({ permissions }) => {
      localStorage.setItem('token', 'local-test-only');
      localStorage.setItem('user', JSON.stringify({ id: 'test', name: '测试用户' }));
      localStorage.setItem('permissions', JSON.stringify(permissions));
    }, { permissions });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/items' && url.searchParams.get('warehouseId') === '1')
          await new Promise(resolve => setTimeout(resolve, 250));
        if (slowCalendar && url.pathname.includes('/occupancy')) {
          const order = ++calendarResponses;
          await new Promise(resolve => setTimeout(resolve, order === 1 ? 900 : 50));
        }
        return route.fulfill({ json: fixture(url), headers: { 'access-control-allow-origin': '*' } });
      }
      if (url.origin !== new URL(base).origin) return route.fulfill({ body: '', contentType: 'application/javascript' });
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const routes = width === 360 || width === 1440
      ? ['/dashboard', '/inventory', `/inventory/${items[0].id}`, `/inventory/${items[0].id}/calendar`, `/inventory/edit/${items[0].id}`, '/rentals', '/rentals/new', '/rentals/rental-1', '/item-definition-calendar?warehouseId=1&definitionId=1', '/calendar', '/inbound', '/outbound', '/return', '/transfer', '/check', '/check-analysis', '/renters', '/renters/renter-1', '/item-definitions', '/categories', '/warehouses', '/reminders', '/audit-log', '/users', '/roles', '/finance-reports', '/finance-reports/settlement-settings', '/shipment-reminder-settings', '/profile']
      : ['/inventory', '/rentals/new', '/rentals/rental-1', '/item-definition-calendar?warehouseId=1&definitionId=1'];
    for (const path of routes) {
      errors.length = 0;
      await page.goto(base + path);
      await page.waitForLoadState('networkidle');
      const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      if (size.document > size.viewport + 2 || errors.length) {
        const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => {
          const rect = e.getBoundingClientRect();
          return rect.width > 0 && rect.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed';
        }).slice(0, 12).map(e => ({ tag: e.tagName, class: e.className, width: Math.round(e.getBoundingClientRect().width) })));
        failures.push({ width, path, size, errors: [...errors], overflow });
      }
      results.push({ width, path, ...size });
      if (width === 390) await page.screenshot({ path: new URL(`${width}-${path.split('?')[0].replaceAll('/', '-')}.png`, output).pathname.replace(/^\/([A-Z]:)/i, '$1') });
    }
    if (width === 390) {
      await page.goto(base + '/inventory');
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('.mobile-list-card').count(), 30);
      await page.getByRole('button', { name: '加载更多物品' }).click();
      assert.equal(await page.locator('.mobile-list-card').count(), 60);
      await page.goto(base + '/rentals/new');
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('input[type=date]:not([disabled])').count(), 4);
      const dates = await page.locator('input[type=date]').evaluateAll(inputs => inputs.map(input => input.value));
      assert.equal((Date.parse(dates[3]) - Date.parse(dates[2])) / 86400000, 2);
      await page.getByText('快速建档', { exact: true }).first().click();
      const modal = page.locator('.ant-modal-content:visible');
      await modal.waitFor();
      const modalBox = await modal.boundingBox();
      assert.ok(modalBox.height < 844 && modalBox.width <= 390);
      await page.keyboard.press('Escape');
      await page.goto(base + '/item-definition-calendar?warehouseId=1&definitionId=1&month=2026-09&date=2026-09-29');
      await page.waitForLoadState('networkidle');
      slowCalendar = true; calendarResponses = 0;
      await page.locator('.nav-buttons button').nth(2).click();
      await page.locator('.nav-buttons button').nth(2).click();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => document.querySelector('.month-title')?.textContent.includes('11月'));
      assert.ok(await page.locator('.day-cell:not(.muted)').first().innerText().then(t => t.includes('94')));
      slowCalendar = false;
      // Real store actions with delayed API responses verify stale response protection.
      await page.evaluate(async () => {
        const { useItemStore } = await import('/src/stores/itemStore.ts');
        const store = useItemStore();
        await Promise.all([store.fetchItems({ warehouseId: 1 }), store.fetchItems({ warehouseId: 2 })]);
        if (store.items.length !== 1 || store.items[0].shortId !== 'CAM-095') throw new Error('stale inventory response');
      });
    }
    await context.close();
    console.log(`Checked ${routes.length} routes at ${width}px`);
  }
} finally {
  await writeFile(new URL('results.json', output), JSON.stringify({ results, failures }, null, 2));
  await browser.close();
}
await writeFile(new URL('results.json', output), JSON.stringify({ results, failures }, null, 2));
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else console.log(`Mobile browser checks passed: ${results.length} route/viewport combinations plus interactions.`);
