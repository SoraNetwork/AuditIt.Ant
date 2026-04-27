<template>
  <div>
    <a-page-header title="用户管理" sub-title="维护用户状态和角色" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-space
        style="margin-bottom: 12px"
        :direction="isMobile ? 'vertical' : 'horizontal'"
        :style="isMobile ? { width: '100%', marginBottom: '12px' } : { marginBottom: '12px' }"
      >
        <a-input-search
          v-model:value="keyword"
          placeholder="姓名/钉钉ID"
          :style="isMobile ? { width: '100%' } : { width: '240px' }"
          @search="search"
        />
        <a-select
          v-model:value="status"
          allow-clear
          :style="isMobile ? { width: '100%' } : { width: '140px' }"
          placeholder="状态"
          @change="search"
        >
          <a-select-option value="Active">Active</a-select-option>
          <a-select-option value="Left">Left</a-select-option>
        </a-select>
        <a-button :block="isMobile" @click="search">查询</a-button>
        <a-popconfirm title="从钉钉通讯录同步员工，并按姓名重新匹配 userid？" @confirm="syncDingTalkUsers">
          <a-button :block="isMobile" :loading="syncing">同步钉钉通讯录</a-button>
        </a-popconfirm>
      </a-space>

      <a-table
        v-if="!isMobile"
        :loading="userStore.loading"
        row-key="id"
        :columns="columns"
        :data-source="userStore.users"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'Active' ? 'green' : 'red'">{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'dingTalkUserId'">
            {{ record.dingTalkUserId || record.lastDingTalkId || '-' }}
          </template>
          <template v-if="column.key === 'roles'">
            <a-space wrap>
              <a-tag v-for="r in record.roles" :key="r">{{ r }}</a-tag>
            </a-space>
          </template>
          <template v-if="column.key === 'lastLoginAt'">
            {{ formatDateTime(record.lastLoginAt) || '-' }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="toggleStatus(record)">{{ record.status === 'Active' ? '停用' : '启用' }}</a-button>
              <a-button type="link" @click="openRoleModal(record)">分配角色</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <a-skeleton :loading="userStore.loading" active :paragraph="{ rows: 4 }">
          <MobileListCard v-for="u in userStore.users" :key="u.id">
            <template #title>{{ u.name }}</template>
            <template #tags>
              <a-tag :color="u.status === 'Active' ? 'green' : 'red'">{{ u.status }}</a-tag>
            </template>
            <template #meta>
              <div v-if="u.roles.length > 0">
                角色：
                <a-tag v-for="r in u.roles" :key="r" style="margin-right: 4px">{{ r }}</a-tag>
              </div>
              <div>钉钉：{{ u.dingTalkUserId || u.lastDingTalkId || '-' }}</div>
              <div v-if="u.mobile">手机号：{{ u.mobile }}</div>
              <div>最近登录：{{ formatDateTime(u.lastLoginAt) || '-' }}</div>
            </template>
            <template #footer>
              <a-button size="small" @click="toggleStatus(u)">
                {{ u.status === 'Active' ? '停用' : '启用' }}
              </a-button>
              <a-button size="small" type="primary" @click="openRoleModal(u)">分配角色</a-button>
            </template>
          </MobileListCard>
          <a-empty v-if="userStore.users.length === 0 && !userStore.loading" description="暂无用户" />
        </a-skeleton>
      </div>
    </a-card>

    <a-modal v-model:open="roleVisible" title="分配角色" ok-text="保存" cancel-text="取消" @ok="saveRoles">
      <a-form layout="vertical">
        <a-form-item label="角色">
          <a-select v-model:value="selectedRoleIds" mode="multiple" :options="roleOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useUserStore, type AdminUser } from '../stores/userStore';
import { useRoleStore } from '../stores/roleStore';
import { formatDateTime } from '../utils/formatters';
import { useBreakpoint } from '../composables/useBreakpoint';
import MobileListCard from '../components/mobile/MobileListCard.vue';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const userStore = useUserStore();
const roleStore = useRoleStore();

const keyword = ref('');
const status = ref<'Active' | 'Left' | undefined>(undefined);
const roleVisible = ref(false);
const syncing = ref(false);
const currentUserId = ref<string | null>(null);
const selectedRoleIds = ref<number[]>([]);

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '状态', key: 'status', width: 120 },
  { title: '钉钉 UserId', key: 'dingTalkUserId', width: 180 },
  { title: '手机号', dataIndex: 'mobile', key: 'mobile', width: 140 },
  { title: '最近登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 200 },
  { title: '角色', key: 'roles' },
  { title: '操作', key: 'actions', width: 220 },
];

const roleOptions = computed(() => roleStore.roles.map(r => ({ value: r.id, label: r.name })));

const search = async () => {
  await userStore.fetchUsers({ keyword: keyword.value.trim() || undefined, status: status.value, limit: 300 });
};

const syncDingTalkUsers = async () => {
  syncing.value = true;
  try {
    const result = await userStore.syncDingTalkUsers({ deactivateMissing: false });
    message.success(`同步完成：拉取 ${result.pulled} 人，新增 ${result.created}，更新 ${result.updated}，自动离职 ${result.deactivated}`);
    if (result.skipped > 0) {
      message.warning(`有 ${result.skipped} 条记录被跳过，请检查姓名重复或异常数据`);
    }
    await search();
  } catch (err: any) {
    message.error(err?.response?.data?.error || err?.response?.data || err?.message || '同步失败');
  } finally {
    syncing.value = false;
  }
};

const toggleStatus = async (user: AdminUser) => {
  const nextStatus = user.status === 'Active' ? 'Left' : 'Active';
  await userStore.updateStatus(user.id, nextStatus);
  message.success('状态已更新');
  await search();
};

const openRoleModal = (user: AdminUser) => {
  currentUserId.value = user.id;
  selectedRoleIds.value = roleStore.roles
    .filter(r => user.roles.includes(r.name))
    .map(r => r.id);
  roleVisible.value = true;
};

const saveRoles = async () => {
  if (!currentUserId.value) return;
  await userStore.updateRoles(currentUserId.value, selectedRoleIds.value);
  message.success('角色已更新');
  roleVisible.value = false;
  await search();
};

onMounted(async () => {
  await Promise.all([roleStore.fetchRoles(), search()]);
});
</script>
