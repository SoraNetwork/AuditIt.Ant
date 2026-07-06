<template>
  <div class="rental-create-page">
    <a-page-header
      title="新建租赁"
      sub-title="先创建租赁单，发货时再更新商品状态"
      @back="$router.back()"
    />

    <a-form layout="vertical" class="rental-create-form">
      <section class="rental-section">
        <div class="section-heading">
          <div>
            <div class="section-title">
              <TeamOutlined />
              <span>租客与负责人</span>
            </div>
            <div class="section-subtitle">手机号匹配、候选租客和负责人</div>
          </div>
          <a-button type="primary" ghost @click="openQuickCreate">
            <template #icon><UserAddOutlined /></template>
            快速建档
          </a-button>
        </div>

        <div class="tenant-layout">
          <div class="tenant-lookup-panel">
            <a-form-item
              label="租客手机号"
              required
              :help="renterLookupHelp"
              :validate-status="renterValidateStatus"
            >
              <a-input-search
                v-model:value="renterPhone"
                placeholder="输入完整或部分手机号"
                enter-button="搜索"
                :loading="renterSearching"
                allow-clear
                @search="searchRenterByPhone"
                @change="onPhoneInputChange"
              />
            </a-form-item>

            <div class="lookup-actions">
              <a-button :loading="renterSearching" @click="loadManualRenterList">
                <template #icon><SearchOutlined /></template>
                手动选择租客
              </a-button>
              <a-button v-if="matchedRenter" @click="clearMatchedRenter">更换租客</a-button>
            </div>

            <a-segmented
              v-if="phoneSearched"
              v-model:value="renterMatchView"
              block
              :options="renterMatchOptions"
              class="match-segmented"
            />
          </div>

          <div class="matched-renter-panel" :class="{ empty: !matchedRenter }">
            <template v-if="matchedRenter">
              <div class="matched-renter-top">
                <a-avatar class="matched-avatar">{{ matchedRenter.name.slice(0, 1) }}</a-avatar>
                <div class="matched-renter-main">
                  <div class="matched-name">
                    <RenterLink :renter-id="matchedRenter.id" :name="matchedRenter.name" />
                  </div>
                  <div class="matched-phone">{{ matchedRenter.phone || '未填写手机号' }}</div>
                </div>
                <a-tag color="success">已匹配</a-tag>
              </div>
              <div class="matched-renter-meta">
                <span v-if="matchedRenter.idCardNo">身份证号：{{ matchedRenter.idCardNo }}</span>
                <span v-if="matchedRenter.defaultAddress">默认地址：{{ matchedRenter.defaultAddress }}</span>
                <span v-if="getPlatformRemark(matchedRenter)">平台：{{ getPlatformRemark(matchedRenter) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="empty-renter-icon"><TeamOutlined /></div>
              <div class="empty-renter-title">未选择租客</div>
              <div class="empty-renter-text">搜索后可从下方候选列表选择</div>
            </template>
          </div>
        </div>

        <div v-if="phoneSearched && !matchedRenter" class="candidate-panel">
          <div class="candidate-header">
            <div>
              <div class="candidate-title">{{ renterCandidateTitle }}</div>
              <div class="candidate-count">{{ visibleRenterCandidates.length }} 位候选租客</div>
            </div>
            <a-button type="link" @click="openQuickCreate">新建租客</a-button>
          </div>

          <a-list
            v-if="visibleRenterCandidates.length > 0"
            size="small"
            :data-source="visibleRenterCandidates"
            :loading="renterSearching"
            class="renter-candidate-list"
          >
            <template #renderItem="{ item }">
              <a-list-item :key="item.id" class="renter-candidate-item">
                <div class="candidate-main">
                  <div class="candidate-name-line">
                    <span class="candidate-name"><RenterLink :renter-id="item.id" :name="item.name" /></span>
                    <a-tag>{{ getRenterMatchLabel(item) }}</a-tag>
                  </div>
                  <div class="candidate-meta">
                    <span>电话：{{ item.phone || '-' }}</span>
                    <span v-if="item.idCardNo">身份证号：{{ item.idCardNo }}</span>
                    <span v-if="item.defaultAddress">地址：{{ item.defaultAddress }}</span>
                  </div>
                </div>
                <a-button type="primary" size="small" @click="selectRenter(item)">使用</a-button>
              </a-list-item>
            </template>
          </a-list>

          <a-empty v-else description="暂无匹配租客">
            <a-button type="primary" @click="openQuickCreate">快速建档</a-button>
          </a-empty>
        </div>

        <a-row :gutter="16" class="assignee-row">
          <a-col :xs="24" :span="12">
            <a-form-item label="负责人（可多选）">
              <a-select
                v-model:value="assignedUsers"
                mode="multiple"
                allow-clear
                show-search
                option-filter-prop="label"
                :options="userOptions"
                placeholder="选择负责人"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </section>

      <section class="rental-section">
        <div class="section-heading">
          <div>
            <div class="section-title">
              <CalendarOutlined />
              <span>租赁信息</span>
            </div>
            <div class="section-subtitle">时间、价格、地址和备注</div>
          </div>
        </div>

        <a-row :gutter="16">
          <a-col :xs="24" :span="6">
            <a-form-item label="预计发货日期">
              <a-date-picker v-model:value="form.expectedShipDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="6">
            <a-form-item label="开始日期">
              <a-date-picker v-model:value="form.startDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="6">
            <a-form-item label="预计结束日期" required>
              <a-date-picker v-model:value="form.expectedEndDate" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="6">
            <a-form-item label="平台订单号">
              <a-input v-model:value="form.platformOrderNo" placeholder="可选" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :xs="24" :span="6">
            <a-form-item label="续租意愿">
              <a-switch v-model:checked="form.hasRenewalIntent" checked-children="是" un-checked-children="否" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="6">
            <a-form-item label="续租意愿至" :required="form.hasRenewalIntent">
              <a-date-picker
                v-model:value="form.renewalIntentEndDate"
                style="width: 100%"
                :disabled="!form.hasRenewalIntent"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :xs="24" :span="8">
            <a-form-item label="总价" required>
              <a-input-number
                v-model:value="form.totalPrice"
                :min="0"
                :step="0.1"
                :precision="1"
                style="width: 100%"
              >
                <template #prefix><DollarOutlined /></template>
              </a-input-number>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="8">
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
          <a-col :xs="24" :span="8">
            <a-form-item label="其他费用">
              <a-input-number
                v-model:value="form.otherFee"
                :min="0"
                :step="0.1"
                :precision="1"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :xs="24" :span="8">
            <a-form-item label="默认收货地址">
              <a-input v-model:value="form.shippingAddress" placeholder="填写物流收货地址" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :span="8">
            <a-form-item label="核算金额">
              <a-input :value="formatMoney(accountedAmount)" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注">
          <a-textarea v-model:value="form.notes" :rows="2" />
        </a-form-item>
      </section>

      <section class="rental-section">
        <div class="section-heading item-heading">
          <div>
            <div class="section-title">
              <ShoppingOutlined />
              <span>选择商品 / 物品定义</span>
            </div>
            <div class="section-subtitle" style="margin-top: 8px;">
              <a-radio-group v-model:value="selectionMode" size="small">
                <a-radio-button value="item">具体物品</a-radio-button>
                <a-radio-button value="definition">物品定义</a-radio-button>
              </a-radio-group>
            </div>
          </div>
          <div class="item-summary">
            <template v-if="selectionMode === 'item'">
              <a-tag>可选 {{ filteredSelectableItems.length }}</a-tag>
              <a-tag color="processing">已选 {{ selectedItemIds.length }}</a-tag>
            </template>
            <template v-else>
              <a-tag>已选种类 {{ Object.values(definitionQuantities).filter(q => q > 0).length }}</a-tag>
              <a-tag color="processing">已选总数 {{ totalSelectedDefinitionQuantity }}</a-tag>
            </template>
          </div>
        </div>

        <!-- 具体物品模式下的工具栏 -->
        <div v-if="selectionMode === 'item'" class="item-toolbar">
          <a-input-search
            v-model:value="itemKeyword"
            allow-clear
            placeholder="搜索商品 ID / 名称 / 分类 / 仓库 / 去向"
            class="item-search"
          />
          <a-select
            v-model:value="itemCategoryFilter"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="筛选分类"
            class="item-category-filter"
          >
            <a-select-option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id" :label="cat.name">
              {{ cat.name }}
            </a-select-option>
          </a-select>
          <a-button @click="loadSelectableItems">
            <template #icon><ReloadOutlined /></template>
            刷新商品
          </a-button>
        </div>

        <!-- 具体物品表格 -->
        <template v-if="selectionMode === 'item'">
          <a-table
            v-if="!isMobile"
            row-key="id"
            :loading="itemStore.loading"
            :data-source="filteredSelectableItems"
            :columns="itemColumns"
            :row-selection="{ selectedRowKeys: selectedItemIds, onChange: onItemSelectChange }"
            :pagination="{ pageSize: 20, showSizeChanger: true }"
            class="items-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'currentDestination'">
                <RentalReferenceText :text="record.currentDestination || '-'" />
              </template>
            </template>
          </a-table>

          <div v-else class="mobile-card-list">
            <a-skeleton :loading="itemStore.loading" active :paragraph="{ rows: 4 }">
              <MobileListCard
                v-for="item in filteredSelectableItems"
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
                  {{ item.shortId }} | {{ item.itemDefinition?.name || '未知商品' }}
                </template>
                <template #tags>
                  <a-tag :color="statusColor(item.status)">{{ statusText(item.status) }}</a-tag>
                </template>
                <template #meta>
                  <div>分类：{{ item.categoryName || '-' }}</div>
                  <div>仓库：{{ item.warehouse?.name || '-' }}</div>
                  <div>当前去向：<RentalReferenceText :text="item.currentDestination || '-'" /></div>
                  <div v-if="item.remarks">备注：{{ item.remarks }}</div>
                </template>
              </MobileListCard>
              <a-empty v-if="filteredSelectableItems.length === 0 && !itemStore.loading" description="暂无可选商品" />
            </a-skeleton>
          </div>
        </template>

        <!-- 物品定义选择（购物车模式） -->
        <template v-else>
          <!-- 搜索定义框 -->
          <div class="search-definition-box" style="margin-bottom: 24px; max-width: 600px;">
            <div style="font-weight: 500; margin-bottom: 8px; color: #4b5563;">搜索并添加物品定义到订单：</div>
            <a-select
              show-search
              placeholder="输入物品定义名称或 ID 搜索并选择..."
              option-filter-prop="label"
              :options="definitionSearchOptions"
              :loading="itemDefStore.loading"
              style="width: 100%"
              @select="handleSelectDefinition"
              :value="null"
            >
              <template #suffixIcon><SearchOutlined /></template>
            </a-select>
          </div>

          <!-- 已选物品定义（购物车） -->
          <div class="selected-definitions-cart">
            <div style="font-weight: 600; margin-bottom: 12px; font-size: 15px; color: #1f2937; display: flex; align-items: center; gap: 8px;">
              <ShoppingCartOutlined />
              <span>已添加的物品定义（清单）</span>
            </div>

            <a-table
              v-if="!isMobile"
              row-key="id"
              :data-source="selectedDefinitionCartItems"
              :columns="cartColumns"
              :pagination="false"
              class="cart-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'category'">
                  {{ categoryMap[record.categoryId] || '-' }}
                </template>
                <template v-else-if="column.key === 'quantity'">
                  <div class="quantity-input-group" style="display: flex; align-items: center; gap: 6px;">
                    <a-button size="small" @click="changeCartQty(record.id, -1)">-</a-button>
                    <a-input-number
                      v-model:value="definitionQuantities[record.id]"
                      :min="1"
                      :precision="0"
                      style="width: 80px; text-align: center;"
                      size="small"
                    />
                    <a-button size="small" @click="changeCartQty(record.id, 1)">+</a-button>
                  </div>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button type="link" danger size="small" @click="removeFromCart(record.id)">
                    <template #icon><DeleteOutlined /></template>
                    移除
                  </a-button>
                </template>
              </template>
            </a-table>

            <!-- 手机端购物车视图 -->
            <div v-else class="mobile-cart-list">
              <template v-if="selectedDefinitionCartItems.length > 0">
                <div
                  v-for="def in selectedDefinitionCartItems"
                  :key="def.id"
                  class="mobile-cart-card"
                  style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;"
                >
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <div style="font-weight: 600; color: #1e293b;">{{ def.name }}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        分类：{{ categoryMap[def.categoryId] || '-' }} | 单位：{{ def.unit || '-' }}
                      </div>
                    </div>
                    <a-button type="link" danger size="small" style="padding: 0;" @click="removeFromCart(def.id)">
                      移除
                    </a-button>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: #475569;">租赁数量：</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <a-button size="small" @click="changeCartQty(def.id, -1)">-</a-button>
                      <a-input-number
                        v-model:value="definitionQuantities[def.id]"
                        :min="1"
                        :precision="0"
                        style="width: 70px;"
                        size="small"
                      />
                      <a-button size="small" @click="changeCartQty(def.id, 1)">+</a-button>
                    </div>
                  </div>
                </div>
              </template>
              <a-empty
                v-else
                description="清单为空，请在上方搜索并添加物品定义"
              />
            </div>
          </div>
        </template>
      </section>

      <div v-if="!isMobile" class="desktop-action-bar">
        <a-space>
          <a-button type="primary" :loading="submitting" @click="submit">
            <template #icon><CheckCircleOutlined /></template>
            创建租赁
          </a-button>
          <a-button @click="$router.back()">取消</a-button>
        </a-space>
      </div>

      <div v-else class="mobile-action-bar">
        <a-button block @click="$router.back()">取消</a-button>
        <a-button type="primary" block :loading="submitting" @click="submit">创建租赁</a-button>
      </div>
      <div v-if="isMobile" class="mobile-selection-spacer"></div>
    </a-form>

    <a-drawer
      v-model:open="quickCreateVisible"
      title="快速建档 | 新租客"
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
        <a-form-item label="身份证号">
          <a-input v-model:value="quickForm.idCardNo" />
        </a-form-item>
        <a-form-item label="平台备注">
          <a-space wrap style="margin-bottom: 8px">
            <a-button
              v-for="template in PLATFORM_TEMPLATES"
              :key="template.key"
              size="small"
              @click="appendPlatformTemplateToQuickForm(template.key)"
            >
              {{ template.label }}
            </a-button>
          </a-space>
          <a-textarea
            v-model:value="quickForm.platformRemark"
            :rows="4"
            placeholder="点击上方快捷填写插入平台ID模板，例如：闲鱼_ID: xxx"
          />
        </a-form-item>
        <a-form-item label="默认地址">
          <a-textarea v-model:value="quickForm.defaultAddress" :rows="2" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="quickForm.notes" :rows="2" />
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="quick-create-footer">
          <a-button @click="quickCreateVisible = false">取消</a-button>
          <a-button type="primary" :loading="quickCreating" @click="submitQuickCreate">保存并使用</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons-vue';
import { useRentalStore, type CreateRentalPayload } from '../stores/rentalStore';
import { useRenterStore, type Renter } from '../stores/renterStore';
import RenterLink from '../components/RenterLink.vue';
import { useItemStore, getStatusText, type Item, type ItemStatus } from '../stores/itemStore';
import { useUserStore } from '../stores/userStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useItemDefinitionStore, type ItemDefinition } from '../stores/itemDefinitionStore';
import { useBreakpoint } from '../composables/useBreakpoint';
import { formatDateTime } from '../utils/formatters';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RentalReferenceText from '../components/RentalReferenceText.vue';
import {
  PLATFORM_TEMPLATES,
  appendPlatformTemplate,
  buildPlatformRemark,
  parsePlatformRemark,
  type PlatformFieldKey,
} from '../utils/renterPlatformNotes';

interface RentalScheduleConflict {
  rentalId: string;
  rentalNumber: string;
  rentalStatus: string;
  itemId: string;
  itemShortId: string;
  itemName: string;
  startDate: string;
  expectedEndDate: string;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  hasOutboundShipment: boolean;
  conflictReason?: string | null;
}

interface RentalCreateConflictResponse {
  message: string;
  pendingShipmentConflicts: RentalScheduleConflict[];
  shippedConflicts: RentalScheduleConflict[];
  returnPendingConflicts?: RentalScheduleConflict[];
}

type RenterMatchView = 'exact' | 'fuzzy' | 'manual';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const rentalStore = useRentalStore();
const renterStore = useRenterStore();
const itemStore = useItemStore();
const userStore = useUserStore();
const categoryStore = useCategoryStore();
const itemDefStore = useItemDefinitionStore();
const router = useRouter();

const renterPhone = ref('');
const renterSearching = ref(false);
const phoneSearched = ref(false);
const matchedRenter = ref<Renter | null>(null);
const renterMatchView = ref<RenterMatchView>('exact');

const selectionMode = ref<'item' | 'definition'>('item');
const selectedItemIds = ref<string[]>([]);
const definitionQuantities = reactive<Record<number, number>>({});
const submitting = ref(false);
const assignedUsers = ref<string[]>([]);
const itemKeyword = ref('');
const itemCategoryFilter = ref<number | undefined>();

const quickCreateVisible = ref(false);
const quickCreating = ref(false);
const quickForm = reactive({
  name: '',
  phone: '',
  idCardNo: '',
  platformRemark: '',
  defaultAddress: '',
  notes: '',
});

const form = reactive({
  shippingAddress: '',
  expectedShipDate: dayjs().subtract(1, 'day') as Dayjs,
  startDate: dayjs() as Dayjs,
  expectedEndDate: dayjs().add(7, 'day') as Dayjs,
  hasRenewalIntent: false,
  renewalIntentEndDate: null as Dayjs | null,
  totalPrice: 0,
  deposit: null as number | null,
  otherFee: 0,
  platformOrderNo: '',
  notes: '',
});

const accountedAmount = computed(() =>
  Number(form.totalPrice || 0) - Number(form.otherFee || 0)
);

const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '');

const normalizedRenterPhone = computed(() => normalizePhone(renterPhone.value));

const exactRenterMatches = computed(() => {
  const keyword = normalizedRenterPhone.value;
  if (!keyword) return [];
  return renterStore.renters.filter(renter => normalizePhone(renter.phone) === keyword);
});

const fuzzyRenterMatches = computed(() => {
  const keyword = normalizedRenterPhone.value;
  if (!keyword) return [];
  return renterStore.renters.filter(renter => {
    const phone = normalizePhone(renter.phone);
    return phone.includes(keyword) && phone !== keyword;
  });
});

const visibleRenterCandidates = computed(() => {
  if (renterMatchView.value === 'exact') return exactRenterMatches.value;
  if (renterMatchView.value === 'fuzzy') return fuzzyRenterMatches.value;
  return renterStore.renters;
});

const renterMatchOptions = computed(() => [
  { label: `精准 ${exactRenterMatches.value.length}`, value: 'exact' },
  { label: `模糊 ${fuzzyRenterMatches.value.length}`, value: 'fuzzy' },
  { label: `列表 ${renterStore.renters.length}`, value: 'manual' },
]);

const renterCandidateTitle = computed(() => {
  if (renterMatchView.value === 'exact') return '手机号精准匹配';
  if (renterMatchView.value === 'fuzzy') return '手机号模糊匹配';
  return '租客列表手动匹配';
});

const itemDefMap = computed(() =>
  itemDefStore.itemDefinitions.reduce((map: Record<number, ItemDefinition>, def) => {
    map[def.id] = def;
    return map;
  }, {})
);

const categoryMap = computed(() =>
  categoryStore.categories.reduce((map: Record<number, string>, category) => {
    map[category.id] = category.name;
    return map;
  }, {})
);

const resolveItemCategoryId = (item: Item) =>
  item.categoryId
  ?? item.itemDefinition?.categoryId
  ?? itemDefMap.value[item.itemDefinitionId]?.categoryId
  ?? null;

const resolveItemCategoryName = (item: Item) => {
  const categoryId = resolveItemCategoryId(item);
  return item.categoryName
    || item.itemDefinition?.category?.name
    || itemDefMap.value[item.itemDefinitionId]?.category?.name
    || (categoryId ? categoryMap.value[categoryId] : '')
    || '';
};

const selectableItems = computed(() =>
  itemStore.items
    .filter(item => item.status !== 'Disposed')
    .map(item => ({
      ...item,
      categoryId: resolveItemCategoryId(item),
      categoryName: resolveItemCategoryName(item),
    }))
);

const filteredSelectableItems = computed(() => {
  const keyword = itemKeyword.value.trim().toLowerCase();
  const categoryId = itemCategoryFilter.value;

  return selectableItems.value.filter(item => {
    if (categoryId && item.categoryId !== categoryId) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const fields = [
      item.shortId,
      item.itemDefinition?.name,
      item.itemDefinitionName,
      item.categoryName,
      item.warehouse?.name,
      item.warehouseName,
      item.currentDestination,
      item.remarks,
    ];

    return fields.some(field => (field || '').toLowerCase().includes(keyword));
  });
});


const totalSelectedDefinitionQuantity = computed(() => {
  return Object.values(definitionQuantities).reduce((sum, q) => sum + (q || 0), 0);
});

const definitionSearchOptions = computed(() => {
  return itemDefStore.itemDefinitions.map(def => ({
    value: def.id,
    label: `${def.name} / ${categoryMap.value[def.categoryId] || '无分类'} (ID: ${def.id})`
  }));
});

const selectedDefinitionCartItems = computed(() => {
  return itemDefStore.itemDefinitions.filter(def => {
    const qty = definitionQuantities[def.id];
    return qty !== undefined && qty > 0;
  });
});

const handleSelectDefinition = (defId: any) => {
  const id = Number(defId);
  if (definitionQuantities[id]) {
    definitionQuantities[id] += 1;
  } else {
    definitionQuantities[id] = 1;
  }
};

const changeCartQty = (defId: number, delta: number) => {
  const current = definitionQuantities[defId] || 0;
  const next = current + delta;
  if (next <= 0) {
    definitionQuantities[defId] = 0;
  } else {
    definitionQuantities[defId] = next;
  }
};

const removeFromCart = (defId: number) => {
  definitionQuantities[defId] = 0;
};

const userOptions = computed(() =>
  userStore.users.map(user => ({ label: user.name, value: user.name }))
);

const renterLookupHelp = computed(() => {
  if (matchedRenter.value) return '已匹配租客，可继续填写租赁信息。';
  if (phoneSearched.value) return '可从候选列表选择，或快速建档。';
  return '请输入手机号后搜索，支持完整号码和部分号码。';
});

const renterValidateStatus = computed<'' | 'success' | 'warning'>(() => {
  if (matchedRenter.value) return 'success';
  if (phoneSearched.value) return 'warning';
  return '';
});

const itemColumns = [
  { title: '商品 ID', dataIndex: 'shortId', key: 'shortId', width: 140 },
  { title: '名称', dataIndex: 'itemDefinitionName', key: 'itemDefinitionName' },
  { title: '分类', dataIndex: 'categoryName', key: 'categoryName', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName', width: 140 },
  { title: '当前去向', dataIndex: 'currentDestination', key: 'currentDestination', width: 220 },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

const cartColumns = [
  { title: '定义 ID', dataIndex: 'id', key: 'id', width: 100 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '分类', key: 'category', width: 180 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 100 },
  { title: '租赁数量', key: 'quantity', width: 200 },
  { title: '操作', key: 'action', width: 120 },
];

const getPlatformRemark = (record: Renter) => buildPlatformRemark(record);

const getRenterMatchLabel = (renter: Renter) => {
  const keyword = normalizedRenterPhone.value;
  const phone = normalizePhone(renter.phone);
  if (keyword && phone === keyword) return '手机号精准';
  if (keyword && phone.includes(keyword)) return '手机号模糊';
  return '列表候选';
};

const selectRenter = (renter: Renter) => {
  matchedRenter.value = renter;
  renterPhone.value = renter.phone || renterPhone.value;
  phoneSearched.value = true;

  if (renter.defaultAddress && !form.shippingAddress) {
    form.shippingAddress = renter.defaultAddress;
  }
};

const loadSelectableItems = async () => {
  await itemStore.fetchItems();
};

const onItemSelectChange = (keys: Array<string | number>) => {
  selectedItemIds.value = keys.map(key => String(key));
};

const toggleItemSelect = (id: string) => {
  const exists = selectedItemIds.value.includes(id);
  selectedItemIds.value = exists
    ? selectedItemIds.value.filter(itemId => itemId !== id)
    : [...selectedItemIds.value, id];
};

const onPhoneInputChange = () => {
  if (matchedRenter.value) {
    matchedRenter.value = null;
  }
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
    await renterStore.fetchRenters(phone, 50);
    phoneSearched.value = true;

    if (exactRenterMatches.value.length === 1) {
      selectRenter(exactRenterMatches.value[0]);
      renterMatchView.value = 'exact';
      return;
    }

    matchedRenter.value = null;
    if (exactRenterMatches.value.length > 1) {
      renterMatchView.value = 'exact';
    } else if (fuzzyRenterMatches.value.length > 0) {
      renterMatchView.value = 'fuzzy';
    } else {
      renterMatchView.value = 'manual';
    }
  } finally {
    renterSearching.value = false;
  }
};

const loadManualRenterList = async () => {
  renterSearching.value = true;
  try {
    await renterStore.fetchRenters(renterPhone.value.trim(), 80);
    phoneSearched.value = true;
    matchedRenter.value = null;
    renterMatchView.value = 'manual';
  } finally {
    renterSearching.value = false;
  }
};

const openQuickCreate = () => {
  quickForm.name = '';
  quickForm.phone = renterPhone.value.trim();
  quickForm.idCardNo = '';
  quickForm.platformRemark = '';
  quickForm.defaultAddress = '';
  quickForm.notes = '';
  quickCreateVisible.value = true;
};

const appendPlatformTemplateToQuickForm = (key: PlatformFieldKey) => {
  quickForm.platformRemark = appendPlatformTemplate(quickForm.platformRemark, key);
};

const submitQuickCreate = async () => {
  if (!quickForm.name.trim()) {
    message.error('请填写姓名');
    return;
  }

  quickCreating.value = true;
  try {
    const platformFields = parsePlatformRemark(quickForm.platformRemark);
    const created = await renterStore.createRenter({
      name: quickForm.name.trim(),
      phone: quickForm.phone.trim() || null,
      idCardNo: quickForm.idCardNo.trim() || null,
      ...platformFields,
      defaultAddress: quickForm.defaultAddress.trim() || null,
      notes: quickForm.notes.trim() || null,
    });

    selectRenter(created);
    renterMatchView.value = 'exact';

    quickCreateVisible.value = false;
    message.success('租客已创建');
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '创建租客失败');
  } finally {
    quickCreating.value = false;
  }
};

const statusText = (status: ItemStatus) => getStatusText(status);

const statusColor = (status: ItemStatus) => {
  if (status === 'InStock') return 'green';
  if (status === 'LoanedOut') return 'blue';
  if (status === 'SuspectedMissing') return 'orange';
  return 'default';
};

const formatDate = (value: string) => formatDateTime(value, 'YYYY-MM-DD') || '';
const toRentalDatePayload = (value?: Dayjs | null) => value?.format('YYYY-MM-DD');
const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) return '￥0.0';
  return `￥${Number(value).toFixed(1)}`;
};
const conflictEndText = (conflict: RentalScheduleConflict) => {
  const end = formatDate(conflict.expectedEndDate);
  if (conflict.hasRenewalIntent && conflict.renewalIntentEndDate) {
    return `${end}，续租意愿至 ${formatDate(conflict.renewalIntentEndDate)}`;
  }
  return end;
};

const buildCreatePayload = (allowScheduleConflict = false): CreateRentalPayload => {
  const itemIds = selectionMode.value === 'item' ? selectedItemIds.value : [];
  const itemDefinitionIds: number[] = [];
  if (selectionMode.value === 'definition') {
    Object.entries(definitionQuantities).forEach(([idStr, qty]) => {
      const qtyNum = Number(qty);
      const id = Number(idStr);
      if (qtyNum > 0) {
        for (let i = 0; i < qtyNum; i++) {
          itemDefinitionIds.push(id);
        }
      }
    });
  }

  return {
    renter: {
      renterId: matchedRenter.value?.id,
      name: matchedRenter.value?.name,
      phone: matchedRenter.value?.phone || undefined,
      idCardNo: matchedRenter.value?.idCardNo || undefined,
      defaultAddress: matchedRenter.value?.defaultAddress || undefined,
    },
    itemIds,
    itemDefinitionIds,
    startDate: toRentalDatePayload(form.startDate),
    expectedShipDate: toRentalDatePayload(form.expectedShipDate),
    expectedEndDate: toRentalDatePayload(form.expectedEndDate)!,
    hasRenewalIntent: form.hasRenewalIntent,
    renewalIntentEndDate: form.hasRenewalIntent ? toRentalDatePayload(form.renewalIntentEndDate) : null,
    totalPrice: Number(form.totalPrice || 0),
    deposit: form.deposit,
    otherFee: Number(form.otherFee || 0),
    shippingAddress: form.shippingAddress.trim() || undefined,
    platformOrderNo: form.platformOrderNo.trim() || undefined,
    notes: form.notes.trim() || undefined,
    assignedTo: assignedUsers.value.length ? assignedUsers.value.join(',') : undefined,
    allowScheduleConflict,
  };
};

const createRentalWithPayload = async (payload: CreateRentalPayload) => {
  const rental = await rentalStore.createRental(payload);
  message.success('创建成功');
  await router.push(`/rentals/${rental.id}`);
};

const showConflictModal = (payload: RentalCreateConflictResponse, originalPayload: CreateRentalPayload) => {
  const sections: string[] = [];

  if (payload.pendingShipmentConflicts.length > 0) {
    sections.push('未发货订单冲突：');
    payload.pendingShipmentConflicts.forEach(conflict => {
      const reason = conflict.conflictReason ? ` / ${conflict.conflictReason}` : '';
      sections.push(
        `- ${conflict.itemShortId} / ${conflict.itemName}：${conflict.rentalNumber}（${formatDate(conflict.startDate)} ~ ${conflictEndText(conflict)}）${reason}`
      );
    });
  }

  if (payload.shippedConflicts.length > 0) {
    if (sections.length > 0) {
      sections.push('');
    }
    sections.push('已发货订单冲突：');
    payload.shippedConflicts.forEach(conflict => {
      const reason = conflict.conflictReason ? ` / ${conflict.conflictReason}` : '';
      sections.push(
        `- ${conflict.itemShortId} / ${conflict.itemName}：${conflict.rentalNumber}（${formatDate(conflict.startDate)} ~ ${conflictEndText(conflict)}）${reason}`
      );
    });
  }

  if ((payload.returnPendingConflicts || []).length > 0) {
    if (sections.length > 0) {
      sections.push('');
    }
    sections.push('回货未签收冲突：');
    (payload.returnPendingConflicts || []).forEach(conflict => {
      const reason = conflict.conflictReason ? ` / ${conflict.conflictReason}` : '';
      sections.push(
        `- ${conflict.itemShortId} / ${conflict.itemName}：${conflict.rentalNumber}（${formatDate(conflict.startDate)} ~ ${conflictEndText(conflict)}）${reason}`
      );
    });
  }

  Modal.confirm({
    title: '所选商品存在租赁时间冲突',
    width: 720,
    okText: '确认创建',
    cancelText: '返回修改',
    content: h(
      'div',
      { style: 'white-space: pre-line; line-height: 1.8;' },
      [payload.message, '', ...sections].join('\n')
    ),
    async onOk() {
      submitting.value = true;
      try {
        await createRentalWithPayload({ ...originalPayload, allowScheduleConflict: true });
      } catch (err: any) {
        message.error(err?.response?.data || err?.message || '创建失败');
      } finally {
        submitting.value = false;
      }
    },
  });
};

const submit = async () => {
  if (!matchedRenter.value) {
    message.error('请先匹配租客，或快速建档创建新租客');
    return;
  }

  if (!form.expectedEndDate) {
    message.error('请选择预计结束日期');
    return;
  }

  if (form.hasRenewalIntent && !form.renewalIntentEndDate) {
    message.error('请选择续租意愿日期');
    return;
  }

  if (!form.expectedShipDate) {
    message.error('请选择预计发货日期');
    return;
  }

  if (selectionMode.value === 'item' && selectedItemIds.value.length === 0) {
    message.error('至少选择一件商品');
    return;
  }

  if (selectionMode.value === 'definition' && totalSelectedDefinitionQuantity.value === 0) {
    message.error('至少选择一个物品定义且数量大于0');
    return;
  }

  submitting.value = true;
  try {
    const payload = buildCreatePayload();
    await createRentalWithPayload(payload);
  } catch (err: any) {
    if (err?.response?.status === 409 && err?.response?.data) {
      showConflictModal(err.response.data as RentalCreateConflictResponse, buildCreatePayload());
      return;
    }

    message.error(err?.response?.data || err?.message || '创建失败');
  } finally {
    submitting.value = false;
  }
};

watch(
  () => form.hasRenewalIntent,
  hasRenewalIntent => {
    if (!hasRenewalIntent) {
      form.renewalIntentEndDate = null;
    } else if (!form.renewalIntentEndDate) {
      form.renewalIntentEndDate = form.expectedEndDate;
    }
  }
);

watch(
  () => form.startDate,
  (nextStart, previousStart) => {
    if (!nextStart) return;

    const currentShipDate = form.expectedShipDate?.format('YYYY-MM-DD');
    const previousDefaultShipDate = previousStart?.subtract(1, 'day').format('YYYY-MM-DD');
    if (!currentShipDate || currentShipDate === previousDefaultShipDate) {
      form.expectedShipDate = nextStart.subtract(1, 'day');
    }
  }
);

onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers({ status: 'Active', limit: 200 }),
    categoryStore.fetchCategories(),
    itemDefStore.fetchItemDefinitions(),
    loadSelectableItems(),
  ]);
});
</script>

<style scoped>
.rental-create-page {
  min-width: 0;
}

.rental-create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rental-section {
  padding: 20px;
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.section-title .anticon {
  color: #1677ff;
}

.section-subtitle {
  margin-top: 4px;
  color: #667085;
  font-size: 12px;
}

.tenant-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
  align-items: stretch;
}

.tenant-lookup-panel,
.matched-renter-panel,
.candidate-panel {
  border: 1px solid #e6eaf0;
  border-radius: 8px;
  background: #fbfcfe;
}

.tenant-lookup-panel {
  padding: 16px;
}

.tenant-lookup-panel :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.lookup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.match-segmented {
  margin-top: 12px;
}

.matched-renter-panel {
  padding: 16px;
  min-height: 138px;
}

.matched-renter-panel.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: #f8fafc;
}

.matched-renter-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.matched-avatar {
  flex: 0 0 auto;
  background: #1677ff;
}

.matched-renter-main {
  min-width: 0;
  flex: 1;
}

.matched-name {
  color: #111827;
  font-size: 17px;
  font-weight: 600;
  word-break: break-word;
}

.matched-phone {
  color: #667085;
  font-size: 13px;
  margin-top: 2px;
}

.matched-renter-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  color: #475467;
  font-size: 12px;
  word-break: break-word;
  white-space: pre-line;
}

.empty-renter-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #1677ff;
  background: #eaf3ff;
  font-size: 18px;
}

.empty-renter-title {
  margin-top: 10px;
  color: #1f2937;
  font-weight: 600;
}

.empty-renter-text {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
}

.candidate-panel {
  margin-top: 16px;
  padding: 12px;
}

.candidate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.candidate-title {
  color: #1f2937;
  font-weight: 600;
}

.candidate-count {
  color: #667085;
  font-size: 12px;
}

.renter-candidate-list {
  max-height: 320px;
  overflow: auto;
}

.renter-candidate-item {
  gap: 12px;
  padding-inline: 0 !important;
}

.candidate-main {
  min-width: 0;
  flex: 1;
}

.candidate-name-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.candidate-name {
  color: #1f2937;
  font-weight: 600;
}

.candidate-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 6px;
  color: #667085;
  font-size: 12px;
  word-break: break-word;
}

.assignee-row {
  margin-top: 16px;
}

.item-heading {
  align-items: center;
}

.item-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.item-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.item-search {
  max-width: 420px;
}

.item-category-filter {
  width: 180px;
}

.items-table {
  overflow: hidden;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
}

.desktop-action-bar {
  position: sticky;
  bottom: 0;
  z-index: 8;
  padding: 12px 0 4px;
  background: linear-gradient(180deg, rgba(245, 247, 250, 0), #f5f7fa 40%);
}

.quick-create-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.quick-create-footer .ant-btn {
  width: 100%;
}

@media (max-width: 991.98px) {
  .tenant-layout {
    grid-template-columns: 1fr;
  }

  .item-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .item-search {
    max-width: none;
  }

  .item-category-filter {
    width: 100%;
  }
}

@media (max-width: 767.98px) {
  .rental-create-form {
    gap: 12px;
  }

  .rental-section {
    padding: 14px;
    border-radius: 8px;
  }

  .section-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .section-heading > .ant-btn {
    width: 100%;
  }

  .lookup-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lookup-actions .ant-btn {
    min-width: 0;
  }

  .renter-candidate-item {
    align-items: flex-start;
  }

  .candidate-meta {
    flex-direction: column;
    gap: 4px;
  }

  .item-heading {
    align-items: stretch;
  }

  .item-summary {
    justify-content: flex-start;
  }
}
</style>
