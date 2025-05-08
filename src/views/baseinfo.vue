<template>
  <div class="base-info-container">
    <h1>{{ baseName }}</h1>
    <p>这里显示基地的详细信息。</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router';

const route = useRoute();
const baseName = ref('');

onMounted(() => {
  // 从路由参数中获取选中标记的信息
  baseName.value = route.query.baseName;
});
</script>

<style scoped>
.base-info-container {
  padding: 20px;
}
</style>