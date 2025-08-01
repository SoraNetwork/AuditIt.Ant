import { defineStore } from 'pinia';
import * as dd from 'dingtalk-jsapi';
import apiClient from '../services/api';
import router from '../router';

interface AuthState {
  token: string | null;
  user: Record<string, any> | null;
}

// 可靠的环境判断
const isDingtalk = /DingTalk/.test(navigator.userAgent);

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    // 统一的登录入口
    async login() {
      if (isDingtalk) {
        return this.loginWithDingtalkH5();
      } else {
        // 在桌面端，如果不在钉钉环境，我们不自动跳转，
        // 而是由 Login.vue 页面来决定显示二维码。
        // 因此这里可以留空或返回一个 resolved Promise。
        return Promise.resolve();
      }
    },

    // H5 免密登录 (钉钉环境内)
    async loginWithDingtalkH5() {
      return new Promise<void>((resolve, reject) => {
        dd.ready(() => {
          const corpId = import.meta.env.VITE_DINGTALK_CORP_ID;
          if (!corpId) {
            console.error('钉钉 CorpId 未配置!');
            return reject(new Error('钉钉 CorpId 未配置!'));
          }

          dd.runtime.permission.requestAuthCode({
            corpId: corpId
          }).then(async (result: { code: string }) => {
            try {
              await this.handleAuthSuccess(result.code);
              router.push('/'); // 登录成功后跳转
              resolve();
            } catch (error) {
              reject(error);
            }
          }).catch((err: any) => {
            console.error('钉钉H5授权失败:', err);
            reject(new Error(`钉钉H5授权失败: ${JSON.stringify(err)}`));
          });
        });
        dd.error((err: any) => {
            console.error('钉钉JSAPI配置错误:', err);
            reject(new Error(`钉钉JSAPI配置错误: ${JSON.stringify(err)}`));
        });
      });
    },
    
    // 调用后端验证并设置Token
    async handleAuthSuccess(code: string) {
      try {
        const response = await apiClient.post('/auth/dingtalk-login', { code });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        console.error('后端验证失败:', error);
        // 清除可能存在的无效 token
        this.logout(false); // 传入 false 避免重定向循环
        throw error;
      }
    },

    // 从 OAuth 回调页面调用
    async loginWithDingtalkCode(code: string) {
      await this.handleAuthSuccess(code);
      router.push('/');
    },

    logout(redirect = true) {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (redirect) {
        router.push('/login');
      }
    },
  },
});