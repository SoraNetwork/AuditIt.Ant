<template>
  <div class="login-container">
    <a-card class="login-card" title="登录到 盘一个库">
      <div v-if="status === 'loading'">
        <a-spin :tip="loadingMessage" size="large" />
      </div>
      <div v-else-if="status === 'error'">
         <a-result
            status="error"
            title="登录失败"
            :sub-title="errorMessage"
          >
            <template #extra>
              <a-button type="primary" @click="handleLogin">
                重试
              </a-button>
            </template>
          </a-result>
      </div>
      <div v-else-if="status === 'requires-redirect'">
        <p style="text-align: center; margin-bottom: 24px;">请使用您的钉钉账号扫码或密码登录</p>
        <a-button
          type="primary"
          @click="redirectToDingtalkSSO"
          :loading="loading"
          block
          size="large"
        >
          <template #icon><LoginOutlined /></template>
          使用钉钉登录
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { LoginOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../stores/authStore';
import * as dd from 'dingtalk-jsapi';

type Status = 'loading' | 'error' | 'requires-redirect' | 'success';

const loading = ref(false);
const status = ref<Status>('loading');
const loadingMessage = ref("正在检测登录环境...");
const errorMessage = ref<string | null>(null);

const authStore = useAuthStore();
const route = useRoute();

// 判断是否在钉钉环境
const isDingtalkEnvironment = /DingTalk/.test(navigator.userAgent);

const handleLogin = async () => {
  status.value = 'loading';
  errorMessage.value = null;

  // 1. 检查是否从 SSO 回调回来
  const { code } = route.query;
  if (typeof code === 'string' && code) {
    loadingMessage.value = "检测到授权码，正在登录...";
    try {
      await authStore.loginWithSsoCode(code);
      message.success(`欢迎回来, ${authStore.user?.name || '用户'}!`);
      status.value = 'success';
    } catch (err: any) {
      status.value = 'error';
      errorMessage.value = err.message || '使用 SSO 授权码登录失败。';
    }
    return;
  }

  // 2. 检查是否在钉钉客户端内
  if (isDingtalkEnvironment) {
    loadingMessage.value = "钉钉环境内，正在尝试自动登录...";
    try {
      const corpId = import.meta.env.VITE_DINGTALK_CORP_ID;
      if (!corpId) throw new Error('钉钉 CorpId 未在 .env.local 中配置');

      dd.ready(async () => {
        const result = await dd.runtime.permission.requestAuthCode({ corpId });
        await authStore.loginWithLegacyCode(result.code);
        message.success(`欢迎回来, ${authStore.user?.name || '用户'}!`);
        status.value = 'success';
      });
       dd.error((err: any) => {
          throw new Error(`钉钉JSAPI配置错误: ${JSON.stringify(err)}`);
      });
    } catch (err: any) {
      status.value = 'error';
      errorMessage.value = err.message || '钉钉免登失败。';
    }
    return;
  }

  // 3. 如果以上都不是，则需要用户手动触发 SSO
  status.value = 'requires-redirect';
};

const redirectToDingtalkSSO = () => {
  loading.value = true;
  const clientId = import.meta.env.VITE_DINGTALK_APP_KEY;

  if (!clientId) {
    message.error('钉钉应用 AppKey (ClientId) 未在 .env.local 中配置');
    loading.value = false;
    return;
  }

  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  // Correct URL and parameters for corporate web login
  const oauthUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=openid&state=STATE&prompt=consent`;
  
  window.location.href = oauthUrl;
};

onMounted(() => {
  handleLogin();
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