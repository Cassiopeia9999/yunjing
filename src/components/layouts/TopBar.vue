<template>
  <header class="flex justify-between items-center px-4 py-1 bg-gray-100 shadow-md w-full h-12">
    <!-- 左侧按钮 -->
    <el-button
        @click="toggleMenu"
        type="text"
        :icon="Grid"
        circle
        :style="{ fontSize: '24px'  ,color: '#2563eb'}"
    />


    <!-- 应用名称 -->
    <div class="text-xl font-semibold text-gray-800">
      故障诊断工作台
    </div>

    <!-- 搜索框 -->
    <div class="flex items-center">
      <input
          type="text"
          placeholder="在 故障 中搜索"
          class="p-2 rounded-md border border-gray-300 w-64"
      />
    </div>

    <!-- 右侧按钮 -->
    <div class="flex space-x-2">
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-600">请求</button>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">云效+DeepSeek</button>
      <el-button
          @click="confirmLogout"
          type="text"
          :icon="User"
          circle
          :style="{ fontSize: '24px', color: '#2563eb' }"
      />
    </div>
  </header>
</template>

<script setup>
import { defineEmits } from 'vue';
import { Grid, User } from '@element-plus/icons-vue'
import {useStore} from "vuex";  // Menu=左侧菜单图标，User=退出图标
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'; // 引入 MessageBox

const store = useStore()

const emit = defineEmits()
const router = useRouter()

// 切换菜单显示与隐藏
const toggleMenu = () => {
  emit('toggle-menu');  // 触发 toggle-menu 事件，父组件接收到该事件后切换菜单状态
};

const confirmLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
      .then(() => {
        logout();  // 用户确认后退出
      })
      .catch(() => {
        // 用户点击取消时的处理
        console.log('用户取消退出');
      });
};

// 退出操作
const logout = async () => {
  try {
    await store.dispatch('LogOut'); // Vuex 中的退出逻辑（比如清空 token）
    router.push('/'); // 跳转到首页
  } catch (error) {
    console.error('退出登录失败:', error);
  }
};
</script>

<style scoped>
/* 样式保持不变 */
</style>
