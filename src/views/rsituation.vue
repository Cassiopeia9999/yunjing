<template>
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <!-- 顶部：故障情况（固定区） -->
    <section class="shrink-0 p-2">
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold">故障情况</h3>
          <div class="text-xs text-neutral-500">实时</div>
        </div>

        <!-- 基础信息行 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-sm mb-3">
          <div class="truncate"><span class="text-neutral-500">故障设备：</span>{{ baseInfo.device || currentDeviceName || '—' }}</div>
          <div class="truncate"><span class="text-neutral-500">最新诊断时间：</span>{{ baseInfo.latest_time || '—' }}</div>
          <div class="truncate"><span class="text-neutral-500">故障条数：</span>{{ diagnoses.length }}</div>
          <div class="truncate"><span class="text-neutral-500">最高置信度：</span>{{ baseInfo.max_confidence ?? '—' }}</div>
          <div class="truncate"><span class="text-neutral-500">最近状态甄别：</span>{{ baseInfo.latest_status || '—' }}</div>
          <div class="truncate"><span class="text-neutral-500">最近故障等级：</span>{{ baseInfo.latest_level || '—' }}</div>
        </div>

        <!-- 故障列表 -->
        <!-- 故障列表：轻量一行条目 + 可展开详情 -->
        <div v-if="diagnoses.length" class="divide-y divide-neutral-200 dark:divide-neutral-700">
          <div
              v-for="(f, idx) in diagnoses"
              :key="f.id || idx"
              class="px-2 sm:px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
          >
            <!-- 第一行：精简信息 -->
            <div class="flex items-center gap-3 text-sm">
              <span class="text-neutral-400 w-8 shrink-0">#{{ idx + 1 }}</span>

              <span class="shrink-0">
        <span class="text-neutral-500">类型：</span>{{ f.fault_type || '—' }}
      </span>
              <span class="ml-auto text-xs text-neutral-500">
        {{ f.diagnose_time || '—' }}
      </span>

              <button
                  class="ml-2 text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600
               hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  @click="toggleExpand(idx)"
              >
                {{ expandedIndex === idx ? '收起' : '更多' }}
              </button>
            </div>

            <!-- 第二行：展开的更多信息（可选） -->
            <div v-if="expandedIndex === idx" class="mt-2 text-sm">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div><span class="text-neutral-500">故障代码：</span>{{ f.fault_code || '—' }}</div>
                <div><span class="text-neutral-500">创建人：</span>{{ f.creator || '—' }}</div>
                <div><span class="text-neutral-500">更新人：</span>{{ f.updater || '—' }}</div>
                <div><span class="text-neutral-500">设备：</span>{{ f.device || baseInfo.device || '—' }}</div>
              </div>
              <div class="mt-2 bg-neutral-50 dark:bg-neutral-800 text-sm p-3 rounded border border-dashed
                  border-neutral-300 dark:border-neutral-600 whitespace-pre-line">
                <span class="text-neutral-500">详情：</span>{{ f.description || '无' }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-neutral-500">暂无故障信息</div>


      </div>
    </section>


    <!-- 内容滚动区 -->
    <section class="flex-1 min-h-0 overflow-auto p-2">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- 实时数据卡 -->
        <!-- 替换后的左侧：质量散点图 -->
        <DeviceQualityScatter
            v-if="currentDeviceName"
            :device-key="currentDeviceName"
            :default-days="100"
            :title-prefix="`${currentDeviceName} `"
        />

        <DeviceQualityScatter
            v-else
            device-key="未知设备"
            :default-days="100"
            title-prefix="未知设备 "
        />

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
              <th class="px-4 py-3 font-medium">采集时间</th>
              <th class="px-4 py-3 font-medium">通道数</th>
              <th class="px-4 py-3 font-medium">文件质量</th>
              <th class="px-4 py-3 font-medium">特征质量</th>
              <th class="px-4 py-3 font-medium">工作状态</th>
              <th class="px-4 py-3 font-medium">特征点数</th>
              <th class="px-4 py-3 font-medium">大小(MB)</th>
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
                <div class="text-sm">{{ item.channel_count }}</div>
              </td>

              <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-800/40 dark:text-purple-200">
                      {{ item.file_quality || '—' }}
                    </span>
                                </td>

                                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-800/40 dark:text-cyan-200">
                      {{ item.feature_quality || '—' }}
                    </span>
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
                <button
                    class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                    @click="openDetailDialog(item)"
                >
                  查看详情
                </button>
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
                  @click="() => { currentPage.value = page; fetchDeviceData() }"
                  :class="[
                        'px-3 py-1 border text-sm',
                        page === currentPage
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      ]"
                   >
                {{ page }}
              </button>

              <button class="btn-white rounded-r-md" :disabled="currentPage >= totalPages" @click="nextPage">
                <span class="sr-only">下一页</span><i class="fa fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </section>

    <!-- 详情弹窗（优化 + 右上角关闭按钮） -->
    <div v-if="dialogVisible" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <!-- 半透明遮罩 -->
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="dialogVisible = false"></div>

      <!-- 弹窗容器 -->
      <div
          class="relative w-full max-w-4xl mx-auto mt-16 mb-10 bg-white dark:bg-neutral-900
           rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700
           text-neutral-900 dark:text-neutral-100 overflow-hidden"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 class="text-lg font-semibold truncate pr-4">
            {{ selectedItem.file_name || '文件详情' }}
          </h3>
          <button
              class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              @click="dialogVisible = false"
          >
            <i class="fa fa-times text-lg"></i>
          </button>
        </div>

        <!-- 内容主体 -->
        <div class="p-6 space-y-6 text-sm leading-relaxed overflow-y-auto max-h-[80vh]">
          <!-- 基础信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div><p class="label">文件名</p><p class="value">{{ selectedItem.file_name || '—' }}</p></div>
            <div><p class="label">采集时间</p><p class="value">{{ selectedItem.collect_time || '—' }}</p></div>
            <div><p class="label">文件大小(MB)</p><p class="value">{{ selectedItem.file_size }} MB</p></div>
            <div><p class="label">解析状态</p>
              <span :class="getParseStatusClass(selectedItem.parse_status)">
            {{ selectedItem.parse_status || '—' }}
          </span>
            </div>
            <div><p class="label">工作状态</p>
              <span :class="getStatusClass(selectedItem.work_situation)">
            {{ selectedItem.work_situation || '—' }}
          </span>
            </div>
            <div><p class="label">特征点数</p><p class="value">{{ selectedItem.feature_count ?? '—' }}</p></div>
            <div><p class="label">通道数</p><p class="value">{{ selectedItem.channel_count ?? '—' }}</p></div>
            <div><p class="label">文件质量</p>
              <span class="tag-purple">{{ selectedItem.file_quality || '—' }}</span>
            </div>
            <div><p class="label">特征质量</p>
              <span class="tag-cyan">{{ selectedItem.feature_quality || '—' }}</span>
            </div>
          </div>

          <!-- 文件Meta -->
          <div>
            <p class="label">文件质量原始值</p>
            <div class="block-box font-mono">{{ selectedItem.file_meta || '—' }}</div>
          </div>

          <hr class="border-neutral-200 dark:border-neutral-700"/>

          <!-- 文件路径 -->
          <div>
            <p class="label">文件路径</p>
            <div class="block-box">{{ selectedItem.file_path || '—' }}</div>
          </div>

          <!-- 通道名称 -->
          <div>
            <p class="label">通道名称</p>
            <div class="block-box">{{ selectedItem.channel_names || '—' }}</div>
          </div>

          <!-- 特征快照 -->
          <div>
            <p class="label">特征快照</p>
            <pre class="block-pre font-mono">{{ selectedItem.feature_snapshot || '—' }}</pre>
          </div>

          <!-- 备注 -->
          <div>
            <p class="label">备注</p>
            <div class="block-box">{{ selectedItem.remark || '—' }}</div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <button class="btn-primary" @click="dialogVisible = false">关闭</button>
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
import DeviceQualityScatter from "@/buz/device/DeviceQualityScatter.vue";

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
// ▼ 新增：存放多条故障
const diagnoses = ref([])
// 展开/收起控制
const expandedIndex = ref(-1)
const toggleExpand = (idx) => {
  expandedIndex.value = (expandedIndex.value === idx ? -1 : idx)
}

// 你之前已定义的 levelClass / confidenceClass 可复用；若未引入，参考：
// const levelClass = (lvl) => { ... }
// const confidenceClass = (c) => { ... }

// ▼ 新增：顶部基础信息（由多条故障汇总）
const baseInfo = computed(() => {
  if (!diagnoses.value.length) {
    return { device: currentDeviceName.value || '', latest_time: '', max_confidence: null, latest_status: '', latest_level: '' }
  }
  // 取最新时间与最高置信度
  const latest = [...diagnoses.value].sort((a,b) => new Date(b.diagnose_time||0) - new Date(a.diagnose_time||0))[0]
  const maxc  = diagnoses.value.reduce((m, x) => {
    const c = typeof x.confidence === 'number' ? x.confidence : parseFloat(x.confidence)
    return isNaN(c) ? m : Math.max(m, c)
  }, -Infinity)
  return {
    device: latest?.device || currentDeviceName.value || '',
    latest_time: latest?.diagnose_time || '',
    max_confidence: (maxc === -Infinity ? null : maxc),
    latest_status: latest?.eva_status || '',
    latest_level: latest?.fault_level || ''
  }
})

// ▼ 新增：标签着色
const levelClass = (lvl) => {
  const cls = 'px-2 py-0.5 text-xs rounded-full'
  if (['紧急','P1','高'].includes(lvl)) return `${cls} bg-red-100 text-red-800`
  if (['中','P2'].includes(lvl)) return `${cls} bg-amber-100 text-amber-800`
  if (['低','P3'].includes(lvl)) return `${cls} bg-green-100 text-green-800`
  return `${cls} bg-gray-100 text-gray-800`
}
const confidenceClass = (c) => {
  const v = typeof c === 'number' ? c : parseFloat(c)
  const cls = 'px-2 py-0.5 text-xs rounded-full'
  if (!isNaN(v) && v >= 0.8) return `${cls} bg-indigo-100 text-indigo-800`
  if (!isNaN(v) && v >= 0.6) return `${cls} bg-blue-100 text-blue-800`
  if (!isNaN(v))            return `${cls} bg-gray-100 text-gray-800`
  return `${cls} bg-gray-100 text-gray-800`
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
            const arr = Array.isArray(data.fault_state) ? data.fault_state : [data.fault_state]
            // 只保留必要字段，避免脏数据导致显示异常；并限制 2~5 条（有更多时截取最新）
            const list = arr
                .filter(Boolean)
                .map(x => ({
                  device: x.device ?? currentDeviceName.value ?? '',
                  diagnose_time: x.diagnose_time ?? x.time ?? '',
                  fault_type: x.fault_type ?? '',
                  fault_code: x.fault_code ?? '',
                  fault_level: x.fault_level ?? '',
                  description: x.description ?? '',
                  confidence: x.confidence ?? '',
                  eva_status: x.eva_status ?? '',
                  creator: x.creator ?? '',
                  updater: x.updater ?? '',
                  id: x.id ?? undefined
                }))
                .sort((a,b) => new Date(b.diagnose_time||0) - new Date(a.diagnose_time||0))
            diagnoses.value = list.slice(0, 5) // 只展示前 5 条
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

  // mock 示例（可注释/删除）
  if (!diagnoses.value.length) {
    diagnoses.value = Array.from({length: Math.floor(Math.random()*3)+2}).map((_,i)=>({
      device: currentDeviceName.value || '设备A',
      diagnose_time: new Date(Date.now()-i*3600*1000).toISOString(),
      fault_type: ['过热','振动','电流异常'][i%3],
      fault_code: `F-${100+i}`,
      fault_level: ['高','中','低'][i%3],
      description: '示例：请检查轴承温度与润滑状态。',
      confidence: (0.55 + 0.1*i).toFixed(2),
      eva_status: ['疑似','确认','复现'][i%3],
      creator: '系统',
      updater: '系统',
      id: i+1
    }))
  }

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

.label {
  @apply text-[12px] text-neutral-500 dark:text-neutral-400 mb-1;
}
.value {
  @apply font-medium break-all;
}
.block-box {
  @apply text-[13px] leading-relaxed break-all rounded border border-neutral-200 dark:border-neutral-700
  bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-800 dark:text-neutral-200;
}
.block-pre {
  @apply max-h-56 overflow-auto rounded border border-neutral-300 dark:border-neutral-600
  bg-neutral-50 dark:bg-neutral-800 text-[12px] leading-relaxed p-3 whitespace-pre-wrap break-all
  text-neutral-700 dark:text-neutral-200;
}
.tag-purple {
  @apply inline-block px-2 py-0.5 rounded text-[12px] bg-purple-100 text-purple-800 dark:bg-purple-800/40 dark:text-purple-200 font-medium;
}
.tag-cyan {
  @apply inline-block px-2 py-0.5 rounded text-[12px] bg-cyan-100 text-cyan-800 dark:bg-cyan-800/40 dark:text-cyan-200 font-medium;
}
</style>

