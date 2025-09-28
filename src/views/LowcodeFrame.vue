<template>
  <div class="w-full overflow-hidden h-[calc(100vh-60px)] p-0 m-0">
    <iframe
        id="xling-iframe"
        class="w-full border-none"
        :style="{ height: '100%', overflow: 'hidden' }"
        :src="iframeFullUrl"
    />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { getToken } from '@/utils/auth'

const route = useRoute()

// 固定租户ID（不再从外部传入）
const TENANT_ID = '180'

// 低代码平台基础域
const basePrefix =
    import.meta.env.VITE_IFRAME_BASE_URL || 'https://platform.xlingdata.com'

// 由菜单传入的低代码子路径（如：/lowcode/dynamicInfo/index/29）
const rawPath = computed(() => {
  const p = String(route.query.url || '/')
  return p.startsWith('/') ? p : `/${p}`
})

// 拼接查询参数（只添加有值的 token；tenant-id 固定 180）
function buildQuery() {
  const qs = new URLSearchParams()
  const token = getToken?.() || ''
  if (token) qs.set('token', token)
  qs.set('tenant-id', TENANT_ID)
  return qs.toString()
}

// 兼容 rawPath 自带 query 的场景
function joinUrl(host, path, query) {
  if (!query) return `${host}${path}`
  return `${host}${path}${path.includes('?') ? '&' : '?'}${query}`
}

const iframeFullUrl = computed(() => {
  const q = buildQuery()
  return joinUrl(basePrefix, rawPath.value, q)
})

// 调试日志
watchEffect(() => {
  console.log('🔍 url:', rawPath.value)
  console.log('🌐 iframeFullUrl:', iframeFullUrl.value)
})
</script>
