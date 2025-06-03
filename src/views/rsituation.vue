<template>
  <div class="container mx-auto px-1 py-1">
    <div class="bg-white text-white p-2 mb-3">
      <h3 class="text-xm font-bold mb-2 text-black">故障情况</h3>

      <div class="grid grid-cols-5 gap-4">
        <!-- 故障设备 -->
        <div class="bg-gray-50 p-2  rounded-lg hover:shadow-md border border-gray-200" style="height: 32px;">
          <div class="flex justify-between items-center ">
            <div class="text-xs font-medium text-gray-500 leading-tight">故障设备</div>
            <div class="text-xs font-bold text-gray-800">
              DEV-003
            </div>
          </div>
        </div>

        <!-- 故障发生时间 -->
        <div class="bg-gray-50 p-2 rounded-lg hover:shadow-md border border-gray-200" style="height: 32px;">
          <div class="flex justify-between items-center">
            <div class="text-xs font-medium text-gray-500">故障发生时间</div>
            <div class="text-xs font-bold text-gray-800">
              2025-05-26 17:13:00
            </div>
          </div>
        </div>

        <!-- 故障信息1 -->
        <div class="bg-gray-50 p-2 rounded-lg hover:shadow-md border border-gray-200" style="height: 32px;">
          <div class="flex justify-between items-center">
            <div class="text-xs font-medium text-gray-500">故障信息1</div>
            <div class="text-xs font-bold text-gray-800">
              电机温度异常
            </div>
          </div>
        </div>

        <!-- 故障信息2 -->
        <div class="bg-gray-50 p-2 rounded-lg hover:shadow-md border border-gray-200" style="height: 32px;">
          <div class="flex justify-between items-center">
            <div class="text-xs font-medium text-gray-500">故障信息2</div>
            <div class="text-xs font-bold text-gray-800">
              振动幅度超标
            </div>
          </div>
        </div>

        <!-- 故障信息3 -->
        <div class="bg-gray-50 p-2 rounded-lg hover:shadow-md border border-gray-200" style="height: 32px;">
          <div class="flex justify-between items-center">
            <div class="text-xs font-medium text-gray-500">故障信息3</div>
            <div class="text-xs font-bold text-gray-800">
              转速波动过大
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-3">
      <div class="bg-white p-4 rounded-lg shadow-sm hover:shadow-md ">
        <!-- 标题区域 -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-black font-semibold">实时数据</h3>
          <div class="text-xs text-gray-500">
            更新于: {{ latestUpdateTime }}
          </div>
        </div>

        <!-- 数据展示区域 - 使用响应式网格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
              v-for="(item, index) in featureBlocks"
              :key="item.id || index"
              class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div class="text-xs font-medium text-gray-500 mb-2">{{ item.name }}</div>
            <div class="text-xl font-bold text-gray-800">
              {{ item.value }}{{ item.unit }}
            </div>
            <div
                class="text-xs mt-1"
                :class="{
                  'text-green-500': item.change_rate > 0,
                  'text-red-500': item.change_rate < 0,
                  'text-gray-500': item.change_rate === 0
                }"
            >
              <i
                  :class="{
                    'fa fa-arrow-up': item.change_rate > 0,
                    'fa fa-arrow-down': item.change_rate < 0,
                    'fa fa-minus': item.change_rate === 0
                  }"
              ></i>
              {{ item.change_rate }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 右下角ECharts组件 -->
      <div class="lg:col-span-2 bg-white rounded-lg hover:shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-primary text-white flex justify-between items-center">
          <h3 class="font-semibold">数据分析</h3>
          <div class="flex space-x-2">
            <button class="bg-white/20 text-white px-3 py-1 rounded text-sm hover:bg-white/30 transition-colors">
              <i class="fa fa-download mr-1"></i>导出
            </button>
            <button class="bg-white/20 text-white px-3 py-1 rounded text-sm hover:bg-white/30 transition-colors">
              <i class="fa fa-refresh mr-1"></i>刷新
            </button>
          </div>
        </div>
        <div class="p-4 h-[400px]" ref="chartContainer"></div>
      </div>
    </div>

    <!-- 设备数据展示表格 -->
    <div class="mb-8 bg-white rounded-lg hover:shadow-lg  overflow-hidden ">
      <div class="px-6 py-4 bg-primary text-black flex justify-between items-center ">
        <h2 class="text-xl font-semibold">设备数据展示</h2>
        <div class="flex space-x-2">
          <button class="bg-white text-primary px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors">
            <i class="fa fa-refresh mr-1"></i>刷新
          </button>
          <button class="bg-white text-primary px-3 py-1 rounded text-sm hover:bg-gray-100 transition-colors">
            <i class="fa fa-filter mr-1"></i>筛选
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
          <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th class="px-6 py-3">文件名</th>
            <th class="px-6 py-3">文件时间</th>
            <th class="px-6 py-3">工作状态</th>
            <th class="px-6 py-3">解析特征数量</th>
            <th class="px-6 py-3">文件大小</th>
            <th class="px-6 py-3 text-right">操作</th>
          </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in deviceData" :key="index" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ item.file_name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ item.collect_time }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(item.work_situation)">{{ item.work_situation }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ item.feature_count }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ item.file_size }} MB
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                  class="text-indigo-600 hover:text-indigo-900 transition-colors"
                  @click="openDetailDialog(item)"
              >查看详情</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
              @click="prevPage"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            上一页
          </button>
          <button
              @click="nextPage"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              显示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
              到 <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
              条，共 <span class="font-medium">{{ totalCount }}</span> 条记录
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                  :disabled="currentPage === 1"
                  @click="prevPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">上一页</span>
                <i class="fa fa-chevron-left"></i>
              </button>

              <!-- 简化的页码显示 -->
              <button
                  v-for="page in Math.min(5, totalPages)"
                  :key="page"
                  :class="{
                  'z-10 bg-indigo-50 border-indigo-500 text-indigo-600': page === currentPage,
                  'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': page !== currentPage
                }"
                  @click="currentPage = page"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                {{ page }}
              </button>

              <button
                  :disabled="currentPage >= totalPages"
                  @click="nextPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">下一页</span>
                <i class="fa fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="dialogVisible" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {{ selectedItem.file_name }} 详情
                </h3>
                <div class="mt-2">
                  <div class="border-t border-gray-200 py-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm text-gray-500">文件时间</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.collect_time }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">工作状态</p>
                        <p class="text-sm font-medium text-gray-900">
                          <span :class="getStatusClass(selectedItem.work_situation)">{{ selectedItem.work_situation }}</span>
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">解析特征数量</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.feature_count }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">文件大小</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.file_size }} MB</p>
                      </div>
                    </div>
                  </div>
                  <div class="border-t border-gray-200 py-4">
                    <p class="text-sm text-gray-500 mb-2">文件路径</p>
                    <p class="text-sm font-medium text-gray-900 truncate">{{ selectedItem.file_path }}</p>
                  </div>
                  <div class="border-t border-gray-200 py-4">
                    <p class="text-sm text-gray-500 mb-2">解析状态</p>
                    <p class="text-sm font-medium text-gray-900">
                      <span :class="getParseStatusClass(selectedItem.parse_status)">{{ selectedItem.parse_status }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm" @click="dialogVisible = false">
              确定
            </button>
            <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" @click="dialogVisible = false">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/querydata.js'
import { Real_Time_Device_Data } from "@/api/form_constant.js";
import { useRouter } from 'vue-router';

// 实时特征数据
const featureBlocks = reactive([])
const latestUpdateTime = computed(() => {
  if (featureBlocks.length > 0 && featureBlocks[0].fault_state) {
    return featureBlocks[0].fault_state.occurred_at || '未知时间'
  }
  return '无更新数据'
})

// WebSocket 地址自动构建
const baseApi = import.meta.env.VITE_APP_BASE_API
const wsUrl = (() => {
  if (baseApi.startsWith('http')) {
    return baseApi.replace(/^http/, 'ws') + '/socket/diagnosis/monitor'
  } else {
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${baseApi}/socket/diagnosis/monitor`
  }
})()

let socket = null

// 设备数据和分页状态
const deviceData = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 获取设备数据函数
const fetchDeviceData = async () => {
  try {
    const res = await fetchTableData(currentPage.value, pageSize.value, Real_Time_Device_Data, {})
    deviceData.value = res.data.list || []
    totalCount.value = res.data.total || 0
  } catch (error) {
    console.error('设备数据加载失败:', error)
  }
}

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value) || 1
})

// 分页操作
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchDeviceData()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchDeviceData()
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  socket = new WebSocket(wsUrl)
  socket.onopen = () => {
    console.log('✅ Diagnosis WebSocket 已连接')
  }
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (Array.isArray(data.features)) {
        featureBlocks.splice(0, featureBlocks.length, ...data.features)
      }
      // 每次WebSocket更新时刷新设备数据
      fetchDeviceData()
    } catch (err) {
      console.error('接收 WebSocket 消息出错:', err)
    }
  }
  socket.onerror = (err) => {
    console.error('❌ WebSocket 错误', err)
  }
  socket.onclose = () => {
    console.warn('⚠️ WebSocket 断开，3秒后重连')
    setTimeout(connectWebSocket, 3000)
  }
}

// 状态样式计算
const getStatusClass = (status) => {
  return {
    'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800': status === '正常',
    'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800': status === '低报',
    'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800': status === '高报'
  }
}

// 解析状态样式计算
const getParseStatusClass = (status) => {
  return {
    'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800': status === '已解析',
    'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800': status === '未解析',
    'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800': status === '失败'
  }
}

// 弹窗相关
const dialogVisible = ref(false)
const selectedItem = ref(null)

// 打开详情弹窗
const openDetailDialog = (item) => {
  selectedItem.value = { ...item }
  dialogVisible.value = true
}

// ECharts容器
const chartContainer = ref(null)
let chartInstance = null

// 初始化图表
const initChart = () => {
  // 基于准备好的dom，初始化echarts实例
  chartInstance = echarts.init(chartContainer.value)

  // 指定图表的配置项和数据
  const option = {
    title: {
      text: '设备状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['正常', '警告', '故障']
    },
    series: [
      {
        name: '设备数量',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: [
          { value: 6, name: '正常' },
          { value: 3, name: '警告' },
          { value: 1, name: '故障' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  // 使用刚指定的配置项和数据显示图表
  chartInstance.setOption(option)
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 生命周期钩子
onMounted(() => {
  connectWebSocket()
  initChart()
  fetchDeviceData() // 初始化加载设备数据
  window.addEventListener('resize', handleResize)
})

// 组件卸载时销毁图表并移除事件监听
onBeforeUnmount(() => {
  if (socket) socket.close()
  if (chartInstance) chartInstance.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 定义主色调 */
:root {
  --primary-color: #165DFF;
}

.bg-primary {
  background-color: var(--primary-color);
}

.text-primary {
  color: var(--primary-color);
}

/* 自定义过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>