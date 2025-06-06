<template>
  <div class="chart-container">
    <div ref="chartRef" class="chart"></div>
    <input type="file" @change="handleFileUpload" accept=".arrow" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { readArrowIPC, RecordBatchFileReader } from 'arrow-wasm';

const chartRef = ref(null);
let chartInstance = null;

onMounted(() => {
  initChart();
});

const initChart = () => {
  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value);

  const option = { /* 保持原有配置 */};
  chartInstance.setOption(option);
  window.addEventListener('resize', () => chartInstance.resize());
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.log('未选择文件');
    return;
  }

  try {
    // 1. 校验文件基本信息
    console.log('[文件校验开始]');
    console.log(`文件名: ${file.name}`);
    console.log(`文件类型: ${file.type}`);
    console.log(`文件大小: ${file.size} bytes`);
    if (!file.name.endsWith('.arrow')) {
      throw new Error('文件扩展名不正确，必须为.arrow');
    }

    // 2. 读取文件二进制数据
    const buffer = await file.arrayBuffer();
    console.log('[文件读取成功]', {bufferSize: buffer.byteLength});

    // 3. 解析Arrow文件（增加详细调试）
    console.log('.arrayBuffer();');
    console.log('[文件读取成功]', {bufferSize: buffer.byteLength});

    // 3. 解析Arrow文件（增加详细调试）
    console.log('[开始解析Arrow文件]');
    let reader;
    let table;
    try {
      // 使用 RecordBatchFileReader 解析
      reader = new RecordBatchFileReader(new Uint8Array(buffer));
      table = reader.readAll();
      console.log('[RecordBatchFileReader] 解析成功');
    } catch (error) {
      console.error('[RecordBatchFileReader] 解析失败:', error);
      // 尝试使用备用方法
      try {
        console.log('[尝试备用解析方法]');
        table = await readArrowIPC(buffer);
        console.log('[readArrowIPC] 解析成功');
      } catch (err) {
        console.error('[备用解析方法失败]', err);
        throw new Error('文件解析失败，无法读取为Arrow IPC格式');
      }
    }

    // 4. 校验数据结构
    console.log('[数据结构校验]');
    console.log('表结构:', table.schema);
    console.log(`数据行数: ${table.numRows}`);
    if (table.numRows === 0) {
      throw new Error('Arrow文件中没有数据行');
    }
    if (!table.schema.fields.some(f => f.name === 'timestamp')) {
      throw new Error('缺少时间戳列（timestamp）');
    }
    if (!table.schema.fields.some(f => f.name === 'temperature')) {
      throw new Error('缺少温度列（temperature）');
    }

    // 5. 提取数据（添加类型检查）
    const timestamps = [];
    const temperatures = [];
    const timestampField = table.getColumn('timestamp');
    const temperatureField = table.getColumn('temperature');

    console.log('[数据类型检查]');
    console.log('时间戳列类型:', timestampField.type);
    console.log('温度列类型:', temperatureField.type);
    if (timestampField.type !== 'int64') {
      throw new Error('时间戳列必须为int64类型（秒级时间戳）');
    }
    if (temperatureField.type !== 'float64' && temperatureField.type !== 'float32') {
      throw new Error('温度列必须为数值类型');
    }

    // 6. 处理数据（添加越界检查）
    for (let i = 0; i < table.numRows; i++) {
      const timestampValue = timestampField.get(i);
      const temperatureValue = temperatureField.get(i);

      if (typeof timestampValue !== 'number' || isNaN(timestampValue)) {
        throw new Error(`第 ${i} 行时间戳数据无效`);
      }
      if (typeof temperatureValue !== 'number' || isNaN(temperatureValue)) {
        throw new Error(`第 ${i} 行温度数据无效`);
      }

      timestamps.push(timestampValue * 1000); // 秒转毫秒
      temperatures.push(temperatureValue);
    }

    // 7. 更新图表（添加数据量检查）
    if (timestamps.length === 0) {
      throw new Error('解析后的数据为空');
    }

    const data = timestamps.map((time, index) => [time, temperatures[index]]);
    chartInstance.setOption({
      xAxis: {
        type: 'time'
      },
      series: [
        {
          data: data,
          type: 'line',
          smooth: true
        }
      ]
    });

    console.log('[图表更新成功]', {dataPoints: timestamps.length});

  } catch (error) {
    // 增强错误信息（包含堆栈跟踪）
    console.error('[错误详情]', {
      message: error.message,
      stack: error.stack,
      fileName: file?.name,
      fileSize: file?.size
    });

    alert([
      '数据解析失败:',
      error.message,
      '请检查文件格式是否为Arrow IPC',
      '或确认列名/数据类型是否匹配'
    ].join('\n'));
  }
};
</script>

<style scoped> /* 保持原有样式 */ </style>
