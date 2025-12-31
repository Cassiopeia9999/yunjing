import { createRouter, createWebHistory } from 'vue-router'

// 1. 布局组件
import OutLayout from '@/components/layouts/OutLayout.vue'
import InnerLayout from '@/components/layouts/InnerLayout.vue'
import FullscreenLayout from '@/components/layouts/FullscreenLayout.vue'

// 2. 页面组件引入
// [关键修改] Home 现在是新的“平台门户页”
import PortalHome from '@/views/Home.vue'

// [关键修改] 原来的 Home 改名为 BridgeHome，作为桥梁子系统的首页
import BridgeHome from '@/views/bridge/BridgeHome.vue'

// 桥梁系统的具体工具页面
import RadioMonitor from '@/views/bridge/RadioMonitor.vue'
import EzPlayer from '@/views/bridge/EzPlayer.vue'
import BridgeMonitor from '@/views/bridge/BridgeMonitor.vue'

// [新增] 故障诊断子系统 (占位页)
import FaultDiagnosis from '@/views/diagnosis/FaultDiagnosis.vue'

// 其他页面
import Login from '@/views/Login.vue'
import WordCard from '@/views/WordCard.vue'

import { getToken } from '@/utils/auth.js'

const routes = [
    // --- 组1：平台门户与子系统 (使用 OutLayout，带统一导航栏) ---
    {
        path: '/',
        component: OutLayout,
        redirect: '/portal', // [修改] 默认跳转到门户页
        children: [
            // 1.1 统一赋能平台门户 (入口)
            {
                path: 'portal',
                name: 'PortalHome',
                component: PortalHome,
                meta: { requiresAuth: false }
            },

            // 1.2 桥梁监测子系统首页
            {
                path: 'bridge',
                name: 'BridgeHome',
                component: BridgeHome,
                meta: { requiresAuth: false }
            },

            // 1.3 故障诊断子系统首页
            {
                path: 'diagnosis',
                name: 'FaultDiagnosis',
                component: FaultDiagnosis,
                meta: { requiresAuth: false }
            },

            // 1.4 桥梁系统的具体工具页 (保留在此处，依旧可以通过 OutLayout 访问)
            { path: 'radioMonitor', name: 'RadioMonitor', component: RadioMonitor, meta: { requiresAuth: false } },
            { path: 'EzPlayer', name: 'EzPlayer', component: EzPlayer, meta: { requiresAuth: false } },

            // 1.5 通用页面
            { path: 'login', name: 'Login', component: Login, meta: { requiresAuth: false } },
            { path: 'word-card', name: 'WordCard', component: WordCard, meta: { requiresAuth: false } }
        ]
    },

    // --- 组2：大屏监控页面 (使用 FullscreenLayout，无导航栏) ---
    // 专门用于大屏展示，不显示常规导航
    {
        path: '/bridge-view',
        component: FullscreenLayout,
        children: [
            {
                path: 'monitor', // 访问地址: /bridge-view/monitor
                name: 'BridgeMonitor',
                component: BridgeMonitor,
                meta: { requiresAuth: false }
            }
        ]
    },

    // --- 组3：后台/内部页面 (使用 InnerLayout) ---
    {
        path: '/inner',
        component: InnerLayout,
        redirect: '/inner/home',
        children: [
            // 注意：这里的 Home 如果是指内部首页，可能需要确认是否复用 PortalHome 还是另外的组件
            // 暂时保持原样，如果需要指向原来的桥梁首页，请改为 BridgeHome
            { path: 'home', name: 'InnerHome', component: PortalHome, meta: { requiresAuth: true } }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const token = getToken()
    if (to.meta.requiresAuth && !token) {
        next({ path: '/login' })
    } else {
        next()
    }
})

export default router