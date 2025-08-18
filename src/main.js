// src/main.js
import { createApp } from 'vue'
import './style.css'
import '@/styles/table-override.css'
import '@/styles/dialog-override.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'                // 基础样式
import 'element-plus/theme-chalk/dark/css-vars.css' // ✅ 暗色变量样式（正确路径）
import store from './store'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

// 如果你用了 utils/theme，请保持：
import { initTheme } from '@/utils/theme'
initTheme()

const app = createApp(App)
app.component('VueJsonPretty', VueJsonPretty)
app.use(router).use(ElementPlus).use(store)
for (const [k, v] of Object.entries(ElementPlusIconsVue)) app.component(k, v)
app.mount('#app')
