<template>
  <div class="p-0 m-0 w-full h-screen overflow-hidden">
    <iframe
        id="xling-iframe"
        class="w-full h-full border-none overflow-hidden"
        :src="iframeFullUrl"
    ></iframe>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getTenantId, getToken } from "@/utils/auth.js";

// 获取 token 和 tenant-id
const token = getToken()
const tenantId = getTenantId()

// 日志输出
console.log('🔐 token:', token)
console.log('🏢 tenant-id:', tenantId)

const baseUrl = 'https://dev.xlingdata.com/index/workbench'
const iframeFullUrl = computed(() => {
  const queryParams = new URLSearchParams({
    token,
    'tenant-id': tenantId
  }).toString()
  return `${baseUrl}?${queryParams}`
})
</script>
<style scoped>

</style>
