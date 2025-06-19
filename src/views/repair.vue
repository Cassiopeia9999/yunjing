<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 简化导航栏 -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold text-primary">设备维修管理</h1>
        </div>
        <div class="hidden md:flex space-x-4">
          <a href="#" class="text-gray-600 hover:text-primary">首页</a>
          <a href="#" class="text-gray-600 hover:text-primary">设备列表</a>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="container mx-auto px-4 py-8">
      <!-- 页面标题（从URL获取设备名称） -->
      <h2 class="text-2xl font-bold mb-6 text-black">{{ deviceName }} 维修情况</h2>

      <!-- 设备状态卡片 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 状态 -->
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">当前状态</p>
            <p class="text-2xl font-bold {{ statusColorClass }}">{{ deviceStatus }}</p>
            <div class="w-3 h-3 rounded-full bg-yellow-500 mx-auto mt-2 animate-pulse"></div>
          </div>

          <!-- 进度 -->
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">维修进度</p>
            <p class="text-2xl font-bold">{{ progress }}%</p>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div :class="progressColorClass" :style="{ width: `${progress}%` }" class="h-2 rounded-full"></div>
            </div>
          </div>

          <!-- 预计完成时间 -->
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">预计完成</p>
            <p class="text-2xl font-bold">{{ finishTime }}</p>
          </div>
        </div>
      </div>

      <!-- 维修详情 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold mb-4">维修详情</h3>
        <div class="space-y-4">
          <div>
            <p class="text-gray-500 text-sm">设备型号</p>
            <p class="font-medium">{{ deviceModel }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">故障描述</p>
            <p class="font-medium">{{ faultDescription }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">维修措施</p>
            <p class="font-medium">{{ repairMeasures }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 简化页脚 -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 从URL获取设备名称
const route = useRoute();


// 设备数据（简化版）
const deviceStatus = ref('维修中');
const statusColorClass = ref('text-yellow-600');
const progress = ref(60);
const progressColorClass = ref('bg-blue-500');
const finishTime = ref('2025-06-25');
const deviceModel = ref('Model-X789');
const faultDescription = ref('设备运行时出现异常噪音，间歇性停机');
const repairMeasures = ref('更换主板及连接线，全面测试');

const deviceName = ref(null)
// 监听路由变化（可选）
onMounted(() => {
  // 可在此处添加从API获取数据的逻辑
  deviceName.value = route.query.devicename
});
</script>

<style scoped>
/* 自定义简单样式 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>