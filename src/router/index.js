import { createRouter, createWebHistory } from 'vue-router';
import OutLayout from '@/components/layouts/OutLayout.vue';
import InnerLayout from '@/components/layouts/InnerLayout.vue';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import GlobalView from '@/views/dev/GlobalView.vue';
import LowcodeFrame from "@/views/LowcodeFrame.vue";
import FeatureDemo from "@/views/analysis/FeatureDemo.vue";
import baseinfo from "@/views/baseinfo.vue";
import period from "@/views/period.vue"
import rsituation from "@/views/rsituation.vue"
import DiagnosisWebSocketTest from "@/views/monitor/DiagnosisWebSocketTest.vue";
import test from "@/views/test.vue"
import system from "@/views/system.vue"
import device from "@/views/device.vue"
import {getToken} from "@/utils/auth.js";
const routes = [
    {
        path: '/',
        component: OutLayout,
        redirect: '/home',
        children: [
            {
                path: 'home',
                name: 'Home',
                component: Home,
                meta: { requiresAuth: false }
            },
            {
                path: 'login',
                name: 'Login',
                component: Login,
                meta: { requiresAuth: false }
            }
        ]
    },
    {
        path: '/inner',
        component: InnerLayout,
        redirect: '/inner/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { requiresAuth: true }
            },
            {
                path: 'globalview',
                name: 'GlobalView',
                component: GlobalView,
                meta: { requiresAuth: true }
            },
            {
                path: 'Lowcodeframe',
                name: 'LowcodeFrame',
                component: LowcodeFrame,
                meta: { requiresAuth: true },
             }
            ,
            {
                path: 'featuredemo',
                name: 'featuredemo',
                component: FeatureDemo,
                meta: { requiresAuth: true },
            },
            {
                path: 'baseinfo',
                name: 'baseinfo',
                component: baseinfo,
                meta: { requiresAuth: true },
            },
            {
                path: 'period',
                name: 'period',
                component: period,
                meta: { requiresAuth: true },
            },
            {
                path: 'rsituation',
                name: 'rsituation',
                component: rsituation,
                meta: { requiresAuth: true },
            },
            {
                path: 'monitor',
                name: 'monitor',
                component: DiagnosisWebSocketTest,
                meta: { requiresAuth: true },
            },
            {
                path: 'test',
                name: 'test',
                component: test,
                meta: { requiresAuth: true },
            },
            {
                path: 'system',
                name: 'system',
                component: system,
                meta: { requiresAuth: true },
            },
            {
                path: 'device',
                name: 'device',
                component: device,
                meta: { requiresAuth: true },
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
    const token = getToken();
    if (to.meta.requiresAuth && !token) {
        next({ path: '/login' });
    } else {
        next();
    }
});

export default router;
