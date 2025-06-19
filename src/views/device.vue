<template>
  <div class="container" v-if="isload">
    <!-- 左上角返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <i class="fa fa-arrow-left "></i>{{baseName}}基地
      </button>
    </div>
    <h1 class="title">设备健康监控</h1>



    <!-- 设备状态卡片区域（已恢复） -->
    <div class="device-cards-container" v-if="devices.length > 0">
      <div class="device-card" v-for="device in devices" :key="device.name" @click="toggleDeviceSelection(device.name)" :class="{ 'selected-card': selectedDevicename === device.name }">
        <div class="card-header" :style="{ backgroundColor: getStatusColor(device.status) }">
          <h3 class="device-name">{{ device.name }}</h3>
        </div>
        <div class="card-body">
          <p class="device-info">
            <span class="info-label">工作状态:</span>
            <span class="info-value" :style="{ color: getStatusColor(device.status) }">{{ device.status }}</span>
          </p>
          <p class="device-info">
            <span class="info-label">剩余寿命:</span>
            <span class="info-value">{{ device.nextMaintenance }}天</span>
          </p>
          <p class="device-info">
            <span class="info-label">置信度:</span>
            <span class="info-value">{{ device.conf }}%</span>
          </p>
          <p class="device-info">
            <span class="info-label">健康度:</span>
            <span class="info-value">{{ device.healthlv }}%</span>
          </p>
        </div>
      </div>
    </div>
    <div v-else class="text-black text-2xl m-10">
      暂无设备数据
    </div>

    <!-- 表格控制区 -->
    <div class="table-controls">
      <div class="search-box text-black">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索设备..."
            @keyup.enter="filterDevices"
        >
        <button @click="filterDevices">
          <i class="fa fa-search"></i>
        </button>
      </div>

      <!-- 维修按钮 -->
      <button class="maintenance-btn" @click="navigateToMaintenance">
        <i class="fa fa-wrench"></i>维修管理
      </button>
    </div>

    <!-- 设备健康信息表格 -->
    <div class="device-table-container">
      <table class="device-table">
        <thead>
        <tr>
          <th>设备ID</th>
          <th>设备名称</th>
          <th>健康状态</th>
          <th>运行时长(小时)</th>
          <th>上次维护</th>
          <th>下次维护</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody class="text-black">
        <tr v-for="device in paginatedDevices" :key="device.id" :class="{ 'status-normal': device.healthStatus === '正常', 'status-warning': device.healthStatus === '警告', 'status-danger': device.healthStatus === '危险' }">
          <td>{{ device.id }}</td>
          <td>{{ device.name }}</td>
          <td>
  <span class="health-status-content"> <!-- 新增的包裹元素 -->
    <span class="status-dot" :style="{ backgroundColor: getStatusColor(device.healthStatus) }"></span>
    {{ device.healthStatus }}
  </span>
          </td>
          <td>{{ device.runningHours }}</td>
          <td>{{ formatDate(device.lastMaintenance) }}</td>
          <td>{{ formatDate(device.nextMaintenance) }}</td>
          <td>
            <button class="view-detail-btn" @click="viewDeviceDetail(device.id)">
              <i class="fa fa-eye"></i> 详情
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控制 -->
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router' // 引入路由钩子
import {fetchTableData} from '@/api/querydata.js'
import {UNIT_FORM_ID, DEVICE_FORM_ID, POINT_FORM_ID} from '@/api/constant/form_constant.js'
// 顶部四个方块的设备数据

const route = useRoute()
const baseName = ref('')
const longitude = ref(null)
const latitude = ref(null)
const devicename = ref(null)
const devices = ref([])
const isload = ref(false)
const selectedDevicename = ref(null)
// 表格中的设备健康数据
const healthDevices = ref([
  { id: 'D001', name: '主控制器A', healthStatus: '正常', runningHours: 1245, lastMaintenance: '2025-05-10', nextMaintenance: '2025-08-10' },
  { id: 'D002', name: '温度传感器B', healthStatus: '警告', runningHours: 876, lastMaintenance: '2025-04-15', nextMaintenance: '2025-07-15' },
  { id: 'D003', name: '压力控制器C', healthStatus: '正常', runningHours: 532, lastMaintenance: '2025-06-02', nextMaintenance: '2025-09-02' },
  { id: 'D004', name: '流量监测仪D', healthStatus: '危险', runningHours: 1987, lastMaintenance: '2025-03-20', nextMaintenance: '2025-06-20' },
  { id: 'D005', name: '电源模块E', healthStatus: '正常', runningHours: 320, lastMaintenance: '2025-06-10', nextMaintenance: '2025-09-10' },
  { id: 'D006', name: '数据采集器F', healthStatus: '警告', runningHours: 1023, lastMaintenance: '2025-05-05', nextMaintenance: '2025-08-05' },
  { id: 'D007', name: '散热系统G', healthStatus: '正常', runningHours: 789, lastMaintenance: '2025-06-01', nextMaintenance: '2025-09-01' },
  { id: 'D008', name: '通信模块H', healthStatus: '正常', runningHours: 456, lastMaintenance: '2025-05-20', nextMaintenance: '2025-08-20' },
])

// 搜索和分页
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5)

// 获取路由实例
const router = useRouter()

// 计算属性
const filteredDevices = computed(() => {
  if (!searchQuery.value.trim()) return healthDevices.value

  const query = searchQuery.value.toLowerCase()
  return healthDevices.value.filter(device =>
      device.id.toLowerCase().includes(query) ||
      device.name.toLowerCase().includes(query) ||
      device.healthStatus.toLowerCase().includes(query)
  )
})

const totalPages = computed(() =>
    Math.ceil(filteredDevices.value.length / itemsPerPage.value)
)

const paginatedDevices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDevices.value.slice(start, end)
})

// 辅助函数
const getStatusColor = (status: string) => {
  return {
    '正常运行': '#4CAF50',
    '维护中': '#FFC107',
    '故障': '#F44336',
    '正常': '#4CAF50',
    '警告': '#FFC107',
    '危险': '#F44336',
  }[status] || '#9E9E9E'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'

  try {
    // 处理包含时间的情况
    if (dateStr.includes(' ')) {
      return dateStr.replace(' ', 'T')
    }

    // 处理只有日期的情况
    return `${dateStr}T00:00:00`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return dateStr
  }
}

// 分页控制
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const filterDevices = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}

// 导航接口
const navigateToMaintenance = () => {
  // 这里是跳转接口，实际使用时由外部实现
  router.push({
    name: 'repair',
    query:{
      devicename:selectedDevicename.value
    }

  })
}

// 查看设备详情
const viewDeviceDetail = (deviceId: string) => {
  console.log(`查看设备 ${deviceId} 详情`)
  // 实际使用时可打开详情弹窗或跳转详情页
}

onMounted(async () => {
  baseName.value = route.query.baseName
  longitude.value = route.query.longitude
  latitude.value = route.query.latitude
  devicename.value = route.query.devicename

  const res = await fetchTableData(1, 10, DEVICE_FORM_ID, {})
  const data = res.data.list || []

  devices.value = data.filter(item =>
      item.parent_system?.name === devicename.value
  ).map(item =>({
    name:item.device_name,
    status: "正常运行",
    nextMaintenance:item.remaining_life,
    conf:item.confidence_level,
    healthlv:item.health_level
  }));

  isload.value = true
})

const toggleDeviceSelection = (devicename: string) => {
  if (selectedDevicename.value === devicename) {
    selectedDevicename.value = null // 如果点击的是当前已选中的设备，则取消选中
  } else {
    selectedDevicename.value = devicename // 否则，选中新设备
  }
  console.log('当前选中设备name:', selectedDevicename.value); // 可以在控制台查看选中状态
}

// 返回上一页
const goBack = () => {
  router.push({
    name: 'system',
    query:{
      baseName:baseName.value,
      longitude:longitude.value,
      latitude:latitude.value,
    }})
}
</script>

<style scoped>
/* 全局容器 */
.container {
  min-height: 93vh;
  padding: 20px;
  background: url('/images/ss.jpg') center/cover no-repeat;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.7);
  z-index: 1;
}

/* 新增：返回按钮容器样式 */
.back-button-container {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 3; /* 确保按钮在最上层 */
}

/* 新增：返回按钮样式（参考现有维修按钮样式） */
.back-button {
  padding: 5px 8px;
  background: #607D8B;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  transition: background 0.3s;
}
.back-button:hover {
  background: #455A64;
}

/* 标题 */
.title {
  position: relative;
  z-index: 2;
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
  margin-top: 40px; /* 调整标题上边距，避免与返回按钮重叠 */
}

/* 设备状态卡片区域 */
.device-cards-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin-top: 20px;
  margin-bottom: 30px;
}
.device-card {
  flex: 1 1 calc(25% - 20px);
  min-width: 250px;
  max-width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}
.device-card:hover {
  transform: translateY(-5px);
}
.card-header {
  padding: 10px 15px;
  color: white;
  font-weight: bold;
}
.device-name {
  margin: 0;
  font-size: 1.2rem;
}
.card-body {
  padding: 15px;
}
.device-info {
  margin: 10px 0;
  text-align: left;
  font-size: 0.95rem;
}
.info-label {
  font-weight: bold;
  color: #555;
  display: inline-block;
  width: 80px;
}
.info-value {
  color: #333;
}

/* 表格控制区 */
.table-controls {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  padding: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.search-box input {
  border: none;
  outline: none;
  padding: 8px;
  width: 250px;
  font-size: 1rem;
}
.search-box button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: #607D8B;
}

/* 维修按钮 */
.maintenance-btn {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  transition: background 0.3s;
}
.maintenance-btn:hover {
  background: #0b7dda;
}
.mr-2 {
  margin-right: 8px;
}

/* 设备表格 */
.device-table-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  overflow-x: auto;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.device-table {
  width: 100%;
  border-collapse: collapse;
}
/* 修改所有表格单元格的默认对齐方式，确保垂直居中 */
.device-table th, .device-table td {
  padding: 12px 15px;
  text-align: left; /* 保持默认左对齐，但健康状态列会单独设置 */
  border-bottom: 1px solid #ddd;
  vertical-align: middle; /* 明确设置所有 td 的内容垂直居中 */
}

/* 针对健康状态列的 td 进行单独设置 */
/* 假设健康状态是表格的第三列，使用 nth-child 选择器更精准，避免修改 HTML 中的 class */
.device-table tbody td:nth-child(3) {
  text-align: left; /* 让这一列的内容水平居中 */
}

/* 新增的包裹元素样式，负责点和文字的内部对齐 */
.health-status-content {
  display: inline-flex; /* 使用 inline-flex 让其表现得像行内元素，并允许内部 flex 布局 */
  align-items: center; /* 在 inline-flex 容器内部垂直居中点和文字 */
  /* vertical-align: middle; /* 这一行通常是多余的，因为父 td 已经设置了，但如果仍有问题可以尝试添加 */
  /* justify-content: center; /* 如果希望点和文字在包裹元素内部也水平居中，可以添加 */
}

/* .status-dot 样式保持不变 */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}
.device-table th {
  background: #607D8B;
  color: white;
  font-weight: bold;
}

.device-table tr:hover {
  background: rgba(0,0,0,0.05);
}
.status-normal {
  background: rgba(76, 175, 80, 0.05);
}
.status-warning {
  background: rgba(255, 193, 7, 0.05);
}
.status-danger {
  background: rgba(244, 67, 54, 0.05);
}

/* 操作按钮 */
.view-detail-btn {
  background: #607D8B;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.view-detail-btn:hover {
  background: #455A64;
}

/* 分页控制 */
.pagination {
  position: relative;
  z-index: 2;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}
.pagination button {
  padding: 8px 16px;
  background: #607D8B;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}
.pagination button:disabled {
  background: #ddd;
  cursor: not-allowed;
}
.pagination button:not(:disabled):hover {
  background: #455A64;
}
.pagination span {
  font-size: 1rem;
  color: #333;
}
.device-card.selected-card {
  border-color: #007bff; /* 蓝色边框 */
  box-shadow: 0 0 15px rgba(0, 123, 255, 0.6); /* 蓝色发光效果 */
  transform: translateY(-5px) scale(1.02); /* 轻微上浮和放大 */
  background-color: #e6f2ff; /* 稍微浅一点的背景色 */
}
</style>