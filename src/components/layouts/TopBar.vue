<template>
  <header class="flex justify-between items-center px-4 py-2 bg-gray-100 shadow-md w-full h-14">
    <!-- 左侧按钮 -->
    <el-button
        @click="toggleMenu"
        type="text"
        :icon="Grid"
        circle
        class="text-gray-700 text-xl"
    />


    <!-- 应用名称 -->
    <div class="text-xl font-semibold text-gray-800">
      云效 工作台
    </div>

    <!-- 搜索框 -->
    <div class="flex items-center">
      <input
          type="text"
          placeholder="在 云效 中搜索"
          class="p-2 rounded-md border border-gray-300 w-64"
      />
    </div>

    <!-- 右侧按钮 -->
    <div class="flex space-x-2">
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">请求</button>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">云效+DeepSeek</button>
      <el-button
          @click="logout"
          type="text"
          :icon="User"
          circle
          class="text-red-600 hover:text-red-800"
      />
    </div>
  </header>
</template>

<script setup>
import { defineEmits } from 'vue';
import { Grid, User } from '@element-plus/icons-vue'
import {useStore} from "vuex";  // Menu=左侧菜单图标，User=退出图标
import { useRouter } from 'vue-router'

const store = useStore()

const emit = defineEmits()
const router = useRouter()

// 切换菜单显示与隐藏
const toggleMenu = () => {
  emit('toggle-menu');  // 触发 toggle-menu 事件，父组件接收到该事件后切换菜单状态
};

const logout = async () => {
  try {
    await store.dispatch('LogOut')  // Vuex 中的退出逻辑（比如清空 token）
    router.push('/')               // 跳转到首页
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

</script>

<style scoped>
/* 样式保持不变 */
</style>
