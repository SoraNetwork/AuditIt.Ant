<template>
  <div>
    <a-page-header title="提醒中心" sub-title="查看和处理提醒" />
    <a-card>
      <a-space style="margin-bottom: 12px">
        <a-button type="primary" @click="openCreate">创建提醒</a-button>
        <a-button @click="refresh">刷新</a-button>
        <a-button :disabled="reminderStore.unreadCount === 0" @click="dismissAll">全部忽略</a-button>
      </a-space>

      <a-list :loading="reminderStore.loading" item-layout="horizontal" :data-source="reminderStore.reminders">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <a-space>
                  <span>{{ item.title }}</span>
                  <a-tag :color="levelColor(item.level)">{{ item.level }}</a-tag>
                  <a-tag v-if="!item.dismissedAt" color="orange">未读</a-tag>
                </a-space>
              </template>
              <template #description>
                <div>
                  <div>{{ item.message || '-' }}</div>
                  <div class="reminder-meta">
                    <span>到期：{{ formatDateTime(item.dueAt) || '-' }}</span>
                    <span v-if="item.targetUser">接收人：{{ item.targetUser }}</span>
                    <span v-if="item.dismissedAt">已读于 {{ formatDateTime(item.dismissedAt) }}</span>
                  </div>
                </div>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-button type="link" :disabled="!!item.dismissedAt" @click="dismiss(item.id)">已读</a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <a-modal v-model:open="createVisible" title="创建提醒" ok-text="创建" cancel-text="取消" @ok="createReminder">
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
import { useReminderStore } from '../stores/reminderStore';
import { useUserStore } from '../stores/userStore';
import { formatDateTime } from '../utils/formatters';

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

const levelColor = (level: string) => {
  if (level === 'Critical') return 'red';
  if (level === 'Warning') return 'orange';
  return 'blue';
};

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
.reminder-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}
</style>
