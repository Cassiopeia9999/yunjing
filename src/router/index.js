import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import GlobalView from "@/views/dev/GlobalView.vue";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard
    },
    {
        path: '/dev/globalview',  // 新增的路径
        name: 'GlobalView',  // 新页面的名称
        component: GlobalView  // 新页面的组件
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
