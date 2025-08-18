import { createRouter, createWebHistory } from 'vue-router'

import OutLayout from '@/components/layouts/OutLayout.vue'
import InnerLayout from '@/components/layouts/InnerLayout.vue'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import GlobalView from '@/views/dev/GlobalView.vue'
import LowcodeFrame from '@/views/LowcodeFrame.vue'
import FeatureDemo from '@/views/analysis/FeatureDemo.vue'
import baseinfo from '@/views/baseinfo.vue'
import period from '@/views/period.vue'
import rsituation from '@/views/rsituation.vue'
import DiagnosisWebSocketTest from '@/views/monitor/DiagnosisWebSocketTest.vue'
import PyServiceTest from '@/views/py_service_test.vue'
import system from '@/views/system.vue'
import device from '@/views/device.vue'
import repair from '@/views/repair.vue'

import { getToken } from '@/utils/auth.js'

// ✅ 新增：manage 下的四个页面（按需加载）
const BaseView   = () => import('@/views/manage/BaseView.vue')
const BaseSceneView   = () => import('@/views/manage/BaseScenarioView.vue')

const SysView    = () => import('@/views/manage/SysView.vue')
const DevView    = () => import('@/views/manage/DevView.vue')
const Maintain   = () => import('@/views/manage/Maintain.vue')
const DecisionView   = () => import('@/views/manage/DecisionView.vue')
const FaultCenterView   = () => import('@/views/manage/FaultCenter.vue')


const routes = [
    {
        path: '/',
        component: OutLayout,
        redirect: '/home',
        children: [
            { path: 'home',  name: 'Home',  component: Home,  meta: { requiresAuth: false } },
            { path: 'login', name: 'Login', component: Login, meta: { requiresAuth: false } }
        ]
    },
    {
        path: '/inner',
        component: InnerLayout,
        redirect: '/inner/dashboard',
        children: [
            { path: 'dashboard',        name: 'Dashboard',       component: Dashboard,               meta: { requiresAuth: true } },
            { path: 'globalview',       name: 'GlobalView',      component: GlobalView,              meta: { requiresAuth: true } },
            { path: 'Lowcodeframe',     name: 'LowcodeFrame',    component: LowcodeFrame,            meta: { requiresAuth: true } },
            { path: 'featuredemo',      name: 'featuredemo',     component: FeatureDemo,             meta: { requiresAuth: true } },
            { path: 'baseinfo',         name: 'baseinfo',        component: baseinfo,                meta: { requiresAuth: true } },
            { path: 'period',           name: 'period',          component: period,                  meta: { requiresAuth: true } },
            { path: 'rsituation',       name: 'rsituation',      component: rsituation,              meta: { requiresAuth: true } },
            { path: 'monitor',          name: 'monitor',         component: DiagnosisWebSocketTest,  meta: { requiresAuth: true } },
            { path: 'py_interface_test',name: 'py_interface_test',component: PyServiceTest,          meta: { requiresAuth: true } },
            { path: 'system',           name: 'system',          component: system,                  meta: { requiresAuth: true } },
            { path: 'device',           name: 'device',          component: device,                  meta: { requiresAuth: true } },
            { path: 'repair',           name: 'repair',          component: repair,                  meta: { requiresAuth: true } },

            // 🔥 新增四个管理视图（与你菜单的链接一致）
            { path: 'manage/baseview',  name: 'ManageBaseView',  component: BaseView,  meta: { requiresAuth: true } },
            { path: 'manage/basesceneview',  name: 'ManageBaseSceneView',  component: BaseSceneView,  meta: { requiresAuth: true } },
            { path: 'manage/sysview',   name: 'ManageSysView',   component: SysView,   meta: { requiresAuth: true } },
            { path: 'manage/devview',   name: 'ManageDevView',   component: DevView,   meta: { requiresAuth: true } },
            { path: 'manage/decision',   name: 'DecisionView',   component: DecisionView,   meta: { requiresAuth: true } },
            { path: 'manage/faultcenter',   name: 'FaultCenterView',   component: FaultCenterView,   meta: { requiresAuth: true } },
            { path: 'manage/maintain',  name: 'ManageMaintain',  component: Maintain,  meta: { requiresAuth: true } }
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
