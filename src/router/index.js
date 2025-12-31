import { createRouter, createWebHistory } from 'vue-router'

import OutLayout from '@/components/layouts/OutLayout.vue'
import InnerLayout from '@/components/layouts/InnerLayout.vue'
// 1. 确保已引入全屏布局组件
import FullscreenLayout from '@/components/layouts/FullscreenLayout.vue'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import RadioMonitor from '@/views/bridge/RadioMonitor.vue'
import EzPlayer from '@/views/bridge/EzPlayer.vue'
import BridgeMonitor from '@/views/bridge/BridgeMonitor.vue'
import WordCard from '@/views/WordCard.vue'

import { getToken } from '@/utils/auth.js'

const routes = [
    // --- 组1：普通前台页面 (使用 OutLayout，带导航栏) ---
    {
        path: '/',
        component: OutLayout,
        redirect: '/home',
        children: [
            { path: 'home',  name: 'Home',  component: Home,  meta: { requiresAuth: false } },
            { path: 'login', name: 'Login', component: Login, meta: { requiresAuth: false } },
            { path: 'radioMonitor', name: 'RadioMonitor', component: RadioMonitor, meta: { requiresAuth: false } },
            { path: 'EzPlayer', name: 'EzPlayer', component: EzPlayer, meta: { requiresAuth: false } },
            { path: 'word-card', name: 'WordCard', component: WordCard, meta: { requiresAuth: false } }
            // 注意：BridgeMonitor 已从此处移出
        ]
    },

    // --- 组2：大屏监控页面 (使用 FullscreenLayout，无导航栏) ---
    // 这是方案三的核心：为需要全屏的页面单独配置路由节点
    {
        path: '/bridge-view', // 为了区分，建议给个独立的一级路径
        component: FullscreenLayout, // 使用空白/全屏布局容器
        children: [
            {
                path: 'monitor', // 最终访问地址: /bridge-view/monitor
                name: 'BridgeMonitor',
                component: BridgeMonitor,
                meta: { requiresAuth: false }
            }
        ]
    },
    // 或者，如果你希望访问路径依然是 /bridgeMonitor，可以这样写：
    /*
    {
        path: '/bridgeMonitor',
        component: FullscreenLayout,
        children: [
            { path: '', name: 'BridgeMonitor', component: BridgeMonitor, meta: { requiresAuth: false } }
        ]
    },
    */

    // --- 组3：后台/内部页面 (使用 InnerLayout) ---
    {
        path: '/inner',
        component: InnerLayout,
        redirect: '/inner/home',
        children: [
            { path: 'home', name: 'InnerHome', component: Home, meta: { requiresAuth: true } }
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