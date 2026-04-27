<template>
  <div>
    <a-page-header title="我的信息" sub-title="查看当前登录账号与构建版本。" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <template v-if="isMobile">
        <div class="profile-hero">
          <div class="profile-avatar">{{ userInitial }}</div>
          <div class="profile-hero-main">
            <div class="profile-name">{{ user?.name || '-' }}</div>
            <div class="profile-sub">DingTalk ID：{{ user?.dingTalkId || '-' }}</div>
          </div>
        </div>

        <div class="mobile-summary-grid profile-summary">
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">Corp ID</div>
            <div class="mobile-summary-value">{{ user?.corpId || '-' }}</div>
          </div>
          <div class="mobile-summary-card">
            <div class="mobile-summary-label">构建版本</div>
            <div class="mobile-summary-value">{{ gitSha }}</div>
          </div>
        </div>
        <a-button block danger @click="logout">退出登录</a-button>
      </template>

      <template v-else>
        <div class="profile-desktop">
          <a-descriptions bordered :column="3">
            <a-descriptions-item label="用户名">{{ user?.name }}</a-descriptions-item>
            <a-descriptions-item label="DingTalk ID">{{ user?.dingTalkId }}</a-descriptions-item>
            <a-descriptions-item label="Corp ID">{{ user?.corpId }}</a-descriptions-item>
            <a-descriptions-item label="前端构建版本">
              <a-tag color="blue">{{ gitSha }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <div class="profile-actions">
            <a-button danger @click="logout">退出登录</a-button>
          </div>
        </div>
      </template>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBreakpoint } from '../composables/useBreakpoint';
import { useAuthStore } from '../stores/authStore';

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const authStore = useAuthStore();
const router = useRouter();
const user = computed(() => authStore.user);
const userInitial = computed(() => user.value?.name?.slice(0, 1) || '我');

const gitSha = import.meta.env.VITE_GIT_SHA || 'N/A';

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%);
  border: 1px solid #dbeafe;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  flex-shrink: 0;
}

.profile-hero-main {
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

.profile-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #667085;
  word-break: break-word;
}

.profile-summary {
  margin-bottom: 12px;
}

.profile-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
