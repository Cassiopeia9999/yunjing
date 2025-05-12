<template>
  <div class="base-info-container flex h-screen overflow-hidden">
    <!-- 左侧：系统名称侧边栏 -->
    <div class="side-menu w-[286px] h-full bg-gray-100 text-blue-600 shrink-0 shadow-lg transition-all duration-300">
      <div class="menu-header flex items-center p-4 h-12 bg-gray-200">
        <el-button
            @click="toggleSidebar"
            type="text"
            icon="Menu"
            class="mr-4 text-blue-600"
            :style="{ fontSize: '24px' }"
        />
        <span class="font-semibold text-gray-800">装置列表</span>
      </div>

      <el-menu
          default-active="0"
          class="el-menu-vertical-demo bg-gray-100 border-none"
          router
      >
        <el-menu-item
            v-for="(system, index) in systemNames"
            :key="index"
            :index="index.toString()"
            class="py-3 px-4 hover:bg-gray-200 transition-colors"
            @click="handleSystemClick(system)"
        >
          <el-icon class="mr-2">
            <Document />
          </el-icon>
          <span>{{ system }}</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 中间和右侧内容 -->
    <div class="flex-1 overflow-auto p-4">
      <div class="flex gap-4">
        <!-- 中间：基地名称、经纬度 -->
        <div class="middle-column flex-1 min-w-[300px]">
          <div class="info-card bg-white shadow-sm rounded-lg p-5 mb-4">
            <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">基地名称</h2>
            <p class="text-gray-600 text-lg">{{ baseName }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="info-card bg-white shadow-sm rounded-lg p-5">
              <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">经度</h2>
              <p class="text-gray-600 text-lg">{{ longitude }}</p>
            </div>

            <div class="info-card bg-white shadow-sm rounded-lg p-5">
              <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">纬度</h2>
              <p class="text-gray-600 text-lg">{{ latitude }}</p>
            </div>
          </div>
        </div>

        <!-- 右侧：基地详细信息 -->
        <div class="right-column flex-2 min-w-[400px]">
          <div class="detail-card bg-white shadow-sm rounded-lg p-5">
            <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">基地详细信息</h2>
            <div class="prose max-w-none text-gray-600">
              <p>这里显示基地的详细信息。</p>
              <p>包括基地的建设时间、占地面积、主要功能、设备配置等信息。</p>
              <div class="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-gray-500 block">建设时间</span>
                  <span class="text-gray-800">2020年10月</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">占地面积</span>
                  <span class="text-gray-800">5000平方米</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">负责人</span>
                  <span class="text-gray-800">张三</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">联系电话</span>
                  <span class="text-gray-800">13800138000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTableData } from '@/api/querydata.js'
import { FORM_ID_PRODUCTION_7800 } from '@/api/form_constant.js'
import { Document } from '@element-plus/icons-vue'

const route = useRoute()
const baseName = ref('')
const longitude = ref(null)
const latitude = ref(null)
const systemNames = ref([])
const sidebarCollapsed = ref(false)

// 侧边栏折叠/展开
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 系统项点击处理
const handleSystemClick = (system) => {
  console.log('选中系统:', system)
  // 这里可以添加系统点击后的逻辑，如加载系统详情
}

onMounted(async () => {
  baseName.value = route.query.baseName
  longitude.value = route.query.longitude
  latitude.value = route.query.latitude

  const res = await fetchTableData(1, 10, FORM_ID_PRODUCTION_7800, {})
  const data = res.data.list || []

  console.log("Base Name from URL:", baseName.value, typeof baseName.value);
  console.log("Fetched Data:", data);

  systemNames.value = data.filter(item => {
    return item.parent_site && typeof item.parent_site === 'object' && item.parent_site.name === baseName.value;
  }).map(item => item.system_name);

  if (systemNames.value.length === 0) {
    console.warn(`No systems found related to base "${baseName.value}"`);
  }
})
</script>

<style scoped>
.base-info-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.side-menu {
  transition: width 0.3s ease-in-out;
  z-index: 10;
}

.side-menu.collapsed {
  width: 80px;
}

.side-menu.collapsed .el-menu-item span {
  display: none;
}

.middle-column, .right-column {
  transition: all 0.3s ease-in-out;
}

.el-menu-item {
  color: #409eff !important;
}

.el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-right: 3px solid #409eff !important;
}

.info-card, .detail-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
}

.info-card:hover, .detail-card:hover {
  transform: translateY(-2px);
}
</style>