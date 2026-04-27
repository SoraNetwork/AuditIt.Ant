<template>
  <div>
    <a-page-header :title="`物品详情: ${item?.shortId || ''}`" @back="router.back()">
      <template #extra>
        <div class="header-actions">
          <a-button @click="router.push({ name: 'item-edit', params: { id: item?.id } })">编辑</a-button>
          <a-tag :color="statusDisplay.color">{{ statusDisplay.text }}</a-tag>
        </div>
      </template>
    </a-page-header>

    <div class="page-container">
      <a-card :loading="itemStore.loading" :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <!-- Mobile: photo on top, then descriptions -->
        <div v-if="isMobile">
          <div class="mobile-photo-frame">
            <a-image v-if="photoFullUrl" :src="photoFullUrl" alt="物品图片" style="max-height: 240px; object-fit: cover; width: 100%;" />
            <a-empty v-else description="暂无图片" />
          </div>
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="物品名称">{{ item?.itemDefinitionName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所在仓库">{{ item?.warehouseName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="ShortId">{{ item?.shortId }}</a-descriptions-item>
            <a-descriptions-item label="SN">{{ item?.serialNumber || '-' }}</a-descriptions-item>
            <a-descriptions-item label="入库时间">{{ formatDateTime(item?.entryDate) }}</a-descriptions-item>
            <a-descriptions-item label="最后更新">{{ formatDateTime(item?.lastUpdated) }}</a-descriptions-item>
            <a-descriptions-item label="当前去向">
              <RentalReferenceText :text="item?.currentDestination || '-'" />
            </a-descriptions-item>
            <a-descriptions-item label="备注">{{ item?.remarks || '-' }}</a-descriptions-item>
            <a-descriptions-item label="UUID">{{ item?.id }}</a-descriptions-item>
          </a-descriptions>
        </div>
        <!-- Desktop: original layout -->
        <a-row v-else :gutter="16">
          <a-col :span="16">
            <a-descriptions bordered :column="2">
              <a-descriptions-item label="物品名称">{{ item?.itemDefinitionName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所在仓库">{{ item?.warehouseName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="ShortId">{{ item?.shortId }}</a-descriptions-item>
              <a-descriptions-item label="SN">{{ item?.serialNumber || '-' }}</a-descriptions-item>
              <a-descriptions-item label="入库时间">{{ formatDateTime(item?.entryDate) }}</a-descriptions-item>
              <a-descriptions-item label="最后更新">{{ formatDateTime(item?.lastUpdated) }}</a-descriptions-item>
              <a-descriptions-item label="当前去向" :span="2">
                <RentalReferenceText :text="item?.currentDestination || '-'" />
              </a-descriptions-item>
              <a-descriptions-item label="备注" :span="2">{{ item?.remarks || '-' }}</a-descriptions-item>
              <a-descriptions-item label="UUID" :span="2">{{ item?.id }}</a-descriptions-item>
            </a-descriptions>
          </a-col>
          <a-col :span="8">
            <a-image v-if="photoFullUrl" :width="200" :src="photoFullUrl" alt="物品图片" />
            <a-empty v-else description="暂无图片" />
          </a-col>
        </a-row>
      </a-card>

      <a-card title="平台挂载链接" style="margin-top: 16px" :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-space style="margin-bottom: 12px" :direction="isMobile ? 'vertical' : 'horizontal'" :style="isMobile ? { width: '100%' } : {}">
          <a-button type="primary" :block="isMobile" @click="openListingCreate">新增链接</a-button>
          <a-button :block="isMobile" @click="loadListings" :loading="listingStore.loading">刷新</a-button>
        </a-space>
        <a-table v-if="!isMobile" row-key="id" :columns="listingColumns" :data-source="currentListings" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'url'">
              <a :href="record.url" target="_blank" rel="noreferrer">{{ record.url }}</a>
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" @click="openListingEdit(record)">编辑</a-button>
                <a-popconfirm title="确认删除链接？" @confirm="deleteListing(record.id)">
                  <a-button type="link" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>

        <div v-else class="mobile-card-list">
          <MobileListCard v-for="l in currentListings" :key="l.id">
            <template #title>{{ l.platform }} · {{ l.title || '无标题' }}</template>
            <template #tags><a-tag>{{ l.status }}</a-tag></template>
            <template #meta>
              <div><a :href="l.url" target="_blank" rel="noreferrer" style="word-break: break-all">{{ l.url }}</a></div>
              <div v-if="l.remarks">备注：{{ l.remarks }}</div>
            </template>
            <template #footer>
              <a-button size="small" @click="openListingEdit(l)">编辑</a-button>
              <a-popconfirm title="确认删除链接？" @confirm="deleteListing(l.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </MobileListCard>
          <a-empty v-if="currentListings.length === 0" description="暂无链接" />
        </div>
      </a-card>

      <a-card class="lifecycle-card" title="生命周期日志" style="margin-top: 16px">
        <a-timeline>
          <a-timeline-item v-for="log in auditLogStore.logs" :key="log.id">
            <p><strong>{{ log.action }}</strong> - {{ formatDateTime(log.timestamp) }}</p>
            <p>操作人: {{ log.user }}</p>
            <p>仓库: {{ log.warehouseName }}</p>
            <p v-if="log.destination">目的地/原因: <RentalReferenceText :text="log.destination" /></p>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </div>

    <a-modal v-model:open="listingVisible" :title="listingEditingId ? '编辑链接' : '新增链接'" ok-text="保存" cancel-text="取消" @ok="saveListing">
      <a-form layout="vertical">
        <a-form-item label="平台" required>
          <a-select v-model:value="listingForm.platform">
            <a-select-option value="Xianyu">Xianyu</a-select-option>
            <a-select-option value="Taobao">Taobao</a-select-option>
            <a-select-option value="Xiaohongshu">Xiaohongshu</a-select-option>
            <a-select-option value="Other">Other</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="链接" required>
          <a-input v-model:value="listingForm.url" />
        </a-form-item>
        <a-form-item label="标题">
          <a-input v-model:value="listingForm.title" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="listingForm.status">
            <a-select-option value="Draft">Draft</a-select-option>
            <a-select-option value="Listed">Listed</a-select-option>
            <a-select-option value="Hidden">Hidden</a-select-option>
            <a-select-option value="Sold">Sold</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="listingForm.remarks" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useItemStore, type Item } from '../stores/itemStore';
import { useAuditLogStore } from '../stores/auditLogStore';
import { useItemListingStore, type ItemListing } from '../stores/itemListingStore';
import { STATUS_MAP } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';
import apiClient from '../services/api';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RentalReferenceText from '../components/RentalReferenceText.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const route = useRoute();
const router = useRouter();
const itemStore = useItemStore();
const auditLogStore = useAuditLogStore();
const listingStore = useItemListingStore();

const item = ref<Item | null>(null);

const listingVisible = ref(false);
const listingEditingId = ref<number | null>(null);
const listingForm = reactive({
  platform: 'Xianyu' as 'Xianyu' | 'Taobao' | 'Xiaohongshu' | 'Other',
  url: '',
  title: '',
  status: 'Listed' as 'Draft' | 'Listed' | 'Hidden' | 'Sold',
  remarks: '',
});

const listingColumns = [
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 120 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '链接', dataIndex: 'url', key: 'url' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
  { title: '操作', key: 'actions', width: 160 },
];

const currentListings = computed(() => {
  if (!item.value) return [];
  return listingStore.listings[item.value.id] || [];
});

const photoFullUrl = computed(() => {
  if (!item.value?.photoUrl) return null;
  const baseUrl = (apiClient.defaults.baseURL || '').replace(/\/api$/, '');
  return `${baseUrl}${item.value.photoUrl}`;
});

const statusDisplay = computed(() => {
  if (!item.value?.status) return { text: '未知', color: 'default' };
  return STATUS_MAP[item.value.status] || { text: '未知', color: 'default' };
});

const loadItem = async () => {
  const itemId = String(route.params.id);
  await itemStore.fetchItems({ id: itemId });
  item.value = itemStore.items[0] || null;
  if (item.value) {
    await Promise.all([
      auditLogStore.fetchLogs({ itemId }),
      loadListings(),
    ]);
  }
};

const loadListings = async () => {
  if (!item.value) return;
  await listingStore.fetchByItem(item.value.id);
};

const openListingCreate = () => {
  listingEditingId.value = null;
  listingForm.platform = 'Xianyu';
  listingForm.url = '';
  listingForm.title = '';
  listingForm.status = 'Listed';
  listingForm.remarks = '';
  listingVisible.value = true;
};

const openListingEdit = (record: ItemListing) => {
  listingEditingId.value = record.id;
  listingForm.platform = record.platform;
  listingForm.url = record.url;
  listingForm.title = record.title || '';
  listingForm.status = record.status;
  listingForm.remarks = record.remarks || '';
  listingVisible.value = true;
};

const saveListing = async () => {
  if (!item.value) return;
  if (!listingForm.url.trim()) {
    message.error('链接不能为空');
    return;
  }

  const payload = {
    platform: listingForm.platform,
    url: listingForm.url,
    title: listingForm.title || null,
    status: listingForm.status,
    remarks: listingForm.remarks || null,
  };

  if (listingEditingId.value) {
    await listingStore.updateListing(listingEditingId.value, payload);
    message.success('链接已更新');
  } else {
    await listingStore.createListing(item.value.id, payload);
    message.success('链接已创建');
  }

  listingVisible.value = false;
  await loadListings();
};

const deleteListing = async (id: number) => {
  if (!item.value) return;
  await listingStore.deleteListing(id, item.value.id);
  message.success('链接已删除');
};

onMounted(loadItem);
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mobile-photo-frame {
  text-align: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.lifecycle-card :deep(.ant-timeline-item-content p) {
  margin-bottom: 4px;
}

@media (max-width: 767.98px) {
  .page-container { padding: 0; }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.ant-btn) {
    flex: 1;
  }

  .mobile-photo-frame :deep(.ant-image) {
    display: block;
  }
}
</style>
