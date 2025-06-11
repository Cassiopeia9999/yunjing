<template>
  <div class="chart-container">
    <div ref="chartRef" class="chart" style="height: 400px;"></div>
    <input type="file" @change="handleFileUpload" accept=".arrow" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { tableFromIPC } from 'apache-arrow'

const chartRef = ref(null)
let chartInstance = null

onMounted(() => {
  initChart()
})

const initChart = () => {
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    xAxis: { type: 'time' },
    yAxis: {},
    series: []
  })
  window.addEventListener('resize', () => chartInstance.resize())
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !file.name.endsWith('.arrow')) {
    alert('请选择 .arrow 文件')
    return
  }

  try {
    console.log('[读取文件]', file.name)
    const buffer = await file.arrayBuffer()

    const table = tableFromIPC(buffer)
    console.log('[Arrow解析成功]', table.schema)

    const timestampField = table.getChild('timestamp')
    const temperatureField = table.getChild('temperature')

    if (!timestampField || !temperatureField) {
      throw new Error('缺少 timestamp 或 temperature 列')
    }

    const timestamps = []
    const temperatures = []

    for (let i = 0; i < table.numRows; i++) {
      const t = timestampField.get(i)
      const v = temperatureField.get(i)
      if (typeof t !== 'number' || typeof v !== 'number') {
        throw new Error(`第 ${i} 行数据异常：timestamp=${t}, value=${v}`)
      }
      timestamps.push(t * 1000)
      temperatures.push(v)
    }

    const data = timestamps.map((t, i) => [t, temperatures[i]])

    chartInstance.setOption({
      xAxis: { type: 'time' },
      yAxis: {},
      series: [
        {
          name: '温度',
          type: 'line',
          data,
          smooth: true
        }
      ]
    })

    console.log(`[图表更新完成] 共 ${data.length} 条数据`)
  } catch (e) {
    console.error('[Arrow解析失败]', e)
    alert(`解析失败：${e.message}`)
  }
}
</script>

<style scoped>
.chart-container {
  padding: 16px;
}
.chart {
  width: 100%;
  height: 400px;
}
</style>
