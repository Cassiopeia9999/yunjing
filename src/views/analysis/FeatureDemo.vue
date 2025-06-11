<template>
  <div class="p-2 h-full">
    <div class="flex h-full gap-3">
      <!-- 左侧 -->
      <div class="lg:w-[300px] h-full overflow-auto">
        <el-card shadow="hover" class="mb-3">
          <img src="/images/R-C.jpg" alt="图标" class="w-full rounded" />
        </el-card>
        <div class="flex justify-between items-center px-2">
          <span class="text-lg font-semibold">数据选择</span>
          <el-button @click="toggleFilter" size="small">{{ showFilter ? '收起' : '展开' }}</el-button>
        </div>
        <PointSelector :showFeatureSelector="false" :cacheKey="'featureDemo'"  @data-ready="handleSelectedPoints" />
        <el-checkbox-group v-model="selectedFeatureNames" class="flex flex-wrap gap-2 mt-4 px-2">
          <el-checkbox v-for="name in availableFeatureNames" :key="name" :label="name">{{ name }}</el-checkbox>
        </el-checkbox-group>
      </div>
      <!-- 右侧 -->
      <div class="flex-1 h-full flex flex-col overflow-hidden">
        <!-- 固定顶部（时间过滤区域 + 设置按钮） -->
        <div class="bg-white z-10 shadow-sm px-2 pb-2">
          <!-- 时间过滤面板 -->
          <div class="mb-2 flex items-center gap-4">
            <!-- 周期选择 -->
            <el-select
                v-model="selectedPeriodName"
                placeholder="请选择周期"
                style="width: 160px;"
                clearable
                @change="onPeriodChange"
            >
              <el-option
                  v-for="item in periodOptions"
                  :key="item.period_name"
                  :label="item.period_name"
                  :value="item.period_name"
              />
            </el-select>


            <!-- 时间范围选择 -->
            <el-date-picker
                v-model="timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="起始时间"
                end-placeholder="结束时间"
                style="width: 300px;"
            />

            <!-- 查询按钮 -->
            <el-button type="primary" size="small" @click="refetchAllSelectedData">查询</el-button>
          </div>

          <div class="flex justify-between items-center">
            <h3 class="font-semibold">特征趋势图</h3>
            <el-button @click="isConfigVisible = !isConfigVisible" icon="el-icon-setting" size="small" type="text" />
          </div>

          <!-- 设置面板 -->
          <div v-show="isConfigVisible" class="mt-2 flex items-center gap-4">
            <el-switch v-model="showDateOnly" label="只显示日期" />
            <el-button size="small" @click="exportAllCharts">导出全部</el-button>
          </div>
        </div>

        <!-- 滚动图表区 -->
        <div class="flex-1 overflow-y-auto pr-2 mt-2">
          <div class="space-y-6">
            <div
                v-for="name in selectedFeatureNames"
                :key="name"
                class="border p-2 rounded bg-white shadow-sm"
            >
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">{{ name }}</h4>
                <el-button size="mini" type="primary" plain @click="exportSingleChart(name)">导出</el-button>
              </div>
              <div :ref="el => chartRefs[name] = el" class="h-[500px] w-full" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup>
    import { ref, reactive, watch, nextTick, onUnmounted } from 'vue'
    import * as echarts from 'echarts'
    import { fetchTableData } from '@/api/querydata.js'
    import {PERIOD_FORM_ID} from '@/api/form_constant.js'
    import PointSelector from '@/components/common/Selector.vue'
    import {fetchParsedFeatureData, formatTimestamp} from "@/api/featureService.js";

    // UI 控制
    const showFilter = ref(true)
    const toggleFilter = () => (showFilter.value = !showFilter.value)
    const isConfigVisible = ref(false)
    const showDateOnly = ref(false)

    // 特征项和数据
    const availableFeatureNames = ref([])
    const selectedFeatureNames = ref([])
    const featureDataMap = reactive({})
    const currentDevice = ref(null) // 可选：存储当前选中设备

    // 图表 DOM & 实例管理
    const chartRefs = reactive({})
    const chartsMap = new Map()

    // 接收设备变更后的数据
    function handleSelectedPoints({ device, features }) {
      const unique = [...new Set(features.map(d => d.feature_name))]
      availableFeatureNames.value = unique
      selectedFeatureNames.value = unique.slice(0, 1)

      // 如果还需存储当前设备信息，可加上：
      currentDevice.value = device
    }

    const periodOptions = ref([])

    // 时间范围
    const timeRange = ref([]) // [startTime, endTime]

    const selectedPeriodName = ref(null) // 绑定周期名
    const selectedPeriod = ref(null)     // 存储完整周期对象

    function onPeriodChange(name) {
      selectedPeriod.value = periodOptions.value.find(p => p.period_name === name)
      if (selectedPeriod.value?.start_time && selectedPeriod.value?.end_time) {
        timeRange.value = [
          new Date(selectedPeriod.value.start_time),
          new Date(selectedPeriod.value.end_time)
        ]
      }
    }

    // 初始化周期数据
    fetchTableData(1, 1000, PERIOD_FORM_ID, {})
        .then(res => {
          const list = res.data.list || []
          periodOptions.value = list

          if (list.length > 0) {
            // 默认选择最后一个周期（比如最新周期）
            const last = list[list.length - 1]
            selectedPeriodName.value = last.period_name
            onPeriodChange(last.period_name)
          }
        })
        .catch(err => {
          console.error('加载周期数据失败:', err)
        })

    watch(selectedFeatureNames, async () => {
      await nextTick()

      // 销毁未选中图表
      for (const [name, chart] of chartsMap.entries()) {
        if (!selectedFeatureNames.value.includes(name)) {
          chart.dispose()
          chartsMap.delete(name)
          delete featureDataMap[name]
        }
      }

      // 加载选中项（调用 Arrow 数据接口）
      for (const name of selectedFeatureNames.value) {
        await fetchSingleFeatureData(name)
      }
    })



    function refetchAllSelectedData() {
      for (const name of selectedFeatureNames.value) {
        fetchSingleFeatureData(name)
      }
    }

    async function fetchSingleFeatureData(featureName) {
      if (!currentDevice.value) return
      const [start, end] = timeRange.value || []
      if (!start || !end) return

      try {
        const startStr = new Date(start).toISOString()
        const endStr = new Date(end).toISOString()

        const deviceName = currentDevice.value.device_name // 确保传递正确字段
        const data = await fetchParsedFeatureData(deviceName, featureName, startStr, endStr)
        featureDataMap[featureName] = data
        renderChart(featureName)
      } catch (err) {
        console.error(`❌ 加载特征 ${featureName} 的数据失败`, err)
      }
    }




    function renderChart(name) {
      const el = chartRefs[name]
      if (!el) return

      let chart = chartsMap.get(name)
      if (!chart) {
        chart = echarts.init(el)
        chartsMap.set(name, chart)
      }

      const data = (featureDataMap[name] || []).slice()

      // ✅ 如果 cur_timestamp 是毫秒数（number），就用数字排序
      data.sort((a, b) => a.cur_timestamp - b.cur_timestamp)

      let timestamps = data.map(d =>
          showDateOnly.value
              ? formatTimestamp(d.cur_timestamp).split(' ')[0]
              : formatTimestamp(d.cur_timestamp)
      )
      const values = data.map(d => d.feature_value)

      chart.setOption({
        title: { text: name, left: 'center' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        xAxis: { type: 'category', data: timestamps },
        yAxis: { type: 'value' },
        grid: { left: 40, right: 20, top: 40, bottom: 40 },
        series: [{ type: 'line', data: values, name, smooth: true }]
      })
    }


    // 导出图表
    function exportSingleChart(name) {
      const chart = chartsMap.get(name)
      chart?.downloadImage?.({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    }
    function exportAllCharts() {
      for (const name of selectedFeatureNames.value) exportSingleChart(name)
    }

    // 清理图表实例
    onUnmounted(() => {
      for (const chart of chartsMap.values()) chart.dispose()
      chartsMap.clear()
    })
</script>



<style scoped>
/* 移除自定义CSS，使用Tailwind类替代 */
</style>
