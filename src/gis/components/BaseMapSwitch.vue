<template>
  <div class="base-map-switch">
    <div
        v-for="item in list"
        :key="item.key"
        class="map-card"
        :class="{ active: currentKey === item.key }"
        @click="handleSwitch(item.key)"
    >
      <div class="card-preview" :style="getPreviewStyle(item)">
        <span class="type-icon">{{ getTypeIcon(item) }}</span>
        <div class="active-mask" v-if="currentKey === item.key">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      </div>

      <div class="card-label">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentKey: { type: String, required: true },
  list: { type: Array, default: () => [] }
});

const emit = defineEmits(['switch']);

const handleSwitch = (key) => {
  emit('switch', key);
};

// 根据地图类型生成简单的 CSS 渐变背景，提升视觉区分度
const getPreviewStyle = (item) => {
  const k = item.key.toLowerCase();
  let gradient = '';

  if (k.includes('img') || k.includes('satellite') || k.includes('private')) {
    // 影像/卫星：深蓝绿渐变
    gradient = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
  } else if (k.includes('ter') || k.includes('terrain')) {
    // 地形：土黄渐变
    gradient = 'linear-gradient(135deg, #d7d2cc 0%, #304352 100%)';
  } else if (k.includes('sea') || k.includes('blue')) {
    // 海图：海洋蓝
    gradient = 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)';
  } else if (k.includes('google')) {
    // 谷歌：清爽灰白
    gradient = 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)';
  } else {
    // 默认矢量：米色/浅灰
    gradient = 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)';
  }

  return { background: gradient };
};

// 简单的文字图标映射
const getTypeIcon = (item) => {
  const k = item.key.toLowerCase();
  if (k.includes('img') || k.includes('private')) return '🛰️'; // 卫星
  if (k.includes('ter')) return '⛰️'; // 山地
  if (k.includes('sea')) return '🌊'; // 海洋
  if (k.includes('gaode')) return '🗺️'; // 高德
  if (k.includes('google')) return 'G'; // Google
  return '📍'; // 默认
};
</script>

<style scoped>
.base-map-switch {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 两列布局 */
  gap: 12px;
}

.map-card {
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.map-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 选中状态：蓝色边框 */
.map-card.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 预览区域 (模拟缩略图) */
.card-preview {
  height: 60px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-icon {
  font-size: 20px;
  opacity: 0.8;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* 选中时的右上角对勾遮罩 */
.active-mask {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 24px 24px 0; /* 三角形 */
  border-color: transparent #1890ff transparent transparent;
  z-index: 2;
}

.active-mask svg {
  position: absolute;
  top: 1px;
  right: -24px;
  width: 12px;
  height: 12px;
}

/* 底部文字标签 */
.card-label {
  font-size: 12px;
  color: #333;
  padding: 6px 4px;
  text-align: center;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.map-card.active .card-label {
  color: #1890ff;
  font-weight: 600;
  background: #f0f9ff;
}
</style>