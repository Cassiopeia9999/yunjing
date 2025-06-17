<template>
  <div class="container">
    <h1 class="title">设备健康监控</h1>

    <!-- 设备状态卡片区域（已恢复） -->
    <div class="device-cards-container" v-if="devices.length > 0">
      <div class="device-card" v-for="device in devices" :key="device.id">
        <div class="card-header" :style="{ backgroundColor: getStatusColor(device.status) }">
          <h3 class="device-name">{{ device.name }}</h3>
        </div>
        <div class="card-body">
          <p class="device-info">
            <span class="info-label">工作状态:</span>
            <span class="info-value" :style="{ color: getStatusColor(device.status) }">{{ device.status }}</span>
          </p>
          <p class="device-info">
            <span class="info-label">下次维修:</span>
            <span class="info-value">{{ formatDate(device.nextMaintenance) }}</span>
          </p>
          <p class="device-info">
            <span class="info-label">数据更新:</span>
            <span class="info-value">{{ formatDate(device.lastUpdate) }}</span>
          </p>
        </div>
      </div>
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
        <i class="fa fa-wrench mr-2"></i>维修管理
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
import { ref, computed } from 'vue'

// 顶部四个方块的设备数据
const devices = ref([
  {
    id: 1,
    name: '设备A',
    status: '正常运行',
    nextMaintenance: '2025-07-15',
    lastUpdate: '2025-06-17 08:30:00'
  },
  {
    id: 2,
    name: '设备B',
    status: '维护中',
    nextMaintenance: '2025-06-20',
    lastUpdate: '2025-06-17 09:15:00'
  },
  {
    id: 3,
    name: '设备C',
    status: '正常运行',
    nextMaintenance: '2025-08-05',
    lastUpdate: '2025-06-17 10:00:00'
  },
  {
    id: 4,
    name: '设备D',
    status: '故障',
    nextMaintenance: '2025-06-18',
    lastUpdate: '2025-06-17 07:45:00'
  }
])

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
  console.log('跳转到维修管理页面')
  if (typeof window !== 'undefined' && typeof window.$router !== 'undefined') {
    window.$router.push('/maintenance') // 示例：使用Vue Router
  }
}

// 查看设备详情
const viewDeviceDetail = (deviceId: string) => {
  console.log(`查看设备 ${deviceId} 详情`)
  // 实际使用时可打开详情弹窗或跳转详情页
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

/* 标题 */
.title {
  position: relative;
  z-index: 2;
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
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
</style>