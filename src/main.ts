import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App);
const pinia = createPinia();

// 注入 router 实例
pinia.use(({ store }) => {
  store.router = router;
});

app.use(pinia);
app.use(router);
app.use(Antd);

app.mount('#app');
