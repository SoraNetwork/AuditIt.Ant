<template>
  <div class="login-container">
    <a-card class="login-card" title="登录到 SoraAuditIt 盘点系统">
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
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LoginOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const loading = ref(false);

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