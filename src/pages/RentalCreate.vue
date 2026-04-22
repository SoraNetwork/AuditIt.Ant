<template>
  <div>
    <a-page-header title="新建租赁" sub-title="创建租赁单并锁定物品" @back="$router.back()" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :span="12">
            <a-form-item label="租客手机号" required :help="renterLookupHelp" :validate-status="renterValidateStatus">
              <a-input-search
                v-model:value="renterPhone"
                placeholder="输入手机号匹配已有租客"
                enter-button="搜索"
                :loading="renterSearching"
                allow-clear
                @search="searchRenterByPhone"
                @change="onPhoneInputChange"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="12">
            <a-form-item label="负责人（可多选）">
              <a-select
                v-model:value="assignedUsers"
                mode="multiple"
                allow-clear
                show-search
                option-filter-prop="label"
                :options="userOptions"
                placeholder="选择一个或多个负责人"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert
          v-if="matchedRenter"
          type="success"
          show-icon
          style="margin-bottom: 16px"
          :message="`已匹配租客：${matchedRenter.name}${matchedRenter.phone ? ' (' + matchedRenter.phone + ')' : ''}`"
        >
          <template #action>
            <a-button size="small" type="link" @click="clearMatchedRenter">更换</a-button>
          </template>
        </a-alert>

        <a-row v-if="!matchedRenter && phoneSearched" :gutter="16" style="margin-bottom: 16px">
          <a-col :span="24">
            <a-alert type="warning" show-icon message="未找到该手机号对应的租客">
              <template #description>
                可直接
                <a-button type="link" size="small" style="padding: 0" @click="openQuickCreate">
                  快速建档
                </a-button>
                创建新租客。
              </template>
            </a-alert>
          </a-col>
        </a-row>

        <div v-if="isMobile" class="mobile-summary-grid">
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">租客匹配</div>
            <div class="mobile-summary-value">{{ matchedRenter?.name || '未匹配' }}</div>
          </div>
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">已选物品</div>
            <div class="mobile-summary-value">{{ selectedItemIds.length }} 件</div>
          </div>
        </div>

        <a-row :gutter="16">
          <a-col :xs="24" :span="8">
            <a-form-item label="默认地址">
              <a-input v-model:value="form.shippingAddress" placeholder="物品寄送地址" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="8">
            <a-form-item label="开始日期">
              <a-date-picker v-model:value="form.startDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="8">
            <a-form-item label="预计结束" required>
              <a-date-picker v-model:value="form.expectedEndDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :xs="24" :span="12">
            <a-form-item label="总价" required>
              <a-input-number
                v-model:value="form.totalPrice"
                :min="0"
                :step="0.1"
                :precision="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="12">
            <a-form-item label="押金">
              <a-input-number
                v-model:value="form.deposit"
                :min="0"
                :step="0.1"
                :precision="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-collapse v-if="isMobile" ghost style="margin-bottom: 12px;">
          <a-collapse-panel key="more" header="更多信息（备注）">
            <a-form-item label="备注">
              <a-textarea v-model:value="form.notes" :rows="2" />
            </a-form-item>
          </a-collapse-panel>
        </a-collapse>
        <a-form-item v-else label="备注">
          <a-textarea v-model:value="form.notes" :rows="2" />
        </a-form-item>

        <a-divider>选择物品（在库）</a-divider>

        <div v-if="isMobile" class="mobile-selection-toolbar">
          <div class="meta">
            <div class="title">在库物品 {{ itemStore.items.length }} 件</div>
            <div class="desc">刷新库存后，可直接点卡片勾选要加入租赁的物品。</div>
          </div>
          <div class="actions">
            <a-button @click="loadStockItems">刷新物品</a-button>
          </div>
        </div>

        <a-space v-else style="margin-bottom: 12px">
          <a-button @click="loadStockItems">刷新物品</a-button>
          <span>已选 {{ selectedItemIds.length }} 件</span>
        </a-space>

        <a-table
          v-if="!isMobile"
          row-key="id"
          :loading="itemStore.loading"
          :data-source="itemStore.items"
          :columns="itemColumns"
          :row-selection="{ selectedRowKeys: selectedItemIds, onChange: onItemSelectChange }"
          :pagination="{ pageSize: 20 }"
        />

        <div v-else class="mobile-card-list">
          <a-skeleton :loading="itemStore.loading" active :paragraph="{ rows: 4 }">
            <MobileListCard
              v-for="item in itemStore.items"
              :key="item.id"
              clickable
              :active="selectedItemIds.includes(item.id)"
              @click="toggleItemSelect(item.id)"
            >
              <template #title>
                <a-checkbox
                  :checked="selectedItemIds.includes(item.id)"
                  style="margin-right: 8px"
                  @click.stop="toggleItemSelect(item.id)"
                />
                {{ item.shortId }} · {{ item.itemDefinition?.name || '未知物品' }}
              </template>
              <template #meta>
                <div>仓库：{{ item.warehouse?.name || '-' }}</div>
                <div v-if="item.remarks">备注：{{ item.remarks }}</div>
              </template>
            </MobileListCard>
            <a-empty v-if="itemStore.items.length === 0 && !itemStore.loading" description="暂无在库物品" />
          </a-skeleton>
        </div>

        <a-divider v-if="!isMobile" />
        <a-space v-if="!isMobile">
          <a-button type="primary" :loading="submitting" @click="submit">创建租赁</a-button>
          <a-button @click="$router.back()">取消</a-button>
        </a-space>

        <!-- Mobile sticky action bar -->
        <div v-else class="mobile-action-bar">
          <a-button block @click="$router.back()">取消</a-button>
          <a-button type="primary" block :loading="submitting" @click="submit">创建租赁</a-button>
        </div>
        <div v-if="isMobile" class="mobile-selection-spacer"></div>
      </a-form>
    </a-card>

    <a-drawer
      v-model:open="quickCreateVisible"
      title="快速建档 · 新租客"
      :width="isMobile ? '90vw' : 420"
      :mask-closable="false"
    >
      <a-form layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model:value="quickForm.name" placeholder="租客姓名" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="quickForm.phone" />
        </a-form-item>
        <a-form-item label="默认地址">
          <a-textarea v-model:value="quickForm.defaultAddress" :rows="2" />
        </a-form-item>
        <a-form-item label="闲鱼ID">
          <a-input v-model:value="quickForm.xianyuId" />
        </a-form-item>
        <a-form-item label="淘宝ID">
          <a-input v-model:value="quickForm.taobaoId" />
        </a-form-item>
        <a-form-item label="小红书ID">
          <a-input v-model:value="quickForm.xiaohongshuId" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="quickForm.notes" :rows="2" />
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="quick-create-footer">
          <a-button @click="quickCreateVisible = false">取消</a-button>
          <a-button type="primary" :loading="quickCreating" @click="submitQuickCreate">
            保存并使用
          </a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useRentalStore } from '../stores/rentalStore';
import { useRenterStore, type Renter } from '../stores/renterStore';
import { useItemStore } from '../stores/itemStore';
import { useUserStore } from '../stores/userStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const rentalStore = useRentalStore();
const renterStore = useRenterStore();
const itemStore = useItemStore();
const userStore = useUserStore();
const router = useRouter();

const renterPhone = ref('');
const renterSearching = ref(false);
const phoneSearched = ref(false);
const matchedRenter = ref<Renter | null>(null);

const selectedItemIds = ref<string[]>([]);
const submitting = ref(false);

const assignedUsers = ref<string[]>([]);

const quickCreateVisible = ref(false);
const quickCreating = ref(false);
const quickForm = reactive({
  name: '',
  phone: '',
  defaultAddress: '',
  xianyuId: '',
  taobaoId: '',
  xiaohongshuId: '',
  notes: '',
});

const form = reactive({
  shippingAddress: '',
  startDate: dayjs() as Dayjs,
  expectedEndDate: dayjs().add(7, 'day') as Dayjs,
  totalPrice: 0,
  deposit: null as number | null,
  notes: '',
});

const userOptions = computed(() =>
  userStore.users.map(u => ({ label: u.name, value: u.name }))
);

const renterLookupHelp = computed(() => {
  if (matchedRenter.value) return '已匹配租客，可继续填写其他信息';
  if (phoneSearched.value) return '未匹配到租客，可快速建档';
  return '先输入手机号搜索租客，没有可快速建档';
});

const renterValidateStatus = computed<'' | 'success' | 'warning'>(() => {
  if (matchedRenter.value) return 'success';
  if (phoneSearched.value) return 'warning';
  return '';
});

const itemColumns = [
  { title: 'ShortId', dataIndex: 'shortId', key: 'shortId', width: 140 },
  { title: '物品名称', dataIndex: 'itemDefinitionName', key: 'itemDefinitionName' },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName', width: 150 },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

const loadStockItems = async () => {
  await itemStore.fetchItems({ status: 'InStock' });
};

const onItemSelectChange = (keys: (string | number)[]) => {
  selectedItemIds.value = keys.map(k => String(k));
};

const toggleItemSelect = (id: string) => {
  const idx = selectedItemIds.value.indexOf(id);
  if (idx === -1) {
    selectedItemIds.value = [...selectedItemIds.value, id];
  } else {
    const next = [...selectedItemIds.value];
    next.splice(idx, 1);
    selectedItemIds.value = next;
  }
};

const onPhoneInputChange = () => {
  if (matchedRenter.value) matchedRenter.value = null;
  phoneSearched.value = false;
};

const clearMatchedRenter = () => {
  matchedRenter.value = null;
  phoneSearched.value = false;
  renterPhone.value = '';
  form.shippingAddress = '';
};

const searchRenterByPhone = async () => {
  const phone = renterPhone.value.trim();
  if (!phone) {
    message.warning('请输入手机号');
    return;
  }
  renterSearching.value = true;
  try {
    await renterStore.fetchRenters(phone, 20);
    const hit =
      renterStore.renters.find(r => (r.phone || '').trim() === phone) ||
      renterStore.renters.find(r => (r.phone || '').includes(phone));
    phoneSearched.value = true;
    if (hit) {
      matchedRenter.value = hit;
      if (hit.defaultAddress && !form.shippingAddress) {
        form.shippingAddress = hit.defaultAddress;
      }
    } else {
      matchedRenter.value = null;
    }
  } finally {
    renterSearching.value = false;
  }
};

const openQuickCreate = () => {
  quickForm.name = '';
  quickForm.phone = renterPhone.value.trim();
  quickForm.defaultAddress = '';
  quickForm.xianyuId = '';
  quickForm.taobaoId = '';
  quickForm.xiaohongshuId = '';
  quickForm.notes = '';
  quickCreateVisible.value = true;
};

const submitQuickCreate = async () => {
  if (!quickForm.name.trim()) {
    message.error('请填写姓名');
    return;
  }
  quickCreating.value = true;
  try {
    const created = await renterStore.createRenter({
      name: quickForm.name.trim(),
      phone: quickForm.phone.trim() || null,
      defaultAddress: quickForm.defaultAddress.trim() || null,
      xianyuId: quickForm.xianyuId.trim() || null,
      taobaoId: quickForm.taobaoId.trim() || null,
      xiaohongshuId: quickForm.xiaohongshuId.trim() || null,
      notes: quickForm.notes.trim() || null,
    });
    matchedRenter.value = created;
    renterPhone.value = created.phone || renterPhone.value;
    phoneSearched.value = true;
    if (created.defaultAddress && !form.shippingAddress) {
      form.shippingAddress = created.defaultAddress;
    }
    quickCreateVisible.value = false;
    message.success('租客已创建');
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '创建租客失败');
  } finally {
    quickCreating.value = false;
  }
};

const submit = async () => {
  if (!matchedRenter.value) {
    message.error('请先通过手机号匹配租客，或快速建档创建新租客');
    return;
  }
  if (!form.expectedEndDate) {
    message.error('请选择预计结束日期');
    return;
  }
  if (selectedItemIds.value.length === 0) {
    message.error('至少选择一件物品');
    return;
  }

  submitting.value = true;
  try {
    const rental = await rentalStore.createRental({
      renter: {
        renterId: matchedRenter.value.id,
        name: matchedRenter.value.name,
        phone: matchedRenter.value.phone || undefined,
        defaultAddress: matchedRenter.value.defaultAddress || undefined,
      },
      itemIds: selectedItemIds.value,
      startDate: form.startDate?.toISOString(),
      expectedEndDate: form.expectedEndDate.toISOString(),
      totalPrice: Number(form.totalPrice || 0),
      deposit: form.deposit,
      shippingAddress: form.shippingAddress || undefined,
      notes: form.notes || undefined,
      assignedTo: assignedUsers.value.length ? assignedUsers.value.join(',') : undefined,
    });

    message.success('创建成功');
    await router.push(`/rentals/${rental.id}`);
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '创建失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([userStore.fetchUsers({ status: 'Active', limit: 200 }), loadStockItems()]);
});
</script>

<style scoped>
.quick-create-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.quick-create-footer .ant-btn {
  width: 100%;
}
</style>
