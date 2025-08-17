<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script setup></script>

<!-- ✅ 这是全局样式：不要加 scoped -->
<style>
html, body, #app {
  height: 100%;
  overflow: hidden; /* 关键：禁止最外层出现滚动条 */
}
</style>

<!-- ✅ 组件私有样式：可以 scoped -->
<style scoped>
#app {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;     /* ← 替换原来的 min-height:100vh */
  margin: 0;
  padding: 0;
}

/* 可保留，但不要再给 #app 设 margin: 0 auto 这类会影响宽度计算的属性 */
@media (min-width: 1024px) {
  #app { padding: 0; }
}
@media (max-width: 1024px) {
  #app { background-color: #f5f5f5; padding: 0; }
}
</style>
