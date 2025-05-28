<template>
  <div class="p-6">
    <el-card>
      <div class="text-lg font-semibold mb-4">设备故障实时状态监控</div>

      <el-table :data="faultList" style="width: 100%">
        <el-table-column prop="device_id" label="设备 ID" width="180" />
        <el-table-column prop="features" label="触发特征" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="fault_code" label="故障码" />
        <el-table-column prop="occurred_at" label="发生时间" />
      </el-table>

      <div v-if="connectionStatus" class="text-green-600 mt-4">
        ✅ {{ connectionStatus }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'



// 环境变量前缀自动注入：VITE_APP_BASE_API
const baseApi = import.meta.env.VITE_APP_BASE_API

// 将 http(s):// 替换为 ws(s)://，或处理相对路径
const wsUrl = (() => {
  if (baseApi.startsWith('http')) {
    return baseApi.replace(/^http/, 'ws') + '/socket/diagnosis/monitor'
  } else {
    // 相对路径，如 /api，拼接 host
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${baseApi}/socket/diagnosis/monitor`
  }
})()

let socket = null

const faultList = reactive([])
const connectionStatus = ref('')

const connectWebSocket = () => {
  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    connectionStatus.value = 'WebSocket 连接成功'
    console.log('✅ WebSocket 连接成功')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.device_id && data.features) {
        faultList.unshift(data)
        if (faultList.length > 20) faultList.pop() // 保留最多20条
      }
    } catch (e) {
      console.error('解析消息失败:', e)
    }
  }

  socket.onerror = (err) => {
    connectionStatus.value = '连接出错'
    console.error('WebSocket 错误:', err)
  }

  socket.onclose = () => {
    connectionStatus.value = '连接已关闭'
    console.warn('WebSocket 关闭')
  }
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (socket) socket.close()
})
</script>

<style scoped>
</style>
