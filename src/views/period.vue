<template>
  <div class="device-management">
    <!-- 筛选栏 -->
    <div class="filter-bar bg-white shadow-sm p-4 mb-4">
      <div class="flex flex-wrap items-center gap-4 md:gap-6">
        <!-- 搜索基地 -->
        <div class="flex-1 min-w-[200px]">
          <el-select
              v-model="selectedBase"
              placeholder="搜索基地"
              filterable
              remote
              :remote-method="searchBase"
              :loading="baseLoading"
              style="width: 100%"
          >
            <el-option
                v-for="base in baseOptions"
                :key="base.id"
                :label="base.name"
                :value="base.id"
            ></el-option>
          </el-select>
        </div>

        <!-- 搜索装置 -->
        <div class="flex-1 min-w-[200px]">
          <el-select
              v-model="selectedDeviceStatus"
              placeholder="搜索装置"
              filterable
              @change="handleDeviceStatusChange"
              style="width: 100%"
          >
            <el-option
                v-for="status in deviceStatusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
            ></el-option>
          </el-select>
        </div>

        <!-- 状态筛选 -->
        <div class="w-[180px]">
          <el-select v-model="filterStatus" placeholder="筛选状态">
            <el-option label="全部" value="all"></el-option>
            <el-option label="正常" value="normal"></el-option>
            <el-option label="预警" value="warning"></el-option>
            <el-option label="过期" value="expired"></el-option>
          </el-select>
        </div>

        <!-- 类型筛选 -->
        <div class="w-[180px]">
          <el-select v-model="filterType" placeholder="设备类型">
            <el-option
                v-for="type in deviceTypes"
                :key="type.id"
                :label="type.name"
                :value="type.id"
            ></el-option>
          </el-select>
        </div>

        <!-- 时间筛选 -->
        <div class="flex flex-wrap gap-4 w-full md:w-[500px]">
          <div class="w-full md:w-[210px]">
            <el-date-picker v-model="startDate" type="date" placeholder="选择开始日期" value-format="YYYY-MM-DD" format="YYYY-MM-DD" class="w-full"></el-date-picker>
          </div>
          <div class="w-full md:w-[210px]">
            <el-date-picker v-model="endDate" type="date" placeholder="选择结束日期" value-format="YYYY-MM-DD" format="YYYY-MM-DD" class="w-full"></el-date-picker>
          </div>
        </div>

        <el-button type="primary" @click="handleFilter">
          <el-icon><Search /></el-icon>筛选
        </el-button>

        <el-button type="default" @click="resetFilter">
          重置
        </el-button>
      </div>
    </div>

    <!-- 侧边栏和主内容区域保持不变 -->
    <!-- ... -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedBase: null, // 选中的基地ID
      baseOptions: [], // 基地选项列表
      baseLoading: false, // 基地加载状态

      selectedDeviceStatus: null, // 选中的装置状态
      deviceStatusOptions: [ // 装置状态选项
        { value: 'online', label: '在线' },
        { value: 'offline', label: '离线' },
        { value: 'active', label: '激活' },
        { value: 'inactive', label: '未激活' },
      ],

      // 其他原有数据
      startDate: null,
      endDate: null,
      filterStatus: 'all',
      filterType: '',
    };
  },
  methods: {
    // 搜索基地（模拟）
    searchBase(query) {
      if (!query) {
        this.baseOptions = [];
        return;
      }
      this.baseLoading = true;
      // 模拟异步请求（实际需调用API）
      setTimeout(() => {
        this.baseLoading = false;
        // 假设返回包含基地ID和名称的列表
        this.baseOptions = this.mockBaseList.filter(base =>
            base.name.includes(query)
        );
      }, 500);
    },

    // 模拟基地数据
    mockBaseList: [
      {id: 'base1', name: '基地A'},
      {id: 'base2', name: '基地B'},
      {id: 'base3', name: '基地C'},
    ],

    // 装置状态变化
    handleDeviceStatusChange(value) {
      console.log('选中的装置状态:', value);
      this.handleFilter(); // 自动触发筛选
    },

    handleFilter() {
      const filterParams = {
        baseId: this.selectedBase,
        deviceStatus: this.selectedDeviceStatus,
        filterStatus: this.filterStatus,
        filterType: this.filterType,
        startDate: this.startDate,
        endDate: this.endDate,
      };
      // 调用数据获取方法
      this.fetchDeviceList(filterParams);
    },

    resetFilter() {
      this.selectedBase = null;
      this.selectedDeviceStatus = null;
      this.filterStatus = 'all';
      this.filterType = '';
      this.startDate = null;
      this.endDate = null;
      this.baseOptions = [];
      this.fetchDeviceList();
    },

    fetchDeviceList(params = {}) {
      console.log("获取设备列表，参数：", params);
      // 这里可接 API 实现获取设备列表逻辑
    }
  },
};
</script>

<style scoped>
/* 可按需添加样式 */
</style>
