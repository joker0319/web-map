import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css';
import './assets/styles/tailwind.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

// 注册插件
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(pinia);
app.use(router);

// 挂载应用
app.mount('#app');
