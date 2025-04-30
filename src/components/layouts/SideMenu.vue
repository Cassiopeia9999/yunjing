<template>
  <div class="side-menu fixed top-0 left-0 h-full bg-gray-100 text-blue-600 z-50">
    <!-- 顶部按钮和名称 -->
    <div class="menu-header flex items-center p-4 h-12 bg-gray-100 text-blue-600">
      <el-button
          @click="toggleMenu"
          type="text"
          :icon="Grid"
          class="mr-4 text-blue-600"
          :style="{ fontSize: '24px'  ,color: '#2563eb'}"
      />
      <span class="font-semibold">菜单</span>
    </div>

    <!-- 动态生成的菜单 -->
    <el-menu default-active="1" class="el-menu-vertical-demo">
      <el-menu-item
          v-for="(item, index) in menuItems"
          :key="index"
          :index="index.toString()"
          class="p-2 hover:bg-gray-100 text-blue-600"
      >
        <router-link :to="item.link" class="text-blue-600">
          <el-icon :size="16" class="mr-2">
            <component :is="item.icon" />
          </el-icon>
          {{ item.name }}
        </router-link>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';
import { Grid } from '@element-plus/icons-vue';

// 触发事件切换菜单显示状态
const emit = defineEmits();

// 控制菜单显示与隐藏
const toggleMenu = () => {
  emit('toggle-menu');
};

// 菜单配置数据
const menuItems = [
  {
    name: '工作台',
    icon: 'Menu', // 图标组件名称
    link: '/inner/dashboard',
  },
  {
    name: '全球视图',
    icon: 'ChromeFilled', // 图标组件名称
    link: '/inner/globalview',
  },
  {
    name: '设置',
    icon: 'Setting', // 图标组件名称
    link: '/inner/settings',
  },
];
</script>

<style scoped>
.side-menu {
  width: 286px;
  transition: transform 2s ease-in-out;
  z-index: 50;
  box-shadow: 0 4px 22px rgba(0, 0, 0, 0.55);
  border-radius: 2px;
}
</style>