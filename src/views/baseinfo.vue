<template>
  <div class="base-info-container">
    <div class="info-card">
      <h2>基地名称</h2>
      <p>{{ baseName }}</p>
    </div>
    <div class="info-card">
      <h2>经度</h2>
      <p>{{ longitude }}</p>
    </div>
    <div class="info-card">
      <h2>纬度</h2>
      <p>{{ latitude }}</p>
    </div>
    <div class="detail-card">
      <h2>基地详细信息</h2>
      <p>这里显示基地的详细信息。</p>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useRoute} from 'vue-router';

const route = useRoute();
const baseName = ref('');
const longitude = ref(null)
const latitude = ref(null)

onMounted(() => {
  baseName.value = route.query.baseName;
  longitude.value = route.query.longitude;
  latitude.value = route.query.latitude;
});
</script>

<style scoped>
.base-info-container {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-card {
  background: #f0f4f8;
  padding: 15px;
  border-radius: 8px;
  min-width: 200px;
}

.detail-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  flex: 1;
  min-width: 300px;
}

.info-card h2, .detail-card h2 {
  color: #333;
  font-size: 1.2em;
  margin-top: 0;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.info-card p, .detail-card p {
  color: #666;
  line-height: 1.6;
}
</style>