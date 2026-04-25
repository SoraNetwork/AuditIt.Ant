<template>
  <div class="login-container">
    <a-card class="login-card" title="租一个铺">
      <p class="login-subtitle">请使用钉钉账号登录</p>

      <div v-if="status === 'loading'">
        <a-spin :tip="loadingMessage" size="large" />
      </div>

      <div v-else-if="status === 'error'">
        <a-result status="error" title="登录失败" :sub-title="errorMessage">
          <template #extra>
            <a-button type="primary" @click="retryLogin">重试</a-button>
          </template>
        </a-result>
      </div>

      <div v-else-if="status === 'requires-redirect'">
        <p style="text-align: center; margin-bottom: 24px;">请使用您的钉钉账号扫码或密码登录</p>
        <a-button type="primary" :loading="loading" block size="large" @click="redirectToDingtalkSSO">
          <template #icon><LoginOutlined /></template>
          使用钉钉登录
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LoginOutlined } from '@ant-design/icons-vue';
import { message as antMessage } from 'ant-design-vue';
import * as dd from 'dingtalk-jsapi';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

type Status = 'loading' | 'error' | 'requires-redirect' | 'success';

const loading = ref(false);
const status = ref<Status>('loading');
const loadingMessage = ref('正在检查登录环境...');
const errorMessage = ref<string | null>(null);

const authStore = useAuthStore();
const uiStore = useUiStore();
const route = useRoute();
const router = useRouter();

watch(
  () => uiStore.notification,
  notification => {
    if (notification?.show) {
      antMessage[notification.type](notification.message);
      uiStore.hideNotification();
    }
  },
  { deep: true }
);

const isDingtalkEnvironment = /DingTalk/.test(navigator.userAgent);

const handleLogin = async () => {
  status.value = 'loading';
  errorMessage.value = null;

  const { code } = route.query;
  if (typeof code === 'string' && code) {
    loadingMessage.value = '检测到授权码，正在登录...';
    try {
      await authStore.loginWithSsoCode(code);
      antMessage.success(`欢迎回来，${authStore.user?.name || '用户'}！`);
      status.value = 'success';
    } catch (err: any) {
      status.value = 'error';
      errorMessage.value = err.message || '登录失败，请重试';
    }
    return;
  }

  if (isDingtalkEnvironment) {
    loadingMessage.value = '检测到钉钉环境，正在尝试自动登录...';
    try {
      const corpId = import.meta.env.VITE_DINGTALK_CORP_ID;
      if (!corpId) throw new Error('钉钉 CorpId 未在 .env.local 中配置');

      dd.ready(async () => {
        const result = await dd.runtime.permission.requestAuthCode({ corpId });
        await authStore.loginWithLegacyCode(result.code);
        antMessage.success(`欢迎回来，${authStore.user?.name || '用户'}！`);
        status.value = 'success';
      });

      dd.error((err: any) => {
        status.value = 'error';
        errorMessage.value = `钉钉 JSAPI 配置错误：${JSON.stringify(err)}`;
      });
    } catch (err: any) {
      status.value = 'error';
      errorMessage.value = err.message || '登录失败，请重试';
    }
    return;
  }

  status.value = 'requires-redirect';
};

const redirectToDingtalkSSO = () => {
  loading.value = true;
  const clientId = import.meta.env.VITE_DINGTALK_APP_KEY;

  if (!clientId) {
    antMessage.error('钉钉应用 AppKey 未在 .env.local 中配置');
    loading.value = false;
    return;
  }

  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  const oauthUrl = `https://login.dingtalk.com/oauth2/auth?redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=openid&state=STATE&prompt=consent`;
  window.location.href = oauthUrl;
};

const retryLogin = () => {
  if (route.query.code) {
    router.replace({ query: {} });
  }
  handleLogin();
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
  max-width: calc(100vw - 32px);
  text-align: center;
}

.login-subtitle {
  margin-bottom: 24px;
  color: rgba(0, 0, 0, 0.45);
}

@media (max-width: 767.98px) {
  .login-container {
    padding: 16px;
    align-items: flex-start;
    padding-top: 15vh;
    height: 100dvh;
  }
}
</style>
