<template>
  <div>
    <a-page-header title="我的信息" />
    <a-card>
      <a-descriptions bordered>
        <a-descriptions-item label="用户名">{{ user?.name }}</a-descriptions-item>
        <a-descriptions-item label="DingTalk ID">{{ user?.dingTalkId }}</a-descriptions-item>
        <a-descriptions-item label="Corp ID">{{ user?.corpId }}</a-descriptions-item>
        <a-descriptions-item label="前端构建版本">
          <a-tag color="blue">{{ gitSha }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const gitSha = import.meta.env.VITE_GIT_SHA || 'N/A';
</script>

<style scoped>
</style>
