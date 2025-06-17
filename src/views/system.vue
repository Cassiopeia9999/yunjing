<template>
  <div class="container">
    <!-- 标题 -->
    <h1 class="title">装置监控中心</h1>

    <!-- 设备卡片区域 -->
    <div class="device-cards-container" v-if="devices.length">
      <div
          class="device-card"
          v-for="device in devices"
          :key="device.id"
          @click="goToDeviceDetail(device.id)"
      >
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

    <!-- 基地信息 + 任务按钮区域 -->
    <div class="base-info-container">
      <!-- 基地名称卡片 -->
      <div class="base-card">
        <div class="base-card-header">基地名称</div>
        <div class="base-card-body">{{ baseInfo.name }}</div>
      </div>

      <!-- 基地经纬度卡片 -->
      <div class="base-card">
        <div class="base-card-header">基地经纬度</div>
        <div class="base-card-body">{{ baseInfo.latitude }}, {{ baseInfo.longitude }}</div>
      </div>

      <!-- 空闲装置卡片 -->
      <div class="base-card">
        <div class="base-card-header">空闲装置数量</div>
        <div class="base-card-body">{{ baseInfo.availableDevices }}</div>
      </div>

      <!-- 任务评估按钮（核心修复：对齐 + 尺寸） -->
      <button class="assessment-btn" @click="openAssessmentModal">
        任务评估
      </button>
    </div>

    <!-- 弹窗（核心修复：输入框显示 + 按钮样式） -->
    <div class="modal-overlay" v-if="isModalOpen">
      <div class="modal-content">
        <h3 class="modal-title">距离评估</h3>
        <div class="input-group">
          <label>纬度：</label>
          <input
              type="number"
              step="0.000001"
              placeholder="例如：39.9042"
              v-model="inputLat"
          />
        </div>
        <div class="input-group">
          <label>经度：</label>
          <input
              type="number"
              step="0.000001"
              placeholder="例如：116.4074"
              v-model="inputLon"
          />
        </div>
        <div class="btn-group">
          <button class="calc-btn" @click="calculateDistance">评估</button>
          <button class="cancel-btn" @click="closeModal">取消</button>
        </div>
        <p class="result" v-if="distance !== null">
          距离：{{ distance.toFixed(2) }} 公里
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router' // 引入路由钩子

// 设备数据（固定状态）
const devices = ref([
  { id: 1, name: '装置A', status: '正常运行', nextMaintenance: '2025-07-15', lastUpdate: '2025-06-17 08:30:00' },
  { id: 2, name: '装置B', status: '维护中', nextMaintenance: '2025-06-20', lastUpdate: '2025-06-17 09:15:00' },
  { id: 3, name: '装置C', status: '正常运行', nextMaintenance: '2025-08-05', lastUpdate: '2025-06-17 10:00:00' },
  { id: 4, name: '装置D', status: '故障', nextMaintenance: '2025-06-18', lastUpdate: '2025-06-17 07:45:00' },
])

// 基地信息
const baseInfo = ref({
  name: '主控制基地',
  latitude: '39.9042',
  longitude: '116.4074',
  availableDevices: 12,
})

// 弹窗状态
const isModalOpen = ref(false)
const inputLat = ref('')
const inputLon = ref('')
const distance = ref<number | null>(null)

// 获取路由实例
const router = useRouter()

// 状态颜色映射
const getStatusColor = (status: string) => {
  return {
    '正常运行': '#4CAF50',
    '维护中': '#FFC107',
    '故障': '#F44336',
  }[status] || '#9E9E9E'
}

// 日期格式化
const formatDate = (dateStr: string) => dateStr.replace(' ', 'T')

// 弹窗控制
const openAssessmentModal = () => {
  isModalOpen.value = true
  inputLat.value = ''
  inputLon.value = ''
  distance.value = null
}
const closeModal = () => (isModalOpen.value = false)

// 距离计算（Haversine公式）
const calculateDistance = () => {
  const lat = parseFloat(inputLat.value)
  const lon = parseFloat(inputLon.value)
  if (isNaN(lat) || isNaN(lon)) return alert('请输入有效的经纬度！')
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return alert('经纬度超出范围！')

  const baseLat = parseFloat(baseInfo.value.latitude)
  const baseLon = parseFloat(baseInfo.value.longitude)
  const R = 6371 // 地球半径（公里）
  const dLat = (lat - baseLat) * (Math.PI / 180)
  const dLon = (lon - baseLon) * (Math.PI / 180)
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(baseLat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  distance.value = R * c
}

// 设备详情跳转
const goToDeviceDetail = (deviceId: number) => {
  // 携带设备ID参数跳转到设备详情页
  router.push({
    name: 'device',
    params: { id: deviceId } // 假设路由配置中使用了参数，如path: '/device/:id'
  })
  // 或者如果路由不需要参数：
  // router.push({ name: 'device' })
}
</script>

<style scoped>
/* 全局容器 */
.container {
  min-height: 93vh;
  padding: 20px;
  background: url('/images/system3.jpg') center/cover no-repeat;
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

/* 设备卡片区域 */
.device-cards-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin-top: 20px;
}
.device-card {
  flex: 1 1 250px;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s;
  cursor: pointer; /* 添加指针样式，提示可点击 */
}
.device-card:hover { transform: translateY(-5px); }
.card-header {
  padding: 12px;
  color: white;
  font-weight: bold;
}
.card-body {
  padding: 15px;
}
.device-info {
  margin: 8px 0;
  text-align: left;
  font-size: 0.95rem;
}
.info-label {
  display: inline-block;
  width: 80px;
  font-weight: bold;
  color: #555;
}
.info-value { color: #333; }

/* 基地信息 + 按钮区域（核心修复：对齐） */
.base-info-container {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center; /* 垂直居中 */
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin-top: 20px;
}
.base-card {
  flex: 1;
  min-width: 200px;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-align: center;
}
.base-card-header {
  padding: 12px;
  background: #607D8B;
  color: white;
  font-weight: bold;
}
.base-card-body {
  padding: 15px;
  font-size: 1.1rem;
  color: #333;
}

/* 任务评估按钮（核心修复：尺寸 + 对齐） */
.assessment-btn {
  padding: 12px 24px;
  font-size: 1rem;
  color: white;
  background: #2196F3;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  align-self: center; /* 确保垂直居中 */
}
.assessment-btn:hover { background: #0b7dda; }

/* 弹窗（核心修复：输入框显示） */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.modal-title {
  margin-bottom: 20px;
  font-size: 1.2rem;
  text-align: center;
}
.input-group {
  margin-bottom: 15px;
}
.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}
.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  color: #333; /* 确保文字可见 */
}
.btn-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
.calc-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
.calc-btn {
  background: #4CAF50;
  color: white;
}
.calc-btn:hover { background: #45a049; }
.cancel-btn {
  background: #f44336;
  color: white;
}
.cancel-btn:hover { background: #d32f2f; }
.result {
  margin-top: 15px;
  text-align: center;
  color: #2e7d32;
  font-weight: bold;
}
</style>