<template>
  <div class="data-board">
    <div class="stats-bar">
      <div class="stat-item">
        <span class="num">{{ list.length }}</span>
        <span class="label">总要素</span>
      </div>
      <div class="stat-item warning">
        <span class="num">{{ warningCount }}</span>
        <span class="label">隐患/病害</span>
      </div>
    </div>

    <div class="search-box">
      <input
          v-model="searchText"
          placeholder="搜索名称、类型..."
          type="text"
      />
      <span class="search-icon">🔍</span>
    </div>

    <div class="data-list custom-scroll">
      <div
          v-for="item in filteredList"
          :key="item.id"
          class="data-row"
          @click="handleClick(item)"
      >
        <div class="row-left">
          <div class="row-title">{{ item.name }}</div>
          <div class="row-sub">
            <span class="tag type">{{ item.typeName }}</span>
            <span class="tag layer">{{ item.layerName }}</span>
          </div>
        </div>

        <div class="row-right">
          <span
              v-if="item.severity"
              class="severity-badge"
              :class="getSeverityClass(item.severity)"
          >
            {{ getSeverityLabel(item.severity) }}
          </span>
          <span v-else class="info-text">正常</span>
        </div>
      </div>

      <div v-if="filteredList.length === 0" class="empty-tip">
        暂无匹配数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['locate']);

const searchText = ref('');

// 计算隐患数量 (简单逻辑：包含'病害'或'隐患'的)
const warningCount = computed(() => {
  return props.list.filter(i =>
      (i.typeName && i.typeName.includes('病害')) ||
      (i.typeName && i.typeName.includes('隐患'))
  ).length;
});

// 过滤列表
const filteredList = computed(() => {
  if (!searchText.value) return props.list;
  const key = searchText.value.toLowerCase();
  return props.list.filter(item =>
      (item.name && item.name.toLowerCase().includes(key)) ||
      (item.typeName && item.typeName.toLowerCase().includes(key))
  );
});

const handleClick = (item) => {
  emit('locate', item);
};

// 辅助样式函数
const getSeverityClass = (sev) => {
  if (sev === 'DL_WORST') return 'danger';
  if (sev === 'DL_MEDIUM') return 'warning';
  return 'normal';
};

const getSeverityLabel = (sev) => {
  const map = {
    'DL_WORST': '严重',
    'DL_MEDIUM': '一般',
    'DL_NORMAL': '轻微'
  };
  return map[sev] || sev;
};
</script>

<style scoped>
.data-board {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: rgba(245, 247, 250, 0.5);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-item .num { font-size: 18px; font-weight: 700; color: #1890ff; }
.stat-item .label { font-size: 11px; color: #666; margin-top: 2px; }
.stat-item.warning .num { color: #ff4d4f; }

.search-box {
  padding: 10px 12px;
  position: relative;
  border-bottom: 1px solid #eee;
}
.search-box input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: rgba(255,255,255,0.8);
}
.search-box input:focus { outline: none; border-color: #1890ff; }
.search-icon { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); opacity: 0.5; }

.data-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}
.data-row:hover { background: #e6f7ff; }

.row-title { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 4px; }
.row-sub { display: flex; gap: 6px; }
.tag { font-size: 10px; padding: 1px 4px; border-radius: 2px; }
.tag.type { background: #f0f0f0; color: #666; }
.tag.layer { background: #e6f7ff; color: #1890ff; }

.severity-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; color: #fff;
}
.severity-badge.danger { background: #ff4d4f; }
.severity-badge.warning { background: #faad14; }
.severity-badge.normal { background: #52c41a; }
.info-text { font-size: 12px; color: #999; }

.empty-tip { padding: 20px; text-align: center; color: #999; font-size: 13px; }
</style>