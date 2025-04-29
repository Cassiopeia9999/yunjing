import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'  // 引入路由
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css';  // 正确的样式导入方式


createApp(App)
    .use(router)  // 使用路由
    .mount('#app')