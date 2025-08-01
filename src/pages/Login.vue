<template>
  <div class="login-container">
    <a-card class="login-card" title="登录到 盘一个库">
      <div v-if="!isDingtalkEnvironment">
        <p style="text-align: center; margin-bottom: 24px;">请使用您的钉钉账号扫码登录</p>
        <a-button
          type="primary"
          @click="redirectToDingtalkOAuth"
          :loading="loading"
          block
          size="large"
        >
          <template #icon><LoginOutlined /></template>
          使用钉钉登录
        </a-button>
      </div>
      <div v-else>
        <a-spin tip="正在尝试钉钉内自动登录..." size="large" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { LoginOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../stores/authStore';

const loading = ref(false);
const authStore = useAuthStore();

// 计算属性，判断是否在钉钉环境
const isDingtalkEnvironment = computed(() => /DingTalk/.test(navigator.userAgent));

const redirectToDingtalkOAuth = () => {
  loading.value = true;
  const clientId = import.meta.env.VITE_DINGTALK_APP_KEY;

  if (!clientId) {
    message.error('钉钉应用AppKey未配置，请检查.env.local文件');
    loading.value = false;
    return;
  }

  const redirectUri = encodeURIComponent(`${window.location.origin}/dingtalk-oauth`);
  const oauthUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=openid&state=STATE&prompt=consent`;
  
  window.location.href = oauthUrl;
};

onMounted(() => {
  // 页面加载时，自动尝试登录
  authStore.login().catch(err => {
    // 如果在钉钉环境内自动登录失败，给出提示
    if (isDingtalkEnvironment.value) {
      message.error(`自动登录失败: ${err.message}`);
    }
    // 如果不在钉钉环境，则什么都不做，页面会显示登录按钮
  });
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.login-card {
  width: 450px;
  text-align: center;
}
</style>
