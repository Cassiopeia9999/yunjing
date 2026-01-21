<template>
  <div class="layer-control-panel">
    <div class="panel-header">
      <span class="title">图层管理</span>
      <span class="subtitle">{{ layers.filter(l => l.visible).length }}/{{ layers.length }}</span>
    </div>

    <div class="layer-list" ref="sortableRef">
      <div
          v-for="layer in layers"
          :key="layer.id"
          class="layer-item"
          :data-id="layer.id"
      >
        <div class="drag-handle">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#b0b0b0"/></svg>
        </div>

        <div class="switch-wrapper">
          <input
              type="checkbox"
              :checked="layer.visible"
              @change="(e) => onToggle(layer.id, e.target.checked)"
              :id="`chk-${layer.id}`"
          />
          <label :for="`chk-${layer.id}`"></label>
        </div>

        <div class="layer-info">
          <span class="layer-name">{{ layer.name }}</span>
          <span class="layer-meta" v-if="layer.count !== undefined">{{ layer.count }} 要素</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Sortable from 'sortablejs';

const props = defineProps({
  layers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['toggle', 'reorder']);
const sortableRef = ref(null);

// 切换显隐
const onToggle = (id, checked) => {
  emit('toggle', id, checked);
};

// 初始化拖拽
onMounted(() => {
  if (sortableRef.value) {
    Sortable.create(sortableRef.value, {
      handle: '.drag-handle', // 只能拖拽手柄区域
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        // 创建新的排序数组
        const newOrder = [...props.layers];
        const item = newOrder.splice(evt.oldIndex, 1)[0];
        newOrder.splice(evt.newIndex, 0, item);

        // 发送给父组件 (useLayerManager 会处理具体的 z-index)
        emit('reorder', newOrder);
      }
    });
  }
});
</script>

<style scoped>
.layer-control-panel {
  width: 260px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.panel-header {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title { font-weight: 600; font-size: 14px; color: #374151; }
.subtitle { font-size: 12px; color: #9ca3af; }

.layer-list { max-height: 400px; overflow-y: auto; }

.layer-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  transition: background 0.2s;
}

.layer-item:last-child { border-bottom: none; }
.layer-item:hover { background: #f9fafb; }

.drag-handle {
  cursor: move;
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.switch-wrapper { margin-right: 12px; display: flex; align-items: center; }
.switch-wrapper input { cursor: pointer; }

.layer-info { display: flex; flex-direction: column; }
.layer-name { font-size: 14px; color: #1f2937; }
.layer-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }

.sortable-ghost { opacity: 0.4; background: #e5e7eb; }
</style>