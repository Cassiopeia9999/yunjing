import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'  // 引入路由
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'  // 正确的样式导入方式
import store from './store'  // 导入 store
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
// 创建 Vue 应用实例
const app = createApp(App)

app.component('VueJsonPretty', VueJsonPretty);

// 使用路由和 ElementPlus 插件
app.use(router)  // 注册路由
app.use(ElementPlus)  // 注册 ElementPlus
app.use(store)  // 注册 Vuex store
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// 挂载应用
app.mount('#app')
