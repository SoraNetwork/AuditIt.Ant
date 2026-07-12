<template>
  <div class="finance-report-page">
    <a-page-header title="财务报表" sub-title="按租赁单创建时间统计核算金额" />

    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="report-toolbar">
        <a-range-picker v-model:value="range" :style="isMobile ? { width: '100%' } : undefined" />
        <a-space :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
          <a-button type="primary" :block="isMobile" :loading="reportStore.loading" @click="loadReports">查询</a-button>
          <a-button :block="isMobile" @click="exportReport">导出 XLSX</a-button>
        </a-space>
      </div>

      <a-spin :spinning="reportStore.loading">
        <a-tabs v-model:active-key="activeTab">
          <a-tab-pane key="summary" tab="简要">
            <div class="summary-grid" v-if="reportStore.summary">
              <div class="metric">
                <span>租赁单数</span>
                <strong>{{ reportStore.summary.rentalCount }}</strong>
              </div>
              <div class="metric">
                <span>订单总额</span>
                <strong>{{ formatMoney(reportStore.summary.totalOrderAmount) }}</strong>
              </div>
              <div class="metric">
                <span>核算金额</span>
                <strong>{{ formatMoney(reportStore.summary.accountedAmount) }}</strong>
              </div>
              <div class="metric">
                <span>运费合计</span>
                <strong>{{ formatMoney(reportStore.summary.totalShippingFee) }}</strong>
              </div>
              <div class="metric">
                <span>其他费用</span>
                <strong>{{ formatMoney(reportStore.summary.totalOtherFee) }}</strong>
              </div>
              <div class="metric">
                <span>押金合计</span>
                <strong>{{ formatMoney(reportStore.summary.totalDeposit) }}</strong>
              </div>
            </div>

            <a-table
              row-key="category"
              :columns="summaryColumns"
              :data-source="reportStore.summary?.categories || []"
              :pagination="false"
              size="small"
            />
          </a-tab-pane>

          <a-tab-pane key="detail" tab="详细">
            <a-table
              row-key="rentalId"
              :columns="detailColumns"
              :data-source="reportStore.details"
              :scroll="{ x: 1200 }"
              :pagination="{ pageSize: 20, showSizeChanger: true }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'rentalNumber'">
                  <router-link :to="`/rentals/${record.rentalId}`">{{ record.rentalNumber }}</router-link>
                </template>
                <template v-else-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
                <template v-else-if="column.key === 'range'">
                  {{ formatDate(record.startDate) }} ~ {{ formatDate(record.expectedEndDate) }}
                </template>
                <template v-else-if="column.key === 'status'">
                  {{ rentalStatusText(record.status) }}
                </template>
                <template v-else-if="column.key === 'renterName'">
                  <RenterLink :renter-id="record.renterId" :name="record.renterName" />
                </template>
                <template v-else-if="moneyColumns.includes(String(column.key))">
                  {{ formatMoney(record[column.key]) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useFinanceReportStore } from '../stores/financeReportStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { formatDateTime } from '../utils/formatters';
import { exportMultiSheetXlsx } from '../utils/xlsx';
import { rentalStatusText } from '../utils/rentalDisplay';
import { readQueryDay, readQueryString } from '../utils/routeQuery';
import RenterLink from '../components/RenterLink.vue';

const route = useRoute();
const router = useRouter();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const reportStore = useFinanceReportStore();
const reportTab = readQueryString(route.query.tab);
const activeTab = ref(reportTab === 'detail' ? 'detail' : 'summary');
const range = ref<[Dayjs, Dayjs]>([
  readQueryDay(route.query.start, dayjs().startOf('month')),
  readQueryDay(route.query.end, dayjs()),
]);

const moneyColumns = ['totalPrice', 'deposit', 'totalShippingFee', 'otherFee', 'accountedAmount'];

const summaryColumns = [
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '单数', dataIndex: 'count', key: 'count' },
  { title: '订单总额', dataIndex: 'totalOrderAmount', key: 'totalOrderAmount' },
  { title: '核算金额', dataIndex: 'accountedAmount', key: 'accountedAmount' },
];

const detailColumns = [
  { title: '租赁单号', dataIndex: 'rentalNumber', key: 'rentalNumber', width: 160, fixed: 'left' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '租客', dataIndex: 'renterName', key: 'renterName', width: 140 },
  { title: '租期', key: 'range', width: 210 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
  { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', width: 110 },
  { title: '押金', dataIndex: 'deposit', key: 'deposit', width: 110 },
  { title: '运费', dataIndex: 'totalShippingFee', key: 'totalShippingFee', width: 110 },
  { title: '其他费用', dataIndex: 'otherFee', key: 'otherFee', width: 110 },
  { title: '核算金额', dataIndex: 'accountedAmount', key: 'accountedAmount', width: 120 },
  { title: '物品数', dataIndex: 'itemCount', key: 'itemCount', width: 90 },
  { title: '负责人', dataIndex: 'assignedTo', key: 'assignedTo', width: 150 },
  { title: '平台订单号', dataIndex: 'platformOrderNo', key: 'platformOrderNo', width: 160 },
];

const formatDate = (value?: string | null) => formatDateTime(value, 'YYYY-MM-DD') || '';
const formatMoney = (value?: number | null) =>
  value === null || value === undefined ? '￥0.0' : `￥${Number(value).toFixed(1)}`;
const ownerShareExportLabel = (share: { ownerName?: string | null; itemShortId?: string | null; itemName?: string | null }) => {
  const ownerName = share.ownerName || '未指定所有人';
  return ownerName;
};

const syncReportQuery = async () => {
  await router.replace({
    query: {
      ...route.query,
      start: range.value?.[0]?.format('YYYY-MM-DD'),
      end: range.value?.[1]?.format('YYYY-MM-DD'),
      tab: activeTab.value,
    },
  });
};

const loadReports = async () => {
  try {
    await reportStore.fetchReports(range.value?.[0]?.toISOString(), range.value?.[1]?.toISOString());
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '获取财务报表失败');
  }
};

const exportReport = async () => {
  const hide = message.loading('正在准备导出数据...', 0);
  try {
    const summary = reportStore.summary;
    const summaryRows = summary
      ? [
          {
            租赁单数: summary.rentalCount,
            进行中单数: summary.activeRentalCount,
            已结束单数: summary.closedRentalCount,
            订单总额: summary.totalOrderAmount,
            押金合计: summary.totalDeposit,
            运费合计: summary.totalShippingFee,
            其他费用: summary.totalOtherFee,
            核算金额: summary.accountedAmount,
          },
          ...summary.categories.map(row => ({
            分类: row.category,
            单数: row.count,
            订单总额: row.totalOrderAmount,
            核算金额: row.accountedAmount,
          })),
        ]
      : [];

    const details = reportStore.details.map(row => ({
      租赁单号: row.rentalNumber,
      状态: rentalStatusText(row.status),
      租客: row.renterName || '',
      开始日期: formatDate(row.startDate),
      预计结束: formatDate(row.expectedEndDate),
      创建时间: formatDate(row.createdAt),
      总价: row.totalPrice,
      押金: row.deposit,
      运费: row.totalShippingFee,
      其他费用: row.otherFee,
      核算金额: row.accountedAmount,
      物品数: row.itemCount,
      负责人: row.assignedTo || '',
      平台订单号: row.platformOrderNo || '',
    }));

    // Fetch settlements for the third sheet
    const settlements = await reportStore.fetchSettlements(range.value?.[0]?.toISOString(), range.value?.[1]?.toISOString());

    // Aggregate statistics by person/category
    const personShares: Record<string, { creator: number; shipper: number; owner: number; tech: number; total: number }> = {};
    const getOrCreate = (name: string) => {
      if (!personShares[name]) {
        personShares[name] = { creator: 0, shipper: 0, owner: 0, tech: 0, total: 0 };
      }
      return personShares[name];
    };

    settlements.forEach(p => {
      if (p.creatorName) {
        const s = getOrCreate(p.creatorName);
        s.creator += p.creatorAmount;
        s.total += p.creatorAmount;
      }
      p.shipperShares?.forEach(sh => {
        const name = sh.shipperName || '未指定发货人';
        const s = getOrCreate(name);
        s.shipper += sh.amount;
        s.total += sh.amount;
      });
      p.ownerShares?.forEach(ow => {
        const name = ow.ownerName || '未指定所有人';
        const s = getOrCreate(name);
        s.owner += ow.amount;
        s.total += ow.amount;
      });
      if (p.technicianAmount > 0) {
        const s = getOrCreate('平台(技术)');
        s.tech += p.technicianAmount;
        s.total += p.technicianAmount;
      }
    });

    // Aggregated rows
    const aggregatedRows = Object.entries(personShares).map(([name, s]) => ({
      参与人: name,
      建单分账: Number(s.creator.toFixed(1)),
      发货分账: Number(s.shipper.toFixed(1)),
      物品所有分账: Number(s.owner.toFixed(1)),
      平台技术分账: Number(s.tech.toFixed(1)),
      合计分账: Number(s.total.toFixed(1)),
    }));

    // Detailed settlement rows
    const settlementDetailRows = settlements.map(row => ({
      租赁单号: row.rentalNumber,
      状态: rentalStatusText(row.status),
      总价: row.totalPrice,
      核算金额: row.accountedAmount,
      建单人: row.creatorName || '',
      建单分账金额: row.creatorAmount,
      发货人分账明细: (row.shipperShares || []).map(s => `${s.shipperName || '未指定'}: ${s.amount.toFixed(1)}`).join('; '),
      物品所有分账明细: (row.ownerShares || []).map(s => `${ownerShareExportLabel(s)}: ${s.amount.toFixed(1)}`).join('; '),
      平台技术分账金额: row.technicianAmount,
    }));

    await exportMultiSheetXlsx(
      [
        { name: '简要', rows: summaryRows },
        { name: '详细', rows: details },
        { name: '分账汇总', rows: aggregatedRows as any },
        { name: '分账明细', rows: settlementDetailRows as any },
      ],
      `财务报表-${dayjs().format('YYYY-MM-DD')}.xlsx`
    );
    message.success('导出成功');
  } catch (err: any) {
    message.error(err?.message || '导出失败');
  } finally {
    hide();
  }
};

watch(
  () => [
    range.value?.[0]?.format('YYYY-MM-DD') || '',
    range.value?.[1]?.format('YYYY-MM-DD') || '',
    activeTab.value,
  ],
  syncReportQuery
);

onMounted(loadReports);
</script>

<style scoped>
.finance-report-page {
  min-width: 0;
}

.report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  padding: 14px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcfe;
}

.metric span {
  display: block;
  color: #667085;
  font-size: 12px;
}

.metric strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 20px;
}

@media (max-width: 767.98px) {
  .report-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
