<template>
  <!-- 外层容器减去顶部高度 -->
  <div class="w-full overflow-hidden h-[calc(100vh-80px)]">
    <iframe
        id="xling-iframe"
        class="w-full border-none"
        :style="{ height: '100%', overflow: 'hidden' }"
        :src="iframeFullUrl"
    ></iframe>
  </div>
</template>


<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { getToken, getTenantId } from '@/utils/auth'

const route = useRoute()
const token = getToken()
const tenantId = getTenantId()

const basePrefix = import.meta.env.VITE_IFRAME_BASE_URL || 'https://dev.xlingdata.com'

// 构造完整 iframe URL
const iframeFullUrl = computed(() => {
  const rawPath = route.query.url || '/'
  const queryParams = new URLSearchParams({
    token,
    'tenant-id': tenantId
  }).toString()
  return `${basePrefix}${rawPath}?${queryParams}`
})

// 调试输出
watchEffect(() => {
  console.log('🔍 route.query.url:', route.query.url)
  console.log('🔐 token:', token)
  console.log('🏢 tenant-id:', tenantId)
  console.log('🌐 iframeFullUrl:', iframeFullUrl.value)
})
</script>
