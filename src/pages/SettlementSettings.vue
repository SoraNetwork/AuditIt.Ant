<template>
  <div class="settlement-settings-page">
    <a-page-header title="设置结算单" sub-title="配置手动推送到钉钉群的结算比例" />

    <div class="page-container">
      <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
        <a-spin :spinning="settlementStore.loading">
          <a-form layout="vertical" :model="formState" @finish="save">
            <a-row :gutter="16">
              <a-col :xs="24" :md="6">
                <a-form-item label="技术比例">
                  <a-input-number
                    v-model:value="formState.technicianPercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    addon-after="%"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="6">
                <a-form-item label="建单比例">
                  <a-input-number
                    v-model:value="formState.creatorPercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    addon-after="%"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="6">
                <a-form-item label="发货人比例">
                  <a-input-number
                    v-model:value="formState.shipperPercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    addon-after="%"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="6">
                <a-form-item label="物品比例">
                  <a-input-number
                    v-model:value="formState.itemOwnerPercent"
                    :min="0"
                    :max="100"
                    :precision="1"
                    addon-after="%"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="默认到账账户">
              <a-input
                v-model:value="formState.defaultPaymentAccount"
                placeholder="建单时自动填写，可在租赁单中修改"
                :maxlength="100"
              />
            </a-form-item>

            <a-alert
              v-if="totalPercent > 100"
              type="error"
              show-icon
              message="比例合计不能超过 100%"
              style="margin-bottom: 16px"
            />

            <div class="preview">
              <div>结算单：R20260429-0002</div>
              <div>状态：已归还</div>
              <div>日期：2026-05-03 - 2026-05-05</div>
              <div>物品：1-2 / 佳能r6m2</div>
              <div>总价：￥200.0</div>
              <div>核算：￥175.0</div>
              <div v-if="formState.technicianPercent > 0">技术：{{ previewAmount(formState.technicianPercent) }}（{{ formState.technicianPercent }}%）</div>
              <div v-if="formState.creatorPercent > 0">建单（示例建单人）：{{ previewAmount(formState.creatorPercent) }}（{{ formState.creatorPercent }}%）</div>
              <div v-if="formState.shipperPercent > 0">发货人（示例发货人）：{{ previewAmount(formState.shipperPercent) }}（{{ formState.shipperPercent }}%）</div>
              <div v-if="formState.itemOwnerPercent > 0">物品所有（示例所有者）：{{ previewAmount(formState.itemOwnerPercent) }}（{{ formState.itemOwnerPercent }}%）</div>
            </div>

            <a-space>
              <a-button type="primary" html-type="submit" :disabled="totalPercent > 100" :loading="settlementStore.loading">
                保存
              </a-button>
              <a-button @click="load">刷新</a-button>
            </a-space>
          </a-form>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import { useSettlementStore, type SettlementSettings } from '../stores/settlementStore';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const settlementStore = useSettlementStore();

const formState = reactive({
  technicianPercent: 10,
  creatorPercent: 30,
  shipperPercent: 10,
  itemOwnerPercent: 50,
  defaultPaymentAccount: '',
});

const totalPercent = computed(() =>
  Number(formState.technicianPercent || 0)
  + Number(formState.creatorPercent || 0)
  + Number(formState.shipperPercent || 0)
  + Number(formState.itemOwnerPercent || 0)
);

const previewAmount = (percent: number) => (175 * Number(percent || 0) / 100).toFixed(1);

const applySettings = (settings: SettlementSettings) => {
  formState.technicianPercent = Number(settings.technicianPercent || 0);
  formState.creatorPercent = Number(settings.creatorPercent || 0);
  formState.shipperPercent = Number(settings.shipperPercent || 0);
  formState.itemOwnerPercent = Number(settings.itemOwnerPercent || 0);
  formState.defaultPaymentAccount = settings.defaultPaymentAccount || '';
};

const load = async () => {
  try {
    const settings = await settlementStore.fetchSettings();
    applySettings(settings);
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '获取结算单设置失败');
  }
};

const save = async () => {
  if (totalPercent.value > 100) {
    message.error('比例合计不能超过 100%');
    return;
  }

  try {
    const settings = await settlementStore.updateSettings(formState);
    applySettings(settings);
    message.success('结算单设置已保存');
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '保存结算单设置失败');
  }
};

onMounted(load);
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.preview {
  margin: 8px 0 16px;
  padding: 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcfe;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.8;
  white-space: pre-line;
}

@media (max-width: 767.98px) {
  .page-container {
    padding: 0;
  }
}
</style>
