<template>
  <div class="p-6">
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <span class="text-lg font-semibold">周期数据筛选与展示</span>
      </div>

      <div class="mt-4">
        <!-- 使用 PeriodSelector 组件作为筛选器 -->
        <!-- 使用 ref 访问子组件实例，以便获取其内部状态 -->
        <PeriodSelector ref="selectorRef" />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>匹配的周期列表</span>
        </div>
      </template>
      <!-- 周期数据表格 -->
      <el-table :data="filteredPeriods" style="width: 100%" border stripe v-loading="loading" ref="periodTableRef">
        <!-- 注意：这里的 prop 需要与你的周期数据结构中的字段匹配 -->
        <el-table-column prop="parent_site.name" label="所属基地" width="180" show-overflow-tooltip align="left">
          <template #default="{ row }">
            {{ row.parent_site ? row.parent_site.name : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="parent_system.name" label="所属装置" width="180" show-overflow-tooltip align="left">
          <template #default="{ row }">
            {{ row.parent_system ? row.parent_system.name : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="period_name" label="周期名称" show-overflow-tooltip width="500" align="left"></el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="120"></el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="120"></el-table-column> <!-- 使用 end_time -->
      </el-table>
      <div class="pagination-container mt-4 flex justify-end">
        <!-- 如果需要分页，可以添加 Element Plus Pagination 组件 -->
        <!-- 注意：如果周期和设备是一对一，通常不会有很多周期，分页可能不是必须的 -->
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'; // 移除 onMounted，因为数据获取由 watch 触发
import PeriodSelector from '@/components/common/PeriodSelector.vue'; // 确保路径正确
import { fetchTableData } from '@/api/querydata.js';
import { PERIOD_FORM_ID } from '@/api/form_constant.js'; // 确保导入周期FORM_ID

// 模板引用，用于访问 PeriodSelector 组件实例
const selectorRef = ref(null);

// 存储根据筛选条件获取的周期数据，用于表格展示
const filteredPeriods = ref([]); // 初始化为空数组
// 加载状态
const loading = ref(false);

const periodTableRef = ref(null);
// --- 数据获取与过滤逻辑 ---
// 监听 PeriodSelector 中设备选择的变化
watch(() => {
  // 使用可选链 ?. 确保 selectorRef.value 存在
  return selectorRef.value?.selectedDeviceId;
}, async (newDeviceId) => { // 使用 async 因为 fetchPeriodData 是异步的
  console.log(`Watch triggered. New Device ID: ${newDeviceId}`); // Debug log

  // 等待 PeriodSelector 组件完全渲染并暴露属性
  await nextTick();
  if (!selectorRef.value) {
    console.warn("PeriodSelector ref not available in watch after nextTick");
    filteredPeriods.value = []; // 确保表格清空
    return;
  }

  // 如果设备ID被选中 (非 null 或 undefined)
  if (newDeviceId !== null && newDeviceId !== undefined) {
    fetchPeriodData(newDeviceId);
  } else {
    // 如果设备ID未选中，则清空表格
    console.log("Device ID cleared, showing empty table."); // Debug log
    filteredPeriods.value = [];
    await nextTick(); // 等待 DOM 更新
    if (periodTableRef.value) {
      periodTableRef.value.doLayout(); // 触发表格布局更新
    }
  }

}, { immediate: true }); // immediate: true 确保 watch 在组件加载后立即执行一次

// 根据设备ID获取周期数据
async function fetchPeriodData(deviceId) {
  loading.value = true;
  try {
    // 根据设备ID查询周期数据
    // 假设 Period 表单有一个字段 (例如 'equipment_id') 存储关联的设备ID
    // 如果你的字段名不同，请修改这里的 key
    const res = await fetchTableData(1, 10, PERIOD_FORM_ID, [ // 假设周期和设备一对一，理论上只会返回一条或零条数据
      { key: 'parent_device', value: deviceId, queryType: 1 } // *** 请根据实际API和表单字段修改这里的 key ***
    ]);

    // 由于是一对一关系，理论上 list 中最多只有一项
    filteredPeriods.value = res.data.list || [];
    console.log("Fetched period data count:", filteredPeriods.value.length); // Debug log
    await nextTick(); // 等待 DOM 更新
    if (periodTableRef.value) {
      periodTableRef.value.doLayout(); // 触发表格布局更新
    }
  } catch (error) {
    console.error('加载周期数据失败:', error);
    filteredPeriods.value = [];
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
.pagination-container {
  /* 样式调整分页容器 */
}
/* 您可以添加其他样式 */
</style>
