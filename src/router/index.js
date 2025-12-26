import { createRouter, createWebHistory } from 'vue-router'

import OutLayout from '@/components/layouts/OutLayout.vue'
import InnerLayout from '@/components/layouts/InnerLayout.vue'
import FullscreenLayout from '@/components/layouts/FullscreenLayout.vue'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import RadioMonitor from '@/views/bridge/RadioMonitor.vue'
import EzPlayer from '@/views/bridge/EzPlayer.vue'


import WordCard from '@/views/WordCard.vue'

import { getToken } from '@/utils/auth.js'

const routes = [
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
        ]
    },
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
