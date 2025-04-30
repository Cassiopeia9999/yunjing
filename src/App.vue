<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* 基本样式 */
#app {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;  /* 去除外部间距 */
  padding: 0; /* 去除内边距 */
}

/* 设置最大宽度并居中对齐 */
@media (min-width: 1024px) {
  #app {
    margin: 0 auto;  /* 居中显示 */
    padding: 0 ;  /* 增加内边距 */
  }
}
/* 在移动端适配 */
@media (max-width: 1024px) {
  #app {
    padding: 10px;  /* 在移动端减小内边距 */
  }
}
</style>
