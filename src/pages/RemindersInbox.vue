<template>
  <div>
    <a-page-header title="提醒中心" sub-title="查看、处理和创建提醒。" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div v-if="isMobile" class="mobile-summary-grid reminder-summary">
        <div class="mobile-summary-card reminder-summary-card reminder-summary-card--unread">
          <div class="mobile-summary-label">未读</div>
          <div class="mobile-summary-value reminder-summary-number unread-text">{{ unreadCount }}</div>
        </div>
        <div class="mobile-summary-card reminder-summary-card">
          <div class="mobile-summary-label">已处理</div>
          <div class="mobile-summary-value reminder-summary-number">{{ readCount }}</div>
        </div>
        <div class="mobile-summary-card reminder-summary-card">
          <div class="mobile-summary-label">总数</div>
          <div class="mobile-summary-value reminder-summary-number">{{ sortedReminders.length }}</div>
        </div>
        <div class="mobile-summary-card reminder-summary-card reminder-summary-card--level">
          <div class="mobile-summary-label">最高级别</div>
          <div class="reminder-summary-level">
            <a-tag class="reminder-summary-tag" :color="highestLevelColor">{{ highestLevel }}</a-tag>
          </div>
        </div>
      </div>

      <a-space
        :direction="isMobile ? 'vertical' : 'horizontal'"
        class="reminder-actions"
        :style="isMobile ? { width: '100%' } : undefined"
      >
        <a-button type="primary" :block="isMobile" @click="openCreate">创建提醒</a-button>
        <a-button :block="isMobile" @click="refresh">刷新</a-button>
        <a-button
          :block="isMobile"
          :disabled="unreadCount === 0"
          @click="dismissAll"
        >
          全部忽略
        </a-button>
      </a-space>

      <a-list
        v-if="!isMobile"
        :loading="reminderStore.loading"
        item-layout="horizontal"
        :data-source="sortedReminders"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <a-space>
                  <span><RentalReferenceText :text="item.title" /></span>
                  <a-tag :color="levelColor(item.level)">{{ item.level }}</a-tag>
                  <a-tag v-if="!item.dismissedAt" color="orange">未读</a-tag>
                </a-space>
              </template>
              <template #description>
                <div>
                  <div>
                    <RentalReferenceText :text="item.message || '-'" />
                  </div>
                  <div class="reminder-meta">
                    <span>到期：{{ formatReminderDueAt(item) }}</span>
                    <span v-if="item.targetUser">接收人：{{ item.targetUser }}</span>
                    <span v-if="item.dismissedAt">已读：{{ formatDateTime(item.dismissedAt) }}</span>
                  </div>
                </div>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-button
                type="link"
                :disabled="!!item.dismissedAt"
                @click="dismiss(item.id)"
              >
                标记已读
              </a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>

      <div v-else>
        <a-skeleton :loading="reminderStore.loading" active :paragraph="{ rows: 4 }">
          <div v-if="sortedReminders.length > 0" class="mobile-card-list">
            <MobileListCard
              v-for="item in sortedReminders"
              :key="item.id"
              :active="!item.dismissedAt"
            >
              <template #title><RentalReferenceText :text="item.title" /></template>
              <template #tags>
                <a-tag :color="levelColor(item.level)">{{ item.level }}</a-tag>
                <a-tag v-if="!item.dismissedAt" color="orange">未读</a-tag>
              </template>
              <template #meta>
                <div><RentalReferenceText :text="item.message || '-'" /></div>
                <div>到期：{{ formatReminderDueAt(item) }}</div>
                <div v-if="item.targetUser">接收人：{{ item.targetUser }}</div>
                <div v-if="item.dismissedAt">已读：{{ formatDateTime(item.dismissedAt) }}</div>
              </template>
              <template #footer>
                <a-button
                  size="small"
                  :disabled="!!item.dismissedAt"
                  @click="dismiss(item.id)"
                >
                  标记已读
                </a-button>
              </template>
            </MobileListCard>
          </div>
          <a-empty v-else description="暂无提醒" />
        </a-skeleton>
      </div>
    </a-card>

    <a-modal
      v-model:open="createVisible"
      title="创建提醒"
      ok-text="创建"
      cancel-text="取消"
      @ok="createReminder"
    >
      <a-form layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item label="内容">
          <a-textarea v-model:value="form.message" :rows="3" />
        </a-form-item>
        <a-form-item label="级别">
          <a-select v-model:value="form.level">
            <a-select-option value="Info">Info</a-select-option>
            <a-select-option value="Warning">Warning</a-select-option>
            <a-select-option value="Critical">Critical</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="目标用户（可多选，留空为广播）">
          <a-select
            v-model:value="form.targetUsers"
            mode="multiple"
            allow-clear
            show-search
            option-filter-prop="label"
            :options="userOptions"
            placeholder="选择一个或多个用户"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import RentalReferenceText from '../components/RentalReferenceText.vue';
import { useBreakpoint } from '../composables/useBreakpoint';
import { useReminderStore, type Reminder, type ReminderType } from '../stores/reminderStore';
import { useUserStore } from '../stores/userStore';
import { formatDateTime } from '../utils/formatters';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const reminderStore = useReminderStore();
const userStore = useUserStore();
const createVisible = ref(false);

const form = reactive({
  title: '',
  message: '',
  level: 'Info' as 'Info' | 'Warning' | 'Critical',
  targetUsers: [] as string[],
});

const userOptions = computed(() =>
  userStore.users.map(u => ({ label: u.name, value: u.name }))
);

const sortedReminders = computed(() =>
  [...reminderStore.reminders].sort((a, b) => {
    if (!!a.dismissedAt !== !!b.dismissedAt) {
      return a.dismissedAt ? 1 : -1;
    }
    if (a.dismissedAt && b.dismissedAt) {
      return new Date(b.dismissedAt).getTime() - new Date(a.dismissedAt).getTime();
    }
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  })
);

const unreadCount = computed(() => reminderStore.unreadCount);
const readCount = computed(
  () => sortedReminders.value.filter(item => !!item.dismissedAt).length
);
const highestLevel = computed(() => {
  if (sortedReminders.value.some(item => item.level === 'Critical' && !item.dismissedAt)) {
    return 'Critical';
  }
  if (sortedReminders.value.some(item => item.level === 'Warning' && !item.dismissedAt)) {
    return 'Warning';
  }
  if (sortedReminders.value.length === 0) {
    return '-';
  }
  return 'Info';
});

const highestLevelColor = computed(() => {
  if (highestLevel.value === 'Critical') return 'red';
  if (highestLevel.value === 'Warning') return 'orange';
  if (highestLevel.value === 'Info') return 'blue';
  return 'default';
});

const levelColor = (level: string) => {
  if (level === 'Critical') return 'red';
  if (level === 'Warning') return 'orange';
  return 'blue';
};

const rentalReminderTypes: ReminderType[] = [
  'RentalShipmentSoon',
  'RentalDueSoon',
  'RentalOverdue',
  'RentalDeliveryUnsigned',
  'RentalReturnUnsigned',
];

const formatReminderDueAt = (item: Reminder) =>
  formatDateTime(item.dueAt, rentalReminderTypes.includes(item.type) ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss') || '-';

const refresh = async () => {
  await reminderStore.fetchReminders({ unreadOnly: false, limit: 200 });
};

const dismiss = async (id: number) => {
  await reminderStore.dismiss(id);
  message.success('已忽略');
};

const dismissAll = async () => {
  await reminderStore.dismissAll();
  message.success('已全部忽略');
};

const openCreate = async () => {
  if (userStore.users.length === 0) {
    await userStore.fetchUsers({ status: 'Active', limit: 200 });
  }
  createVisible.value = true;
};

const createReminder = async () => {
  if (!form.title.trim()) {
    message.error('请输入标题');
    return;
  }

  await reminderStore.createReminder({
    title: form.title,
    message: form.message,
    level: form.level,
    targetUsers: form.targetUsers,
  });

  form.title = '';
  form.message = '';
  form.level = 'Info';
  form.targetUsers = [];
  createVisible.value = false;
  message.success('创建成功');
  await refresh();
};

onMounted(async () => {
  await Promise.all([refresh(), userStore.fetchUsers({ status: 'Active', limit: 200 })]);
});
</script>

<style scoped>
.reminder-summary {
  margin-bottom: 16px;
}

.reminder-actions {
  margin-bottom: 16px;
}

.reminder-actions :deep(.ant-btn) {
  min-height: 40px;
}

.reminder-summary-card {
  min-height: 96px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.reminder-summary-card--unread {
  background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
  border-color: #fed7aa;
}

.reminder-summary-card--level {
  align-items: flex-start;
}

.reminder-summary-number {
  margin-top: 10px;
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.reminder-summary-level {
  margin-top: 10px;
}

.reminder-summary-tag {
  margin-inline-end: 0;
  padding-inline: 10px;
  border-radius: 999px;
  font-weight: 600;
}

.reminder-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.unread-text {
  color: #d97706;
}

@media (max-width: 767.98px) {
  .reminder-actions :deep(.ant-space-item) {
    width: 100%;
  }

  :deep(.ant-list-item) {
    padding: 12px 0;
  }

  :deep(.ant-list-item-action > li) {
    padding: 8px 12px;
  }
}
</style>
