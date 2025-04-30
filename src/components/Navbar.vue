<template>
  <el-header class=" text-white w-full">
    <div class="container mx-auto flex items-center justify-between w-full">
      <!-- PC端使用横向菜单，移动端使用弹出式菜单 -->
      <div class="lg:block hidden w-full">
        <el-menu :default-active="active" mode="horizontal" class="lg:flex hidden w-full" @select="handleSelect">
          <!-- 使用 router-link 进行路由跳转 -->
          <el-menu-item index="1">
            <router-link to="/">首页</router-link>
          </el-menu-item>
          <el-menu-item index="2">
            <router-link to="/login">登录</router-link>
          </el-menu-item>
          <el-menu-item index="3">
            <router-link to="/dashboard">业务页面</router-link>
          </el-menu-item>
          <el-menu-item index="4">
            <router-link to="/dev/globalview">地图页面</router-link>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 移动端菜单（在小屏幕下显示） -->
      <el-menu :default-active="active" mode="vertical" class="lg:hidden block w-full" @select="handleSelect">
        <el-menu-item index="1">
          <router-link to="/">首页</router-link>
        </el-menu-item>
        <el-menu-item index="2">
          <router-link to="/login">登录</router-link>
        </el-menu-item>
        <el-menu-item index="3">
          <router-link to="/dashboard">业务页面</router-link>
        </el-menu-item>
        <el-menu-item index="4">
          <router-link to="/dev/globalview">地图页面</router-link>
        </el-menu-item>
      </el-menu>

    </div>
  </el-header>
</template>

<script setup>
import { ref } from 'vue'
import { ElMenu, ElMenuItem, ElHeader } from 'element-plus'

const active = ref('1')

const handleSelect = (index) => {
  active.value = index
}
</script>

<style scoped>

</style>
