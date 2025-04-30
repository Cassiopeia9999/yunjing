<template>
  <el-header class="bg-gray-800 text-white w-full shadow">
    <div class="container mx-auto flex items-center justify-between w-full px-4">
      <!-- PC端使用横向菜单，移动端使用弹出式菜单 -->
      <div class="lg:block  w-full">
        <el-menu :default-active="active" mode="horizontal" class="w-full" background-color="transparent" text-color="#fff" active-text-color="#49a0fd" @select="handleSelect">
          <!-- 使用 router-link 进行路由跳转 -->
          <el-menu-item index="1">
            <router-link to="/">首页</router-link>
          </el-menu-item>
          <el-menu-item index="2">
            <router-link to="/login">登录</router-link>
          </el-menu-item>
          <el-menu-item index="3">
            <router-link to="/inner/dashboard">业务页面</router-link>
          </el-menu-item>
          <el-menu-item index="4">
            <router-link to="/inner/globalview">地图页面</router-link>
          </el-menu-item>
        </el-menu>
      </div>
    </div>
  </el-header>

  <main class="flex-1 w-full h-full p-6 bg-gray-50">
    <div class="w-full h-full flex flex-col justify-start">
      <!-- 动态路由显示区域 -->
      <router-view class="flex-1 w-full h-full" />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const active = ref('1')

const handleSelect = (index) => {
  active.value = index
}
</script>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}

main {
  width: 100%;
  display: flex;
  justify-content: center;
  color: #49a0fd;
}
</style>
