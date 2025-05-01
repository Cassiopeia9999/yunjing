import { createRouter, createWebHistory } from 'vue-router';
import OutLayout from '@/components/layouts/OutLayout.vue';
import InnerLayout from '@/components/layouts/InnerLayout.vue';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import GlobalView from '@/views/dev/GlobalView.vue';
import LowcodePlatform from "@/views/LowcodePlatform.vue";

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
                path: 'lowcodeplatform',
                name: 'LowcodePlatform',
                component: LowcodePlatform,
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
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (to.meta.requiresAuth && !isLoggedIn) {
        next({ path: '/login' });
    } else {
        next();
    }
});

export default router;
