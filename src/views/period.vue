<template>
  <div class="p-1" >
    <el-card shadow="hover" class="mb-2">
      <div class="flex justify-between items-center">
        <span class="text-lg font-semibold">周期数据筛选与展示</span>
      </div>
      <div class="mt-4">
        <!-- 使用 PeriodSelector 组件作为筛选器 -->
        <!-- 使用 ref 访问子组件实例，以便获取其内部状态 -->
        <PeriodSelector ref="selectorRef" />
      </div>
    </el-card>

    <el-card shadow="hover">
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
        <el-table-column prop="end_time" label="结束时间" width="120"></el-table-column>
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
import PeriodSelector from '@/buz/common/PeriodSelector.vue'; // 确保路径正确
import { fetchTableData } from '@/api/querydata.js';
import { getSysConfigFormId } from '@/api/constant/form_constant.js'; // 确保导入周期FORM_ID

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
  // 确保 selectorRef.value 存在后再访问其属性
  if (!selectorRef.value) return { siteId: null, systemId: null, deviceId: null };

  return {
    siteId: selectorRef.value.selectedSiteId,
    systemId: selectorRef.value.selectedSystemId,
    deviceId: selectorRef.value.selectedDeviceId
  };
}, async (newFilters) => {
  console.log('Filter changed:', newFilters); // Debug log

  await nextTick();
  if (!selectorRef.value) {
    console.warn("PeriodSelector ref not available in watch after nextTick");
    filteredPeriods.value = [];
    return;
  }

  // 不管筛选条件如何，都调用 fetchPeriodData
  await fetchPeriodData(newFilters);

}, { immediate: true, deep: true });
 // immediate: true 确保 watch 在组件加载后立即执行一次

// 根据设备ID获取周期数据
async function fetchPeriodData({ siteId, systemId, deviceId }) {
  loading.value = true;
  try {
    // 构建查询条件数组
    const conditions = [];

    // 只有当筛选条件有值时才添加到查询条件中
    if (siteId) {
      conditions.push({ key: 'parent_site', value: siteId, queryType: 1 });
    }

    if (systemId) {
      conditions.push({ key: 'parent_system', value: systemId, queryType: 1 });
    }

    if (deviceId) {
      conditions.push({ key: 'parent_device', value: deviceId, queryType: 1 });
    }

    // 如果没有任何筛选条件，则获取所有周期数据
    const res = await fetchTableData(1, 100, getSysConfigFormId("PERIOD_FORM_ID"), conditions);

    filteredPeriods.value = res.data.list || [];
    console.log("Fetched period data count:", filteredPeriods.value.length); // Debug log

    await nextTick();
    if (periodTableRef.value) {
      periodTableRef.value.doLayout();
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
.el-table {
  display: table-cell !important;
}
</style>
