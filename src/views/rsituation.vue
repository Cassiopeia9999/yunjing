<template>
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <!-- 顶部：故障情况（固定区） -->
    <section class="shrink-0 p-2">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold">故障情况</h3>
          <div class="text-xs text-neutral-500">实时</div>
        </div>

        <div v-if="diagnosis" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
            <div class="truncate"><span class="text-neutral-500">故障设备：</span>{{ diagnosis.device }}</div>
            <div class="truncate"><span class="text-neutral-500">诊断时间：</span>{{ diagnosis.diagnose_time }}</div>
            <div class="truncate"><span class="text-neutral-500">故障类型：</span>{{ diagnosis.fault_type }}</div>
            <div class="truncate"><span class="text-neutral-500">置信度：</span>{{ diagnosis.confidence }}</div>
            <div class="truncate"><span class="text-neutral-500">状态甄别：</span>{{ diagnosis.eva_status }}</div>
            <div class="truncate"><span class="text-neutral-500">故障等级：</span>{{ diagnosis.fault_level }}</div>
          </div>

          <div class="bg-neutral-50 dark:bg-neutral-800 text-sm p-3 rounded border border-dashed border-neutral-300 dark:border-neutral-600 whitespace-pre-line">
            <span class="text-neutral-500">详情：</span>{{ diagnosis.description || '无' }}
          </div>
        </div>
        <div v-else class="text-sm text-neutral-500">暂无故障信息</div>
      </div>
    </section>

    <!-- 内容滚动区 -->
    <section class="flex-1 min-h-0 overflow-auto p-2">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- 实时数据卡 -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold">
              {{ currentDeviceName || '—' }} 实时数据
            </h3>
            <div class="text-xs text-neutral-500">更新于：{{ latestUpdateTime }}</div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
                v-for="(item, index) in featureBlocks"
                :key="item.id || index"
                class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3 hover:shadow transition-shadow"
            >
              <div class="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mb-1 truncate" :title="item.feature_alias">
                {{ item.feature_alias }}
              </div>
              <div class="text-2xl font-semibold leading-tight">
                {{ item.value }}<span class="text-sm ml-1 opacity-70">{{ item.feature_unit }}</span>
              </div>
              <div
                  class="inline-flex items-center gap-1 mt-2 text-[12px] font-medium"
                  :class="{
                  'text-emerald-600': item.change_rate > 0,
                  'text-rose-600': item.change_rate < 0,
                  'text-neutral-500': item.change_rate === 0
                }"
              >
                <i
                    :class="{
                    'fa fa-arrow-up': item.change_rate > 0,
                    'fa fa-arrow-down': item.change_rate < 0,
                    'fa fa-minus': item.change_rate === 0
                  }"
                ></i>
                <span>{{ item.change_rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：ECharts 图表 -->
        <div class="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
          <div class="px-4 py-3 bg-primary text-white flex items-center justify-between">
            <h3 class="text-sm font-semibold">数据分析</h3>
            <div class="flex items-center gap-2">
              <button class="btn-ghost-white"><i class="fa fa-download mr-1"></i>导出</button>
              <button class="btn-ghost-white"><i class="fa fa-refresh mr-1"></i>刷新</button>
            </div>
          </div>
          <div class="p-4 h-[400px]" ref="chartContainer"></div>
        </div>
      </div>

      <!-- 表格 -->
      <div class="mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden">
        <div class="px-4 py-3 bg-primary/5 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 class="text-base font-semibold">设备数据展示</h2>
          <div class="flex items-center gap-2">
            <button class="btn-white" @click="fetchDeviceData"><i class="fa fa-refresh mr-1"></i>刷新</button>
            <button class="btn-white"><i class="fa fa-filter mr-1"></i>筛选</button>
          </div>
        </div>

        <div class="overflow-auto">
          <table class="w-full">
            <thead class="sticky top-0 z-10">
            <tr class="bg-neutral-50 dark:bg-neutral-800 text-left text-[12px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <th class="px-4 py-3 font-medium">文件名</th>
              <th class="px-4 py-3 font-medium">文件时间</th>
              <th class="px-4 py-3 font-medium">工作状态</th>
              <th class="px-4 py-3 font-medium">解析特征数量</th>
              <th class="px-4 py-3 font-medium">文件大小</th>
              <th class="px-4 py-3 font-medium text-right">操作</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
            <tr
                v-for="(item, index) in deviceData"
                :key="index"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm font-medium truncate" :title="item.file_name">{{ item.file_name }}</div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm">{{ item.collect_time }}</div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span :class="getStatusClass(item.work_situation)">{{ item.work_situation }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm">{{ item.feature_count }}</div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm text-neutral-500">{{ item.file_size }} MB</div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                <button class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm" @click="openDetailDialog(item)">查看详情</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button @click="prevPage" class="btn-white" :disabled="currentPage === 1">上一页</button>
            <button @click="nextPage" class="btn-white" :disabled="currentPage >= totalPages">下一页</button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-300">
              显示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
              到 <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
              条，共 <span class="font-medium">{{ totalCount }}</span> 条记录
            </p>
            <nav class="inline-flex rounded-md shadow-sm isolate">
              <button class="btn-white rounded-l-md" :disabled="currentPage === 1" @click="prevPage">
                <span class="sr-only">上一页</span><i class="fa fa-chevron-left"></i>
              </button>
              <button
                  v-for="page in Math.min(5, totalPages)"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                  'px-3 py-1 border text-sm',
                  page === currentPage
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                ]"
              >{{ page }}</button>
              <button class="btn-white rounded-r-md" :disabled="currentPage >= totalPages" @click="nextPage">
                <span class="sr-only">下一页</span><i class="fa fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </section>

    <!-- 详情弹窗（UI 同步） -->
    <div v-if="dialogVisible" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40"></div>
      <div class="relative mx-auto w-full max-w-lg mt-20 bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-neutral-200 dark:border-neutral-700">
          <h3 id="modal-title" class="text-lg font-semibold">{{ selectedItem.file_name }} 详情</h3>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-neutral-500">文件时间</p>
              <p class="text-sm font-medium">{{ selectedItem.collect_time }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500">工作状态</p>
              <p class="text-sm font-medium">
                <span :class="getStatusClass(selectedItem.work_situation)">{{ selectedItem.work_situation }}</span>
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500">解析特征数量</p>
              <p class="text-sm font-medium">{{ selectedItem.feature_count }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500">文件大小</p>
              <p class="text-sm font-medium">{{ selectedItem.file_size }} MB</p>
            </div>
          </div>

          <div class="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p class="text-xs text-neutral-500 mb-1">文件路径</p>
            <p class="text-sm font-medium truncate">{{ selectedItem.file_path }}</p>
          </div>

          <div class="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p class="text-xs text-neutral-500 mb-1">解析状态</p>
            <p class="text-sm font-medium">
              <span :class="getParseStatusClass(selectedItem.parse_status)">{{ selectedItem.parse_status }}</span>
            </p>
          </div>
        </div>
        <div class="px-5 py-3 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-end gap-2">
          <button class="btn-primary" @click="dialogVisible = false">确定</button>
          <button class="btn-white" @click="dialogVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue'
import * as echarts from 'echarts'
import { fetchTableData } from '@/api/querydata.js'
import { getSysConfigFormId } from "@/api/constant/form_constant.js";
import { useRouter } from 'vue-router';

// 实时特征数据
const featureBlocks = reactive([])

const currentDeviceName = ref('')        // 实时设备名称
const latestUpdateTime = ref('无')       // 实时更新时间（从 WebSocket 中取）

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
    const res = await fetchTableData(currentPage.value, pageSize.value, getSysConfigFormId("Real_Time_Device_Data"), {})
    deviceData.value = res.data.list || []
    totalCount.value = res.data.total || 0
  } catch (error) {
    console.error('设备数据加载失败:', error)
  }
}
const diagnosis = reactive({
  device: '',
  diagnose_time: '',
  fault_type: '',
  fault_code: '',
  fault_level: '',
  description: '',
  confidence: '',
  eva_status: '',
  creator: '',
  updater: '',
  id: null
})



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

function formatTime(timeStr) {
  if (!timeStr) return '无'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
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

      switch (data.type) {
        case 'FEATURE_DATA':
          if (Array.isArray(data.features)) {
            featureBlocks.splice(0, featureBlocks.length, ...data.features)
            // ✅ 设置设备名和更新时间
            currentDeviceName.value = data.device_name || '未知设备'
            latestUpdateTime.value = formatTime(data.send_time)
            fetchDeviceData()
          }
          break

        case 'FAULT_STATE':
          if (data.fault_state) {
            Object.assign(diagnosis, data.fault_state)
          }
          break

        default:
          console.warn('⚠️ 未知消息类型:', data.type)
      }

    } catch (err) {
      console.error('❌ WebSocket 消息解析失败:', err)
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
:root { --primary-color: #165DFF; }       /* 与全站一致 */
.bg-primary { background-color: var(--primary-color); }
.text-primary { color: var(--primary-color); }

/* 统一按钮 */
.btn-white {
  @apply inline-flex items-center gap-1 px-3 py-1 border rounded-md text-sm
  bg-white text-neutral-700 border-neutral-300
  hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-200
  dark:border-neutral-700 dark:hover:bg-neutral-800 disabled:opacity-50;
}
.btn-ghost-white {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded text-sm
  bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50;
}
.btn-primary {
  @apply inline-flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium
  text-white bg-[color:var(--primary-color)]
  hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2
  focus:ring-[color:var(--primary-color)];
}
</style>

