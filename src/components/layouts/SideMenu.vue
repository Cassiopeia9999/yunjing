<!-- SideMenu.vue -->
<template>
  <div class="side-menu w-[286px] h-full bg-gray-100 text-blue-600 shrink-0">
    <!-- 顶部按钮和名称 -->
    <div class="menu-header flex items-center p-4 h-12 bg-gray-100 text-blue-600">
      <el-button
          @click="toggleMenu"
          type="text"
          :icon="Grid"
          class="mr-4 text-blue-600"
          :style="{ fontSize: '24px', color: '#2563eb' }"
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
          @click="handleMenuClick(item)"
      >
        <el-icon :size="16" class="mr-2">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.name }}</span>
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

import { useRouter } from 'vue-router'
import { getToken, getTenantId } from '@/utils/auth'
import {FORM_ID_PRODUCTION_7784, FORM_ID_PRODUCTION_7800} from "@/api/form_constant.js";

const router = useRouter()
const BASE_EXTERNAL_URL = import.meta.env.VITE_LOWCODE_BASE_URL || 'https://dev.xlingdata.com'

const buildLowcodeUrl = (formId) => `/lowcode/dynamicInfo/index/${formId}`;

const handleMenuClick = (item) => {
  const token = getToken()
  const tenantId = getTenantId()

  // ✅ 构造带 token 的完整 URL
  const fullUrl = `${BASE_EXTERNAL_URL}${item.link}?token=${encodeURIComponent(token)}&tenant-id=${encodeURIComponent(tenantId)}`


  if (item.external) {
    if (item.openInFrame) {
      // ✅ 内嵌 iframe 打开
      router.push({
        path: '/inner/lowcodeframe',
        query: {
          url: item.link
        }
      })
    } else {
      // ✅ 新窗口打开
      window.open(fullUrl, '_blank')
    }
  } else {
    // ✅ 内部路由跳转
    router.push(item.link)
  }
}

const menuItems = [
  {
    name: '工作台',
    icon: 'Menu',
    link: '/inner/dashboard'
  },
  {
    name: '全球视图',
    icon: 'ChromeFilled',
    link: '/inner/globalview'
  },
  {
    name: '特征分析',
    icon: 'ChromeFilled',
    link: '/inner/featuredemo'
  },
  {
    name: '周期管理',
    icon: 'ChromeFilled',
    link: '/inner/period'
  },
  {
    name: '数据后台（新窗口）',
    icon: 'Setting',
    link: '/index/workbench',
    external: true
  },
  {
    name: '生产环节（嵌入页）',
    icon: 'Setting',
    link: buildLowcodeUrl(FORM_ID_PRODUCTION_7784),
    external: true,
    openInFrame: true
  },
  {
    name: '生产环节（嵌入页）',
    icon: 'Setting',
    link: buildLowcodeUrl(FORM_ID_PRODUCTION_7800),
    external: true,
    openInFrame: true
  }
]


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