<template>
  <div class="container" v-if="isload">
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <i class="fa fa-arrow-left "></i>全局地图
      </button>
    </div>
    <!-- 标题 -ss->
    <h1 class="title">{{baseName}}基地</h1>

    <!-- 设备卡片区域 -->
    <div class="device-cards-container" v-if="devices.length">
      <div
          class="device-card"
          v-for="device in devices"
          :key="device.name"
          @click="goToDeviceDetail(device.name)"
      >
        <div class="card-header" :style="{ backgroundColor: getStatusColor(device.status) }">
          <h3 class="device-name">{{ device.name }}</h3>
        </div>
        <div class="card-body">
          <p class="device-info">
            <span class="info-label">运行状态:</span>
            <span class="info-value" :style="{ color: getStatusColor(device.status) }">{{ device.status }}</span>
          </p>
          <p class="device-info">
            <span class="info-label">剩余寿命:</span>
            <span class="info-value">{{device.nextMaintenance }}天</span>
          </p>
          <p class="device-info">
            <span class="info-label">置信度:</span>
            <span class="info-value">{{ device.conf }}%</span>
          </p>
        </div>
      </div>
    </div>
    <div v-else class="text-black text-2xl m-10">
      暂无设备数据
    </div>

    <!-- 基地信息 + 任务按钮区域 -->
    <div class="base-info-container">
      <!-- 基地名称卡片 -->
      <div class="base-card">
        <div class="base-card-header">基地名称</div>
        <div class="base-card-body">{{ baseName }}</div>
      </div>

      <!-- 基地经纬度卡片 -->
      <div class="base-card">
        <div class="base-card-header">基地经纬度</div>
        <div class="base-card-body">{{ latitude }}, {{ longitude }}</div>
      </div>

      <!-- 空闲装置卡片 -->
      <div class="base-card">
        <div class="base-card-header">基地装置数量</div>
        <div class="base-card-body">{{ systemNames.length }}</div>
      </div>

      <!-- 任务评估按钮（核心修复：对齐 + 尺寸） -->
      <button class="assessment-btn" @click="openAssessmentModal">
        任务评估
      </button>
    </div>

    <!-- 弹窗（核心修复：输入框显示 + 按钮样式） -->
    <DeviceAssessmentModal
        v-if="showAssessmentModal"
        :devices="devices"
        :baseLat="latitude"
        :baseLon="longitude"
        @close="closeAssessmentModal"
        @calculate-result="handleCalculationResult"
    />
  </div>
</template>

<script setup lang="ts">

import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {fetchTableData} from '@/api/querydata.js'
import {getSysConfigFormId} from '@/api/constant/form_constant.js'
import DeviceAssessmentModal from "@/buz/eavalue/DeviceAssessmentModal.vue";





// 设备数据（固定状态）
const devices = ref([])

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

const route = useRoute()
const baseName = ref('')
const longitude = ref(null)
const latitude = ref(null)
const systemNames = ref([])
// 获取路由实例
const router = useRouter()
const isload = ref(false)
// 状态定义
const showAssessmentModal = ref(false)

// 打开弹窗
const openAssessmentModal = () => {
  showAssessmentModal.value = true
  assessmentResult.value = ''
}

// 关闭弹窗（通过子组件事件触发）
const closeAssessmentModal = () => {
  showAssessmentModal.value = false
}
// 状态颜色映射
const getStatusColor = (status: string) => {
  return {
    '在运': '#4CAF50',
    '建设中': '#FFC107',
    '停运': '#F44336',
  }[status] || '#9E9E9E'
}

// 日期格式化
const formatDate = (dateStr: string) => dateStr.replace(' ', 'T')

// 弹窗控制

const closeModal = () => (isModalOpen.value = false)

// 距离计算（Haversine公式）


// 设备详情跳转


onMounted(async () => {
  baseName.value = route.query.baseName
  longitude.value = route.query.longitude
  latitude.value = route.query.latitude

  const res = await fetchTableData(1, 10, UNIT_FORM_ID, {})
  const data = res.data.list || []

  systemNames.value = data.filter(item =>
      item.parent_site?.name === baseName.value
  ).map(item => item.system_name)

  devices.value = data.filter(item =>
      item.parent_site?.name === baseName.value
  ).map(item =>({
    name:item.system_name,
    status: item.system_status,
    nextMaintenance:item.remaining_life,
    conf:item.confidence_level,
    sailing_speed:item.sailing_speed

  }));
  isload.value = true
})
const calculateDistance = () => {
  const lat = parseFloat(inputLat.value)
  const lon = parseFloat(inputLon.value)
  if (isNaN(lat) || isNaN(lon)) return alert('请输入有效的经纬度！')
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return alert('经纬度超出范围！')

  const baseLat = parseFloat(latitude.value)
  const baseLon = parseFloat(longitude.value)
  const R = 6371 // 地球半径（公里）
  const dLat = (lat - baseLat) * (Math.PI / 180)
  const dLon = (lon - baseLon) * (Math.PI / 180)
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(baseLat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  distance.value = R * c
}
const goToDeviceDetail = (devicename: string) => {
  // 携带设备ID参数跳转到设备详情页
  router.push({
    name: 'device',
    query:{
      baseName:baseName.value,
      longitude:longitude.value,
      latitude:latitude.value,
      devicename:devicename
    }

  })
  // 或者如果路由不需要参数：
  // router.push({ name: 'device' })
}
const goBack = () => {
  router.push({
    name: 'GlobalView',
})
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

.back-button-container {
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 3; /* 确保按钮在最上层 */
}
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
</style>