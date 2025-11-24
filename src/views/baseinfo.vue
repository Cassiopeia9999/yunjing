<template>
  <div class="base-info-container flex h-screen overflow-hidden">
    <!-- 左侧：系统名称侧边栏 -->
    <div class="side-menu w-[286px] h-full bg-gray-100 text-blue-600 shrink-0 shadow-lg transition-all duration-300" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="menu-header flex items-center p-4 h-12 bg-gray-200">
        <el-button
            @click="toggleSidebar"
            type="text"
            icon="Menu"
            class="mr-4 text-blue-600"
            :style="{ fontSize: '24px' }"
        />
        <span class="font-semibold text-gray-800" :class="{ 'hidden': sidebarCollapsed }">装置列表</span>
      </div>

      <el-menu
          :default-active="activeIndex"
          class="el-menu-vertical-demo bg-gray-100 border-none"
      >
        <el-menu-item
            v-for="(system, index) in systemNames"
            :key="index"
            :index="index.toString()"
            class="py-3 px-4 hover:bg-gray-200 transition-colors"
            @click="handleSystemClick(system, index)"
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
        <!-- 中间：基地信息 + 设备列表 -->
        <div class="middle-column flex-1 min-w-[400px] max-w-[600px]">
          <div class="info-card bg-white shadow-sm rounded-lg p-5 mb-4">
            <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">基地名称</h2>
            <p class="text-gray-600 text-lg">{{ baseName }}</p>
          </div>



          <!-- 设备列表表格 -->
          <div class="info-card bg-white shadow-sm rounded-lg p-5 mb-4">
            <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">设备列表</h2>
            <el-table
                :data="deviceList"
                highlight-current-row
                style="width: 100%"
                @row-click="handleDeviceClick"
                :row-class-name="getDeviceRowClass"
                empty-text="未找到匹配设备"
            >
              <el-table-column prop="device_name" label="设备名称" />
              <el-table-column prop="parent_site.name" label="基地" />
              <el-table-column prop="parent_system.name" label="装置" />
            </el-table>
          </div>
        </div>

        <!-- 右侧： 测点列表 -->
        <div class="right-column flex-1 min-w-[600px] max-w-[11000px]">
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
          <!-- 测点列表 -->
          <div class="detail-card bg-white shadow-sm rounded-lg p-5 mt-0">
            <h2 class="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">测点列表</h2>
            <el-table
                :data="pointList"
                style="width: 100%"
                empty-text="未找到匹配测点"
            >
              <el-table-column prop="point_name" label="测点名称" />
              <el-table-column prop="point_alias" label="测点别名" />
              <el-table-column prop="data_type" label="数据类型" />
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup >
import {ref, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {fetchTableData} from '@/api/query_data.js'
import {getSysConfigFormId} from '@/api/constant/form_constant.js'
import {Document} from '@element-plus/icons-vue'

// 基础信息
const route = useRoute()
const baseName = ref('')
const longitude = ref(null)
const latitude = ref(null)

// 系统、设备、测点数据状态
const systemNames = ref([])
const deviceList = ref([])
const pointList = ref([])

// 当前选中项
const activeIndex = ref('0')
const selectedSystem = ref('')
const selectedDevice = ref('')
const sidebarCollapsed = ref(false)

// 折叠侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 点击系统项
const handleSystemClick = async (system, index) => {
  activeIndex.value = index.toString()
  selectedSystem.value = system
  selectedDevice.value = ''
  deviceList.value = []
  pointList.value = []
  await fetchDeviceList()
}

// 点击设备行
const handleDeviceClick = async (device) => {
  selectedDevice.value = device.device_name
  await fetchPointList()
}

// 获取设备数据
const fetchDeviceList = async () => {
  const res = await fetchTableData(1, 10, getSysConfigFormId("DEVICE_FORM_ID"), {})
  const data = res.data.list || []

  deviceList.value = data.filter(device =>
      device.parent_site?.name === baseName.value &&
      device.parent_system?.name === selectedSystem.value
  )
}

// 获取测点数据
const fetchPointList = async () => {
  const res = await fetchTableData(1, 10, getSysConfigFormId("POINT_FORM_ID"), {})
  const data = res.data.list || []

  pointList.value = data.filter(point =>
      // point.parent_site?.name === baseName.value &&
      // point.parent_system?.name === selectedSystem.value &&
      point.equipment_id?.name === selectedDevice.value
  )
}

// 高亮当前选中设备行
const getDeviceRowClass = ({row}) => {
  return row.device_name === selectedDevice.value ? 'selected-device-row' : ''
}

// 初始加载
onMounted(async () => {
  baseName.value = route.query.baseName
  longitude.value = route.query.longitude
  latitude.value = route.query.latitude

  const res = await fetchTableData(1, 10, getSysConfigFormId("UNIT_FORM_ID"), {})
  const data = res.data.list || []

  systemNames.value = data.filter(item =>
      item.parent_site?.name === baseName.value
  ).map(item => item.system_name)

  if (systemNames.value.length > 0) {
    selectedSystem.value = systemNames.value[0]
    activeIndex.value = '0'
    await fetchDeviceList()
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

.selected-device-row {
  background-color: rgba(64, 158, 255, 0.1) !important;
}
</style>
