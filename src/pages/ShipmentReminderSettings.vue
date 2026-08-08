<template>
  <div class="shipment-reminder-settings-page">
    <a-page-header title="发货通知设置" sub-title="预计发货日当天 12:00 向建单人、负责人和指定管理员发送提醒" />

    <div class="page-container">
      <a-alert
        :type="formState.aliyunCredentialsConfigured ? 'success' : 'warning'"
        show-icon
        :message="formState.aliyunCredentialsConfigured ? '阿里云 AccessKey 已由服务端安全配置。' : '尚未配置阿里云 AccessKey：请在服务端 AliyunNotification 配置节或密钥管理服务中设置。'"
        style="margin-bottom: 16px"
      />

      <a-spin :spinning="shipmentReminderStore.loading || userStore.loading">
        <a-form layout="vertical" :model="formState" @finish="save">
          <a-card title="发送规则" style="margin-bottom: 16px">
            <a-row :gutter="16">
              <a-col :xs="24" :md="8">
                <a-form-item label="启用自动提醒">
                  <a-switch v-model:checked="formState.enabled" checked-children="启用" un-checked-children="停用" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :md="4">
                <a-form-item label="短信发送时（中国时区）">
                  <a-input-number v-model:value="formState.sendHour" :min="0" :max="23" style="width: 100%" addon-after="时" />
                </a-form-item>
              </a-col>
              <a-col :xs="12" :md="4">
                <a-form-item label="发送分">
                  <a-input-number v-model:value="formState.sendMinute" :min="0" :max="59" style="width: 100%" addon-after="分" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-alert type="info" show-icon message="仅针对预计发货日为当天、仍未登记出库的待处理租赁单；建单人、负责人和指定管理员按手机号去重。" />
          </a-card>

          <a-card title="短信（DYSMS）" style="margin-bottom: 16px">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-switch v-model:checked="formState.smsEnabled" checked-children="短信已开启" un-checked-children="短信已关闭" />
              <a-alert type="info" show-icon message="模板和签名由阿里云直接读取。系统仅允许选择审核通过且内容、变量与本提醒完全匹配的模板。" />
              <a-space wrap>
                <a-button @click="loadSmsTemplates" :loading="templatesLoading" :disabled="!formState.aliyunCredentialsConfigured">从阿里云加载短信模板</a-button>
                <span v-if="formState.smsSignName">自动匹配签名：{{ formState.smsSignName }}</span>
              </a-space>
              <a-form-item label="已审核的发货提醒模板" required>
                <a-select
                  v-model:value="formState.smsTemplateCode"
                  placeholder="请从阿里云加载并选择模板"
                  :options="matchingSmsTemplateOptions"
                  :disabled="!formState.smsEnabled"
                  show-search
                  option-filter-prop="label"
                  @change="onSmsTemplateSelected"
                />
              </a-form-item>
              <a-table
                v-if="formState.templateVariables.length"
                :data-source="formState.templateVariables"
                :pagination="false"
                row-key="name"
                size="small"
              >
                <a-table-column title="模板变量" data-index="name" />
                <a-table-column title="取值来源">
                  <template #default="{ record }">
                    <a-select v-model:value="record.source" :options="variableSourceOptions" style="min-width: 200px" />
                  </template>
                </a-table-column>
                <a-table-column title="固定文本">
                  <template #default="{ record }">
                    <a-input v-if="record.source === 'StaticText'" v-model:value="record.staticValue" placeholder="填写固定值" />
                    <span v-else>按系统字段自动取值</span>
                  </template>
                </a-table-column>
              </a-table>
              <a-empty v-if="templatesLoaded && matchingSmsTemplateOptions.length === 0" description="未找到审核通过且完全匹配的阿里云短信模板" />
            </a-space>
          </a-card>

          <a-card title="语音（DYVMS）" style="margin-bottom: 16px">
            <a-space direction="vertical" style="width: 100%" :size="12">
              <a-switch v-model:checked="formState.voiceEnabled" checked-children="语音已开启" un-checked-children="语音已关闭" />
              <a-alert type="info" show-icon message="阿里云语音服务不提供模板列表 API。请填入已审核且变量与上方设置一致的 TTS 模板 Code；可通过下方测试发送验证。" />
              <a-row :gutter="16">
                <a-col :xs="12" :md="6">
                  <a-form-item label="语音发送时">
                    <a-input-number v-model:value="formState.voiceSendHour" :min="0" :max="23" :disabled="!formState.voiceEnabled" style="width: 100%" addon-after="时" />
                  </a-form-item>
                </a-col>
                <a-col :xs="12" :md="6">
                  <a-form-item label="语音发送分">
                    <a-input-number v-model:value="formState.voiceSendMinute" :min="0" :max="59" :disabled="!formState.voiceEnabled" style="width: 100%" addon-after="分" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :md="6">
                  <a-form-item label="语音 TTS Code" :required="formState.voiceEnabled">
                    <a-input v-model:value="formState.voiceTtsCode" placeholder="TTS_XXXXXXXX" :disabled="!formState.voiceEnabled" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :md="6">
                  <a-form-item label="外呼号码" :required="formState.voiceEnabled">
                    <a-input v-model:value="formState.voiceCalledShowNumber" placeholder="公共模式可留空；专属模式填写已购号码" :disabled="!formState.voiceEnabled" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-alert type="info" show-icon :message="`短信在 ${smsScheduleText} 发送；语音在 ${voiceScheduleText} 独立发送。`" />
            </a-space>
          </a-card>

          <a-card title="收件人和文案预览" style="margin-bottom: 16px">
            <a-form-item label="指定管理员">
              <a-select
                v-model:value="formState.administratorUserIds"
                mode="multiple"
                allow-clear
                placeholder="可选；会与建单人、负责人自动去重"
                :options="activeUserOptions"
              />
            </a-form-item>
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="审核文案">{{ selectedSmsTemplate?.templateContent || formState.templateBody }}</a-descriptions-item>
              <a-descriptions-item label="预览">{{ previewText }}</a-descriptions-item>
              <a-descriptions-item label="参数">变量由上方表格逐项映射，可选择订单、租客、日期、建单人、负责人或固定文本。</a-descriptions-item>
            </a-descriptions>
          </a-card>

          <a-space>
            <a-button type="primary" html-type="submit" :loading="shipmentReminderStore.loading">保存设置</a-button>
            <a-button @click="load">重新加载</a-button>
          </a-space>
        </a-form>
      </a-spin>

      <a-card title="测试发送" style="margin-top: 16px">
        <a-alert type="warning" show-icon message="测试会向所选员工的真实手机号发起短信或语音，请确认后再发送。" style="margin-bottom: 16px" />
        <a-form layout="vertical">
          <a-form-item label="测试接收人">
            <a-select v-model:value="testUserIds" mode="multiple" :options="activeUserOptions" placeholder="选择已维护手机号的员工" />
          </a-form-item>
          <a-space wrap>
            <a-checkbox v-model:checked="testSms">发送短信</a-checkbox>
            <a-checkbox v-model:checked="testVoice">发送语音</a-checkbox>
            <a-button type="primary" danger :loading="testSending" @click="sendTest">发送测试</a-button>
          </a-space>
        </a-form>
        <a-table v-if="testResults.length" :data-source="testResults" :pagination="false" row-key="key" size="small" style="margin-top: 16px">
          <a-table-column title="接收人" data-index="userName" />
          <a-table-column title="手机号" data-index="mobile" />
          <a-table-column title="通道" data-index="channel" />
          <a-table-column title="结果">
            <template #default="{ record }">
              <a-tag :color="record.success ? 'green' : 'red'">{{ record.success ? '成功' : '失败' }}</a-tag>
              <span v-if="record.error">{{ record.error }}</span>
              <span v-else-if="record.providerRequestId">请求 ID：{{ record.providerRequestId }}</span>
            </template>
          </a-table-column>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  useShipmentReminderStore,
  type ShipmentReminderSettings,
  type ShipmentReminderTemplateVariable,
  type ShipmentReminderTestResult,
} from '../stores/shipmentReminderStore';
import { useUserStore } from '../stores/userStore';

const shipmentReminderStore = useShipmentReminderStore();
const userStore = useUserStore();
const templatesLoading = ref(false);
const templatesLoaded = ref(false);
const testSending = ref(false);
const testUserIds = ref<string[]>([]);
const testSms = ref(true);
const testVoice = ref(false);
const testResults = ref<Array<ShipmentReminderTestResult & { key: string }>>([]);

const formState = reactive<ShipmentReminderSettings>({
  enabled: false,
  smsEnabled: true,
  voiceEnabled: false,
  sendHour: 12,
  sendMinute: 0,
  voiceSendHour: 12,
  voiceSendMinute: 30,
  templateVariables: [
    { name: 'order_id', source: 'OrderIdWithRenterName' },
    { name: 'time', source: 'RelativeExpectedShipDate' },
  ],
  smsSignName: null,
  smsTemplateCode: null,
  voiceTtsCode: null,
  voiceCalledShowNumber: null,
  administratorUserIds: [],
  templateBody: '您好，您的租赁订单 ${order_id} 应于 ${time} 发货，请您尽早发货，避免超时。',
  aliyunCredentialsConfigured: false,
});

const activeUserOptions = computed(() => userStore.users
  .filter(user => user.status === 'Active')
  .map(user => ({ value: user.id, label: `${user.name}${user.mobile ? `（${user.mobile}）` : '（未维护手机号）'}` })));

const matchingSmsTemplateOptions = computed(() => shipmentReminderStore.smsTemplates
  .filter(template => template.isApproved && template.matchesShipmentReminder)
  .map(template => ({
    value: template.templateCode,
    label: `${template.templateName || '未命名模板'} · ${template.templateCode}${template.signatureName ? ` · ${template.signatureName}` : ''}`,
  })));

const selectedSmsTemplate = computed(() => shipmentReminderStore.smsTemplates
  .find(template => template.templateCode === formState.smsTemplateCode));

function formatSchedule(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const smsScheduleText = computed(() => formatSchedule(Number(formState.sendHour) * 60 + Number(formState.sendMinute)));
const voiceScheduleText = computed(() => formatSchedule(Number(formState.voiceSendHour) * 60 + Number(formState.voiceSendMinute)));

const variableSourceOptions = [
  { value: 'OrderIdWithRenterName', label: '订单号 + 租客姓名' },
  { value: 'RentalNumber', label: '订单号' },
  { value: 'RenterName', label: '租客姓名' },
  { value: 'RelativeExpectedShipDate', label: '相对预计发货日（今天/昨天）' },
  { value: 'ExpectedShipDate', label: '预计发货日（完整日期）' },
  { value: 'Creator', label: '建单人' },
  { value: 'Responsible', label: '负责人' },
  { value: 'StaticText', label: '固定文本' },
];

const previewValues: Record<string, string> = {
  OrderIdWithRenterName: 'R20260808-0001 张三',
  RentalNumber: 'R20260808-0001',
  RenterName: '张三',
  RelativeExpectedShipDate: '今天',
  ExpectedShipDate: '2026年8月8日',
  Creator: '测试建单人',
  Responsible: '测试负责人',
};

const previewText = computed(() => {
  const body = selectedSmsTemplate.value?.templateContent || formState.templateBody;
  const variables = new Map(formState.templateVariables.map(variable => [variable.name, variable]));
  return body.replace(/\$\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_placeholder, name: string) => {
    const variable = variables.get(name);
    if (!variable) return _placeholder;
    return variable.source === 'StaticText'
      ? (variable.staticValue || '固定文本')
      : (previewValues[variable.source] || '示例值');
  });
});

function applySettings(settings: ShipmentReminderSettings) {
  Object.assign(formState, settings, {
    administratorUserIds: [...(settings.administratorUserIds || [])],
  });
}

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.response?.data?.title || error?.message || '操作失败';
}

async function load() {
  try {
    const [settings] = await Promise.all([
      shipmentReminderStore.fetchSettings(),
      userStore.fetchUsers({ status: 'Active', limit: 300 }),
    ]);
    applySettings(settings);
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function loadSmsTemplates() {
  templatesLoading.value = true;
  try {
    const templates = await shipmentReminderStore.fetchSmsTemplates();
    templatesLoaded.value = true;
    const selected = templates.find(template => template.templateCode === formState.smsTemplateCode);
    if (selected) applyTemplateVariables(selected.variableNames);
    message.success(`已加载 ${templates.length} 个阿里云短信模板`);
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    templatesLoading.value = false;
  }
}

function defaultVariableSource(name: string): ShipmentReminderTemplateVariable['source'] {
  if (name === 'order_id') return 'OrderIdWithRenterName';
  if (name === 'time') return 'RelativeExpectedShipDate';
  return 'StaticText';
}

function applyTemplateVariables(variableNames: string[]) {
  const existing = new Map(formState.templateVariables.map(variable => [variable.name, variable]));
  formState.templateVariables = variableNames.map(name => {
    const current = existing.get(name);
    return current
      ? { ...current }
      : { name, source: defaultVariableSource(name), staticValue: null };
  });
}

function onSmsTemplateSelected(templateCode: string) {
  const selected = shipmentReminderStore.smsTemplates.find(template => template.templateCode === templateCode);
  if (!selected) return;
  formState.smsSignName = selected.signatureName;
  applyTemplateVariables(selected.variableNames);
}

async function save() {
  try {
    const selected = shipmentReminderStore.smsTemplates.find(template => template.templateCode === formState.smsTemplateCode);
    if (selected) formState.smsSignName = selected.signatureName;
    const saved = await shipmentReminderStore.updateSettings(formState);
    applySettings(saved);
    message.success('发货通知设置已保存');
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function sendTest() {
  if (!testUserIds.value.length) {
    message.warning('请至少选择一位测试接收人');
    return;
  }
  if (!testSms.value && !testVoice.value) {
    message.warning('请至少选择短信或语音中的一种方式');
    return;
  }

  testSending.value = true;
  try {
    const results = await shipmentReminderStore.sendTest({
      userIds: testUserIds.value,
      sendSms: testSms.value,
      sendVoice: testVoice.value,
    });
    testResults.value = results.map((result, index) => ({ ...result, key: `${result.userName}-${result.channel}-${index}` }));
    message.success(`已完成 ${results.length} 条测试发送请求`);
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    testSending.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1180px;
}

@media (max-width: 767.98px) {
  .page-container {
    padding: 0;
  }
}
</style>
