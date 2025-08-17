<template>
  <div class="p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <!-- 顶部标题 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
        <h2 class="text-base font-semibold">接口测试台</h2>
      </div>
      <div class="text-xs opacity-60">仅用于联调与验证 · 避免提交敏感信息</div>
    </div>

    <!-- 服务卡片列表 -->
    <el-card
        v-for="service in serviceList"
        :key="service.name_code"
        shadow="never"
        class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg"
    >
      <!-- Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <span class="inline-block w-1.5 h-4 rounded bg-[color:var(--primary-color)]"></span>
            <div class="truncate font-medium">{{ service.name }}</div>

            <!-- 多彩渐变芯片：服务 code -->
            <el-tag
                size="small"
                effect="dark"
                class="rainbow-chip rounded-full"
                :style="chipStyle(service.name_code)"
            >
              {{ service.name_code }}
            </el-tag>

            <!-- 成功/失败状态 -->
            <el-tag v-if="service.status===true" size="small" type="success">成功</el-tag>
            <el-tag v-else-if="service.status===false" size="small" type="danger">失败</el-tag>
          </div>
          <div class="flex items-center gap-2">
            <el-button size="small" plain @click="openParamDialog(service)">修改参数</el-button>
            <el-button
                type="primary"
                size="small"
                class="min-w-[88px]"
                :loading="service.loading"
                @click="invokeService(service)"
            >调用</el-button>
          </div>
        </div>
      </template>

      <!-- 主体栅格 -->
      <div class="grid grid-cols-12 gap-4">
        <!-- 左：描述/参数说明（亮色高亮盒） -->
        <div class="col-span-12 lg:col-span-3 space-y-2">
          <div class="text-sm text-neutral-600 dark:text-neutral-300 leading-6">
            {{ service.service_des }}
          </div>

          <div
              v-if="service.params && service.params.length"
              class="mt-1 max-h-56 overflow-auto rounded p-3 accent-box"
              :style="accentBoxStyle(service.name_code)"
          >
            <div class="text-xs mb-2 opacity-80 flex items-center gap-2">
              <span class="dot" :style="dotStyle(service.name_code)"></span>
              参数说明
            </div>
            <ul class="space-y-2 text-xs leading-5">
              <li v-for="param in service.params" :key="param.param_name">
                <span class="font-semibold text-neutral-800 dark:text-neutral-100">{{ param.param_name }}</span>
                <span class="text-neutral-500">（{{ param.param_type }}）</span>：
                <span class="text-neutral-500">{{ param.param_desc }}</span>
                <span v-if="param.param_default != null" class="text-neutral-400 ml-1">
                  [默认: {{ param.param_default }}]
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 中：输入 JSON（亮色高亮盒） -->
        <div class="col-span-12 lg:col-span-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs opacity-80 flex items-center gap-2">
              <span class="dot" :style="dotStyle(service.name_code)"></span>
              请求体（JSON）
            </div>
            <div class="flex items-center gap-2">
              <el-button size="small" text @click="copyText(service.input)">复制</el-button>
            </div>
          </div>
          <div class="rounded p-2 accent-box"
               :style="accentBoxStyle(service.name_code)">
            <VueJsonPretty
                v-model:data="service.input"
                class="vue-json-pretty font-mono text-[12px] min-h-[160px]"
            />
          </div>
        </div>

        <!-- 中右：操作（保留） -->
        <div class="col-span-12 lg:col-span-1 flex lg:flex-col gap-2 justify-start">
          <el-button
              type="primary"
              size="default"
              class="w-full lg:w-auto"
              :loading="service.loading"
              @click="invokeService(service)"
          >调用</el-button>
          <el-button size="default" class="w-full lg:w-auto" plain @click="openParamDialog(service)">参数</el-button>
        </div>

        <!-- 右：输出 JSON（亮色高亮盒） -->
        <div class="col-span-12 lg:col-span-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs opacity-80 flex items-center gap-2">
              <span class="dot" :style="dotStyle(service.name_code)"></span>
              响应结果
            </div>
            <div class="flex items-center gap-2">
              <el-button size="small" text @click="copyText(service.result)">复制</el-button>
            </div>
          </div>
          <div class="rounded p-2 accent-box"
               :style="accentBoxStyle(service.name_code)">
            <VueJsonPretty
                :data="service.result"
                class="vue-json-pretty font-mono text-[12px] min-h-[160px]"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 参数编辑弹框 -->
    <el-dialog v-model="dialogVisible" title="编辑参数" width="640px" class="dark:bg-neutral-900">
      <el-table :data="editingService && editingService.params ? editingService.params : []" border size="small"
                class="rounded border border-neutral-200 dark:border-neutral-700">
        <el-table-column label="参数名" prop="param_name" width="180"/>
        <el-table-column label="参数值">
          <template #default="{ row }">
            <el-input
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
                v-model="paramValues[row.param_name]"
                @input="handleInputChange(row.param_name)"
            />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { commonServiceClient } from '@/api/commonServiceClient'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const serviceList = ref([])
const dialogVisible = ref(false)
const editingService = ref(null)
const paramValues = ref({})

/* —— 亮色化辅助：同一 code => 稳定色相 —— */
function hashHue(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % 360
}
function chipStyle(key = '') {
  const h = hashHue(key)
  const c1 = `hsla(${h}, 85%, 55%, 1)`
  const c2 = `hsla(${(h + 30) % 360}, 85%, 55%, 1)`
  return {
    backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
    color: '#fff'
  }
}
function accentBoxStyle(key = '') {
  const h = hashHue(key)
  const border = `hsla(${h}, 90%, 55%, 1)`
  const tintL = `hsla(${h}, 90%, 55%, .10)`   // 浅色块
  const tintD = `hsla(${h}, 90%, 65%, .08)`   // 深色块（在 dark 下看起来略亮）
  const isDark = document.documentElement.classList.contains('dark')
  return {
    border: `1px solid ${border}`,
    background: `linear-gradient(180deg, ${isDark ? tintD : tintL}, transparent)`
  }
}
function dotStyle(key = '') {
  const h = hashHue(key)
  return { background: `hsla(${h}, 95%, 55%, 1)` }
}

/* —— 原有逻辑保持 —— */
function openParamDialog(service) {
  editingService.value = service
  dialogVisible.value = true
  paramValues.value = {}
  for (const key in service.input) {
    const val = service.input[key]
    if (typeof val === 'object') {
      try { paramValues.value[key] = JSON.stringify(val, null, 2) } catch { paramValues.value[key] = '' }
    } else {
      paramValues.value[key] = String(val ?? '')
    }
  }
}
function handleInputChange(key) {
  try {
    const raw = paramValues.value[key]
    editingService.value.input[key] = JSON.parse(raw)
  } catch { /* 非法 JSON，忽略 */ }
}
function parseResultSafely(result) {
  if (result == null) return null
  if (typeof result === 'object') return result
  if (typeof result === 'string') { try { return JSON.parse(result) } catch { return result } }
  return result
}

onMounted(async () => {
  await commonServiceClient.init()
  serviceList.value = []

  for (const [, service] of commonServiceClient.serviceConfigMap.entries()) {
    const defaultInput = {}
    for (const param of service.params || []) {
      try {
        const parsed = JSON.parse(param.param_default ?? 'null')
        defaultInput[param.param_name] = parsed
      } catch {
        defaultInput[param.param_name] = param.param_default ?? null
      }
    }
    serviceList.value.push({
      ...service,
      input: defaultInput,
      result: parseResultSafely(service.result),
      status: null,
      loading: false
    })
  }
})

async function invokeService(service) {
  try {
    service.loading = true
    const res = await commonServiceClient.invoke(service.name_code, service.input)
    service.result = res.data
    service.status = service.result && service.result.success
  } catch (e) {
    service.result = { error: e.message }
    service.status = false
  } finally {
    service.loading = false
  }
}

function copyText(val) {
  const text = typeof val === 'string' ? val : JSON.stringify(val ?? '', null, 2)
  navigator.clipboard?.writeText(text).then(() => {
    console.log('copied')
  })
}
</script>

<style scoped>
:root { --primary-color: #165DFF; }

/* JSON 视图滚动/字体 */
.vue-json-pretty { max-height: 360px; overflow: auto; }
:deep(.vjs-tree__node) { line-height: 1.6; }

/* 渐变芯片基础外观（亮） */
.rainbow-chip {
  border: none !important;
  color: #fff !important;
  font-weight: 600;
  letter-spacing: .2px;
  padding: 2px 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,.15);
}
.rainbow-chip :deep(.el-tag__content) { color: inherit; }
:deep(html.dark) .rainbow-chip { box-shadow: 0 2px 8px rgba(0,0,0,.25); }

/* 高亮盒共同样式 */
.accent-box {
  border-radius: .5rem;
}

/* 小彩点 */
.dot {
  width: 8px; height: 8px; border-radius: 9999px; display: inline-block;
}

/* Element 深色细节 */
:deep(html.dark) .el-card__header { border-bottom: 1px solid rgba(255,255,255,.08); }
:deep(html:not(.dark)) .el-card__header { border-bottom: 1px solid rgba(0,0,0,.06); }
:deep(html.dark) .el-table th.el-table__cell {
  background: #0f172a; color: #e5e7eb;
}

/* 让 JSON 选中高亮在浅色主题下清晰可读 */
:deep(.vue-json-pretty pre)::selection,
:deep(.vue-json-pretty span)::selection {
  /* 背景亮蓝，文字深色 */
  background: #bfdbfe;              /* tailwind sky-200 */
  color: #111827 !important;        /* neutral-900 */
}
:deep(.vue-json-pretty pre)::-moz-selection,
:deep(.vue-json-pretty span)::-moz-selection {
  background: #bfdbfe;
  color: #111827 !important;
}

/* 深色主题下的选中高亮（更亮一点且文字为深色，反差更大） */
:deep(html.dark) .vue-json-pretty pre::selection,
:deep(html.dark) .vue-json-pretty span::selection {
  background: rgba(59, 130, 246, .55);   /* sky-500 with opacity */
  color: #0f172a !important;             /* slate-900 */
}
:deep(html.dark) .vue-json-pretty pre::-moz-selection,
:deep(html.dark) .vue-json-pretty span::-moz-selection {
  background: rgba(59, 130, 246, .55);
  color: #0f172a !important;
}

</style>
