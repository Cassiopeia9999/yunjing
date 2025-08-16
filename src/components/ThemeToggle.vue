<script setup>
import { isDark, toggleTheme } from '@/utils/theme'   // ← 使用全局状态与方法
import { Moon, Sunny } from '@element-plus/icons-vue'
</script>

<template>
  <el-switch
     v-model="isDark"
  inline-prompt
  :active-text="'深色'"
  :inactive-text="'浅色'"
  :active-icon="Moon"
  :inactive-icon="Sunny"
  @change="(val) => toggleTheme(val)"
  />
</template>
