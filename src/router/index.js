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
import AvgHome from '@/views/agvlmd/AgvHome.vue'

// 桥梁系统的具体工具页面
import RadioMonitor from '@/views/bridge/RadioMonitor.vue'
import EzPlayer from '@/views/bridge/EzPlayer.vue'
import BridgeMonitor from '@/views/bridge/BridgeMonitor.vue'

// [新增] 故障诊断子系统 (占位页)
import FaultDiagnosis from '@/views/diagnosis/FaultDiagnosis.vue'

import AirportHome from '@/views/airport/AirportHome.vue' // 上面的代码
import AirportGis from '@/views/airport/AirportGis.vue'   // 之前的 Map Dashboard

// 其他页面
import Login from '@/views/Login.vue'
import WordCard from '@/views/WordCard.vue'

import { getToken } from '@/utils/auth.js'
import IntroPage from "@/views/airport/IntroPage.vue";

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
            {
                path: 'urcs-dashboard',
                name: 'urss',
                component: AvgHome,
                meta: { requiresAuth: false }
            },

            // 1.4 桥梁系统的具体工具页 (保留在此处，依旧可以通过 OutLayout 访问)
            { path: 'radioMonitor', name: 'RadioMonitor', component: RadioMonitor, meta: { requiresAuth: false } },
            { path: 'EzPlayer', name: 'EzPlayer', component: EzPlayer, meta: { requiresAuth: false } },

            {
                path: 'airport',
                name: 'AirportHome', // 1. 访问 /airport 显示这个首页
                component: AirportHome,
                meta: { requiresAuth: false }
            },

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
    // --- 组4：机场智慧管养系统 (使用 FullscreenLayout) ---
    // [说明] 介绍页和 GIS 地图都需要全屏展示，不受 OutLayout 框架限制
    {
        path: '/airport',
        component: FullscreenLayout,
        children: [
            // [新增] 机场系统门户介绍页 (访问地址: /airport/intro)
            {
                path: 'intro',
                name: 'IntroPage',
                component: IntroPage,
                meta: { requiresAuth: false }
            },
            // 机场 GIS 业务主页 (访问地址: /airport/gis)
            {
                path: 'gis',
                name: 'AirportGis',
                component: AirportGis,
                meta: { requiresAuth: true }
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
            { path: 'home', name: 'InnerHome', component: AirportHome, meta: { requiresAuth: true } },
            { path: 'gis', name: 'gis', component: AirportGis, meta: { requiresAuth: true } }

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