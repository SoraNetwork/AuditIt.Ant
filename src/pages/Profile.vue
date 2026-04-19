<template>
  <div>
    <a-page-header title="我的信息" />
    <a-card :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-descriptions bordered :column="isMobile ? 1 : 3" :size="isMobile ? 'small' : 'default'">
        <a-descriptions-item label="用户名">{{ user?.name }}</a-descriptions-item>
        <a-descriptions-item label="DingTalk ID">{{ user?.dingTalkId }}</a-descriptions-item>
        <a-descriptions-item label="Corp ID">{{ user?.corpId }}</a-descriptions-item>
        <a-descriptions-item label="前端构建版本">
          <a-tag color="blue">{{ gitSha }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>
      <div v-if="isMobile" style="margin-top: 16px;">
        <a-button block danger @click="logout">退出登录</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useBreakpoint } from '../composables/useBreakpoint';

const { isMobile } = useBreakpoint();
const authStore = useAuthStore();
const router = useRouter();
const user = computed(() => authStore.user);

const gitSha = import.meta.env.VITE_GIT_SHA || 'N/A';

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
</style>
