<!-- src/components/MaintenanceManagement.vue -->
<template>
  <div class="page-container">
    <div class="header-bar">
      <button class="base-button" @click="goToDeviceMonitor">成都基地</button>
    </div>

    <h1 class="main-title">{{devicename}}维修情况</h1>

    <!-- 维修状态概览卡片 -->
    <div class="summary-cards-section">
      <div v-for="summary in maintenanceSummary" :key="summary.title" class="summary-card">
        <div class="summary-card-header" :class="summary.class">{{ summary.title }}</div>
        <div class="summary-card-content">
          <p class="summary-count">{{ summary.count }}</p>
          <p class="summary-unit">项</p>
        </div>
      </div>
    </div>

    <!-- 搜索和操作区 -->
    <div class="search-action-section">
      <input type="text" v-model="searchQuery" placeholder="搜索维修记录..." class="search-input" />
      <button class="action-button primary-button" @click="addNewMaintenance">新建维修</button>
    </div>

    <!-- 维修记录表格 -->
    <div class="data-table-section">
      <table>
        <thead>
        <tr>
          <th>维修ID</th>
          <th>设备名称</th>
          <th>维修类型</th>
          <th>计划完成日期</th>
          <th>实际完成日期</th>
          <th>状态</th>
          <th>负责人</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="record in filteredMaintenanceRecords" :key="record.id">
          <td>{{ record.id }}</td>
          <td>{{ record.deviceName }}</td>
          <td>{{ record.type }}</td>
          <td>{{ record.scheduledDate }}</td>
          <td>{{ record.completionDate || '未完成' }}</td>
          <td>
            <span class="status-dot" :class="getMaintStatusClass(record.status)"></span>
            {{ record.status }}
          </td>
          <td>{{ record.technician }}</td>
          <td>
            <button class="action-button detail-button" @click="viewMaintenanceDetails(record.id)">详情</button>
            <button v-if="record.status === '待处理' || record.status === '进行中'" class="action-button complete-button" @click="completeMaintenance(record.id)">完成</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import { useRouter, useRoute} from 'vue-router'; // 引入 useRouter

const router = useRouter(); // 获取路由实例
const route = useRoute()
const devicename = ref(null)
// 导航到设备监控页面
const goToDeviceMonitor = () => {
  router.push({ name: 'device-monitor' });
};

// 预留接口：维修状态概览数据 (硬编码)
const maintenanceSummary = ref([
  { title: '待处理维修', count: 7, class: 'pending' },
  { title: '进行中维修', count: 3, class: 'in-progress' },
  { title: '已完成维修', count: 85, class: 'completed' },
  { title: '逾期维修', count: 2, class: 'overdue' },
]);

// 预留接口：维修记录数据 (硬编码)
const allMaintenanceRecords = ref([
  {
    id: 'M001', deviceName: 'TWA05', type: '例行保养', scheduledDate: '2025-07-01',
    completionDate: '', status: '待处理', technician: '张三'
  },
  {
    id: 'M002', deviceName: 'DEV-003', type: '故障修复', scheduledDate: '2025-06-28',
    completionDate: '2025-06-29', status: '已完成', technician: '李四'
  },
  {
    id: 'M003', deviceName: 'D001', type: '固件升级', scheduledDate: '2025-07-05',
    completionDate: '', status: '进行中', technician: '王五'
  },
  {
    id: 'M004', deviceName: 'D002', type: '传感器校准', scheduledDate: '2025-06-15',
    completionDate: '2025-06-14', status: '已完成', technician: '张三'
  },
  {
    id: 'M005', deviceName: 'TWA05', type: '电池更换', scheduledDate: '2025-06-20',
    completionDate: '', status: '逾期', technician: '赵六'
  },
  {
    id: 'M006', deviceName: 'DEV-002', type: '例行保养', scheduledDate: '2025-07-10',
    completionDate: '', status: '待处理', technician: '李四'
  },
  {
    id: 'M007', deviceName: 'D004', type: '流量计清洁', scheduledDate: '2025-06-25',
    completionDate: '', status: '逾期', technician: '王五'
  },
  {
    id: 'M008', deviceName: 'D003', type: '压力测试', scheduledDate: '2025-07-03',
    completionDate: '', status: '待处理', technician: '张三'
  },
  {
    id: 'M009', deviceName: 'TWA05', type: '故障排查', scheduledDate: '2025-07-02',
    completionDate: '', status: '进行中', technician: '赵六'
  },
  {
    id: 'M010', deviceName: 'DEV-003', type: '例行保养', scheduledDate: '2025-06-01',
    completionDate: '2025-06-01', status: '已完成', technician: '李四'
  },
]);

const searchQuery = ref('');

// 根据搜索查询过滤维修记录
const filteredMaintenanceRecords = computed(() => {
  if (!searchQuery.value) {
    return allMaintenanceRecords.value;
  }
  const query = searchQuery.value.toLowerCase();
  return allMaintenanceRecords.value.filter(record =>
      record.id.toLowerCase().includes(query) ||
      record.deviceName.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query) ||
      record.technician.toLowerCase().includes(query) ||
      record.status.toLowerCase().includes(query)
  );
});

// 根据维修状态返回对应的CSS类
const getMaintStatusClass = (status) => {
  switch (status) {
    case '待处理':
      return 'dot-pending';
    case '进行中':
      return 'dot-in-progress';
    case '已完成':
      return 'dot-completed';
    case '逾期':
      return 'dot-overdue';
    default:
      return '';
  }
};

// 模拟操作：新建维修
const addNewMaintenance = () => {
  alert('模拟：跳转到新建维修表单页面');
  // 实际应用中会 router.push('/maintenance/new')
};

// 模拟操作：查看维修详情
const viewMaintenanceDetails = (id) => {
  alert(`模拟：查看维修ID ${id} 的详情`);
  // 实际应用中会 router.push(`/maintenance/${id}`)
};

// 模拟操作：完成维修
const completeMaintenance = (id) => {
  const record = allMaintenanceRecords.value.find(r => r.id === id);
  if (record) {
    record.status = '已完成';
    record.completionDate = new Date().toISOString().slice(0, 10); // 设置当前日期
    alert(`维修ID ${id} 已标记为完成！`);
    // 实际应用中会调用 API 更新状态
  }
};
onMounted(async () => {
  devicename.value = route.query.devicename
})
</script>

<style scoped>
/* 继承自 DeviceMonitor.vue 的通用样式，确保风格一致 */
.page-container {
  min-height: 100vh;
  background-image: url('/images/backuppic.jpg'); /* 随机背景图，可替换为你自己的图片 */
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Arial', sans-serif;
  color: #333;
}

.header-bar {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 30px;
}

.base-button {
  background-color: #5a7b9e;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}
.base-button:hover {
  background-color: #4a6b8e;
}

.main-title {
  color: #333;
  font-size: 32px;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

/* 维修状态概览卡片区域 */
.summary-cards-section {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
}

.summary-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 220px; /* 调整卡片宽度 */
  flex-shrink: 0;
  text-align: center;
}

.summary-card-header {
  color: white;
  padding: 12px 15px;
  font-size: 16px;
  font-weight: bold;
}

/* 概览卡片头部颜色 */
.summary-card-header.pending { background-color: #ffc107; /* 警告黄 */ }
.summary-card-header.in-progress { background-color: #007bff; /* 蓝色 */ }
.summary-card-header.completed { background-color: #28a745; /* 绿色 */ }
.summary-card-header.overdue { background-color: #dc3545; /* 危险红 */ }

.summary-card-content {
  padding: 20px;
}

.summary-count {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.summary-unit {
  font-size: 16px;
  color: #666;
}

/* 搜索和操作区 */
.search-action-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex-grow: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-right: 15px;
  max-width: 400px; /* 调整搜索框宽度 */
}

.action-button {
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
  color: white; /* 默认白色字体 */
}

.primary-button {
  background-color: #007bff; /* 蓝色 */
}
.primary-button:hover {
  background-color: #0056b3;
}

/* 数据表格区 */
.data-table-section {
  width: 100%;
  max-width: 1200px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}

th {
  background-color: #5a7b9e;
  color: white;
  font-weight: bold;
  white-space: nowrap;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:hover {
  background-color: #f0f0f0;
}

/* 状态点 */
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.dot-pending { background-color: #ffc107; /* 黄色 */ }
.dot-in-progress { background-color: #007bff; /* 蓝色 */ }
.dot-completed { background-color: #28a745; /* 绿色 */ }
.dot-overdue { background-color: #dc3545; /* 红色 */ }

/* 表格操作按钮 */
.detail-button {
  background-color: #6c757d; /* 灰色 */
  margin-right: 8px;
}
.detail-button:hover {
  background-color: #5a6268;
}

.complete-button {
  background-color: #28a745; /* 绿色 */
}
.complete-button:hover {
  background-color: #218838;
}
</style>
