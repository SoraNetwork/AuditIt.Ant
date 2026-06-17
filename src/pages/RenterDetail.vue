<template>
  <div class="renter-detail-page">
    <a-page-header :title="`租客详情 ${renter?.name || ''}`" @back="$router.back()" />

    <a-card :loading="loading" :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-empty v-if="!loading && !renter" description="未找到租客" />
      <template v-else-if="renter">
        <a-descriptions bordered :column="isMobile ? 1 : 2">
          <a-descriptions-item label="姓名">{{ renter.name || '-' }}</a-descriptions-item>
          <a-descriptions-item label="电话">{{ renter.phone || '-' }}</a-descriptions-item>
          <a-descriptions-item label="身份证号">{{ renter.idCardNo || '-' }}</a-descriptions-item>
          <a-descriptions-item label="平台备注">
            <span class="multiline">{{ platformRemark || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="默认地址" :span="isMobile ? 1 : 2">
            <span class="multiline">{{ renter.defaultAddress || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="备注" :span="isMobile ? 1 : 2">
            <span class="multiline">{{ renter.notes || '-' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(renter.createdAt) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDate(renter.lastUpdated) || '-' }}</a-descriptions-item>
        </a-descriptions>
      </template>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { useRenterStore, type Renter } from '../stores/renterStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { buildPlatformRemark } from '../utils/renterPlatformNotes';
import { formatDateTime } from '../utils/formatters';

const route = useRoute();
const renterStore = useRenterStore();
const { shouldUseMobileLayout: isMobile } = useBreakpoint();

const loading = ref(false);
const renter = ref<Renter | null>(null);

const routeId = computed(() => {
  const raw = route.params.id;
  return Array.isArray(raw) ? raw[0] : String(raw || '');
});

const platformRemark = computed(() => renter.value ? buildPlatformRemark(renter.value) : '');
const formatDate = (value?: string | null) => formatDateTime(value) || '';

const load = async () => {
  if (!routeId.value) {
    renter.value = null;
    return;
  }

  loading.value = true;
  try {
    renter.value = await renterStore.getRenter(routeId.value);
  } catch (err: any) {
    renter.value = null;
    message.error(err?.response?.data || err?.message || '获取租客失败');
  } finally {
    loading.value = false;
  }
};

watch(routeId, load, { immediate: true });
</script>

<style scoped>
.renter-detail-page {
  min-width: 0;
}

.multiline {
  white-space: pre-line;
}
</style>
