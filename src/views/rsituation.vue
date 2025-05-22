<template>
  <div class="container mx-auto px-1 py-2">
    <!-- 设备数据展示表格 -->
    <div class="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
      <div class="px-6 py-4 bg-primary text-black flex justify-between items-center">
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
              <div class="text-sm font-medium text-gray-900">{{ item.fileName }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ item.fileTime }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span
                    :class="{
                    'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800': item.status === '正常',
                    'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800': item.status === '警告',
                    'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800': item.status === '故障'
                  }"
                >{{ item.status }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ item.featureCount }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ item.fileSize }}
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
          <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            上一页
          </button>
          <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            下一页
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              显示第 <span class="font-medium">1</span> 到 <span class="font-medium">10</span> 条，共 <span class="font-medium">23</span> 条记录
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span class="sr-only">上一页</span>
                <i class="fa fa-chevron-left"><</i>
              </button>
              <button aria-current="page" class="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                1
              </button>
              <button class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                2
              </button>
              <button class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                3
              </button>
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
              <button class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                23
              </button>
              <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span class="sr-only">下一页</span>
                <i class="fa fa-chevron-right">
                  >
                </i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- 下半部分区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左下角3x3区域组件 -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-primary text-black flex justify-between items-center ">
          <h3 class="font-semibold ">实时监测</h3>
          <span class="text-xs bg-white/20 px-2 py-1 rounded-full">
            <i class="fa fa-clock-o mr-1"></i>更新于: 2025-05-19 10:30
          </span>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-3 gap-3">
            <!-- 第一行 -->
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">107MV.峭度</div>
              <div class="text-xl font-bold text-gray-800">85%</div>
              <div class="text-xs text-green-500 mt-1">
                <i class="fa fa-arrow-up"></i> 3.2%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">150MM.峭度</div>
              <div class="text-xl font-bold text-gray-800">128</div>
              <div class="text-xs text-green-500 mt-1">
                <i class="fa fa-arrow-up"></i> 5.7%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">151MM.峭度</div>
              <div class="text-xl font-bold text-gray-800">64</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 1.2%
              </div>
            </div>

            <!-- 第二行 -->
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">152MM.峭度</div>
              <div class="text-xl font-bold text-gray-800">92%</div>
              <div class="text-xs text-green-500 mt-1">
                <i class="fa fa-arrow-up"></i> 2.1%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">153MM.峭度</div>
              <div class="text-xl font-bold text-gray-800">42</div>
              <div class="text-xs text-gray-500 mt-1">
                <i class="fa fa-minus"></i> 0.0%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">f153MM.峰峰值</div>
              <div class="text-xl font-bold text-gray-800">15</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 4.3%
              </div>
            </div>

            <!-- 第三行 -->
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">153MM.震动烈度</div>
              <div class="text-xl font-bold text-gray-800">78%</div>
              <div class="text-xs text-green-500 mt-1">
                <i class="fa fa-arrow-up"></i> 1.8%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">150MM.8倍频幅值</div>
              <div class="text-xl font-bold text-gray-800">256</div>
              <div class="text-xs text-green-500 mt-1">
                <i class="fa fa-arrow-up"></i> 6.4%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">150MM.4倍频幅值</div>
              <div class="text-xl font-bold text-gray-800">32</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 2.9%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">151MM.1倍频幅值</div>
              <div class="text-xl font-bold text-gray-800">32</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 2.9%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">107MV.振动烈度</div>
              <div class="text-xl font-bold text-gray-800">32</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 2.9%
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-500 mb-2">150MM.2倍频幅值</div>
              <div class="text-xl font-bold text-gray-800">32</div>
              <div class="text-xs text-red-500 mt-1">
                <i class="fa fa-arrow-down"></i> 2.9%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右下角ECharts组件 -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
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
                  {{ selectedItem.fileName }} 详情
                </h3>
                <div class="mt-2">
                  <div class="border-t border-gray-200 py-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm text-gray-500">文件时间</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.fileTime }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">工作状态</p>
                        <p class="text-sm font-medium text-gray-900">
                          <span
                              :class="{
                              'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800': selectedItem.status === '正常',
                              'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800': selectedItem.status === '警告',
                              'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800': selectedItem.status === '故障'
                            }"
                          >{{ selectedItem.status }}</span>
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">解析特征数量</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.featureCount }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">文件大小</p>
                        <p class="text-sm font-medium text-gray-900">{{ selectedItem.fileSize }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="border-t border-gray-200 py-4">
                    <p class="text-sm text-gray-500 mb-2">文件路径</p>
                    <p class="text-sm font-medium text-gray-900 truncate">{{ selectedItem.filePath }}</p>
                  </div>
                  <div class="border-t border-gray-200 py-4">
                    <p class="text-sm text-gray-500 mb-2">解析状态</p>
                    <p class="text-sm font-medium text-gray-900">
                      <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">已解析</span>
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
import {ref, onMounted, onBeforeUnmount} from 'vue';
import * as echarts from 'echarts';

// 模拟设备数据
const deviceData = ref([
  {
    fileName: '设备A_20250519_0800.dat',
    fileTime: '2025-05-19 08:00:00',
    status: '正常',
    featureCount: 156,
    fileSize: '2.4 MB',
    filePath: '/data/device_a/2025/05/19/设备A_20250519_0800.dat'
  },
  {
    fileName: '设备B_20250519_0800.dat',
    fileTime: '2025-05-19 08:00:00',
    status: '警告',
    featureCount: 98,
    fileSize: '1.8 MB',
    filePath: '/data/device_b/2025/05/19/设备B_20250519_0800.dat'
  },
  {
    fileName: '设备C_20250519_0800.dat',
    fileTime: '2025-05-19 08:00:00',
    status: '正常',
    featureCount: 212,
    fileSize: '3.2 MB',
    filePath: '/data/device_c/2025/05/19/设备C_20250519_0800.dat'
  },
  {
    fileName: '设备A_20250519_0700.dat',
    fileTime: '2025-05-19 07:00:00',
    status: '正常',
    featureCount: 165,
    fileSize: '2.5 MB',
    filePath: '/data/device_a/2025/05/19/设备A_20250519_0700.dat'
  },
  {
    fileName: '设备B_20250519_0700.dat',
    fileTime: '2025-05-19 07:00:00',
    status: '故障',
    featureCount: 76,
    fileSize: '1.2 MB',
    filePath: '/data/device_b/2025/05/19/设备B_20250519_0700.dat'
  },
  {
    fileName: '设备C_20250519_0700.dat',
    fileTime: '2025-05-19 07:00:00',
    status: '正常',
    featureCount: 201,
    fileSize: '3.1 MB',
    filePath: '/data/device_c/2025/05/19/设备C_20250519_0700.dat'
  },
  {
    fileName: '设备A_20250519_0600.dat',
    fileTime: '2025-05-19 06:00:00',
    status: '正常',
    featureCount: 148,
    fileSize: '2.3 MB',
    filePath: '/data/device_a/2025/05/19/设备A_20250519_0600.dat'
  },
  {
    fileName: '设备B_20250519_0600.dat',
    fileTime: '2025-05-19 06:00:00',
    status: '正常',
    featureCount: 102,
    fileSize: '1.9 MB',
    filePath: '/data/device_b/2025/05/19/设备B_20250519_0600.dat'
  },
  {
    fileName: '设备C_20250519_0600.dat',
    fileTime: '2025-05-19 06:00:00',
    status: '警告',
    featureCount: 189,
    fileSize: '2.9 MB',
    filePath: '/data/device_c/2025/05/19/设备C_20250519_0600.dat'
  },
  {
    fileName: '设备A_20250519_0500.dat',
    fileTime: '2025-05-19 05:00:00',
    status: '正常',
    featureCount: 153,
    fileSize: '2.4 MB',
    filePath: '/data/device_a/2025/05/19/设备A_20250519_0500.dat'
  }
]);

// 弹窗相关
const dialogVisible = ref(false);
const selectedItem = ref(null);

// 打开详情弹窗
const openDetailDialog = (item) => {
  selectedItem.value = { ...item };
  dialogVisible.value = true;
};

// ECharts容器
const chartContainer = ref(null);
let chartInstance = null;

// 初始化图表
const initChart = () => {
  // 基于准备好的dom，初始化echarts实例
  chartInstance = echarts.init(chartContainer.value);

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
  };

  // 使用刚指定的配置项和数据显示图表。
  chartInstance.setOption(option);
};

// 窗口大小变化时重绘图表
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时销毁图表并移除事件监听
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
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