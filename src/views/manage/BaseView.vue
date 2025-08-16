<!-- src/pages/BaseView.vue -->
<script setup>
import { onMounted, ref, computed } from 'vue'
import { getBasePageData } from '@/mock/dataService'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { ArrowRight } from '@element-plus/icons-vue'

const days = ref(7)
const loading = ref(true)
const data = ref(null)
const sortKey = ref('highDevices') // 装置卡排序
const rankTab = ref('devices')     // 左榜 Tab：devices/diagnoses/rul/lag

const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold || 70}%`)
const kpis = computed(() => data.value?.kpis || {})
const baseInfo = computed(() => data.value?.base || {})
const unitCards = computed(() => {
  if (!data.value) return []
  const list = [...data.value.unitCards]
  switch (sortKey.value) {
    case 'highDevices': return list.sort((a,b)=>b.diagSummary.highDevices-a.diagSummary.highDevices)
    case 'highCount': return list.sort((a,b)=>b.diagSummary.highCount-a.diagSummary.highCount)
    case 'risk': return list.sort((a,b)=>b.risk.score-a.risk.score)
    default: return list
  }
})
const healthBuckets = computed(() => data.value?.deviceStats?.healthBuckets || [])
const rulBuckets = computed(() => data.value?.deviceStats?.rulBuckets || [])
const rankRows = computed(()=> {
  if (!data.value) return []
  switch (rankTab.value) {
    case 'devices': return data.value.rankings.byHighProbDevices
    case 'diagnoses': return data.value.rankings.byHighProbDiagnoses
    case 'rul': return data.value.rankings.byShortRULShare
    case 'lag': return data.value.rankings.byCoverageLag
  }
})

function tagLevel(level){
  return level==='high' ? 'danger' : level==='mid' ? 'warning' : 'success'
}
function goUnit(card){
  // 预留路由跳转
  // router.push({ name:'unit', params:{ unitId: card.unit.id }, query:{ days: days.value } })
  console.log('→ 装置页', card.unit.system_name)
}
function applyBucketFilter(label){
  // 简化：点击分布，只影响排序与卡片视觉提醒（不展开设备列表）
  if(label.includes('天')) sortKey.value = 'risk'
  else sortKey.value = 'highDevices'
}

async function load(){
  loading.value = true
  data.value = await getBasePageData(1, { days: days.value, highProbThreshold: 70 })
  loading.value = false
}
onMounted(load)
</script>

<template>
  <div class="p-4 lg:p-6 bg-white dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 顶部条 -->
    <div class="flex items-center justify-between gap-4 mb-4">
      <div class="flex items-center gap-3">
        <div class="text-xl font-semibold">{{ baseInfo.name || '—' }}</div>
        <el-tag size="small" :type="(baseInfo.status==='Fault'?'danger':baseInfo.status==='Warning'?'warning':'success')">
          {{ baseInfo.status || 'Unknown' }}
        </el-tag>
        <el-tag size="small" effect="plain">地址：{{ baseInfo.adress || '—' }}</el-tag>
      </div>
      <div class="flex items-center gap-3">
        <el-segmented v-model="days" :options="[7,30]" size="small" />
        <el-tag size="small" effect="plain">{{ highProbText }}</el-tag>
        <div class="text-xs opacity-70">
          更新时间：{{ (baseInfo.time || '').replace('T',' ').slice(0,19) }}
        </div>
        <el-button size="small" @click="load">刷新</el-button>
        <ThemeToggle/>
      </div>
    </div>

    <!-- KPI 带 -->
    <div class="grid grid-cols-5 gap-3 mb-4">
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="text-xs opacity-60 mb-1">装置 / 设备</div>
        <div class="text-2xl font-semibold">{{ kpis.unitsCount || 0 }} / {{ kpis.devicesCount || 0 }}</div>
      </el-card>
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="text-xs opacity-60 mb-1">诊断次数（{{days}}天）</div>
        <div class="text-2xl font-semibold">{{ kpis.diagnosisCount || 0 }}</div>
      </el-card>
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="text-xs opacity-60 mb-1">高概率诊断数</div>
        <div class="text-2xl font-semibold text-red-500 dark:text-red-400">{{ kpis.highProbCount || 0 }}</div>
      </el-card>
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="text-xs opacity-60 mb-1">高概率设备数</div>
        <div class="text-2xl font-semibold">{{ kpis.highProbDevices || 0 }}</div>
      </el-card>
      <el-card shadow="never" class="dark:bg-neutral-800">
        <div class="text-xs opacity-60 mb-1">数据新鲜度（中位）</div>
        <div class="text-2xl font-semibold">{{ kpis.freshnessHours != null ? (kpis.freshnessHours + 'h') : '—' }}</div>
      </el-card>
    </div>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="rect" style="height:420px" />
      </template>

      <!-- 单屏三栏 -->
      <div class="grid grid-cols-12 gap-4">
        <!-- 左：装置风险榜 -->
        <el-card class="col-span-3 dark:bg-neutral-800" shadow="never" body-style="padding:0">
          <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
            <div class="font-medium">装置风险榜</div>
            <el-segmented v-model="rankTab"
                          :options="[{label:'高概率设备',value:'devices'},{label:'高概率诊断',value:'diagnoses'},{label:'RUL短期',value:'rul'},{label:'覆盖滞后',value:'lag'}]"
                          size="small" />
          </div>
          <div class="max-h-[520px] overflow-auto">
            <el-table :data="rankRows" size="small" class="!bg-transparent" :row-class-name="()=>'cursor-pointer'"
                      @row-click="(row)=>goUnit(row)">
              <el-table-column label="装置" min-width="120">
                <template #default="{row}">
                  <div class="flex items-center gap-2">
                    <span class="truncate" :title="row.unit.system_name">{{ row.unit.system_name }}</span>
                    <el-tag size="small" :type="(row.unit.system_status==='Fault'?'danger':row.unit.system_status==='Warning'?'warning':'success')">
                      {{ row.unit.system_status }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="rankTab==='devices'" label="高概率设备" width="96" prop="diagSummary.highDevices"/>
              <el-table-column v-else-if="rankTab==='diagnoses'" label="高概率诊断" width="96" prop="diagSummary.highCount"/>
              <el-table-column v-else-if="rankTab==='rul'" label="Avg RUL" width="88">
                <template #default="{row}">{{ row.health.deviceAgg.avgRUL }}</template>
              </el-table-column>
              <el-table-column v-else label="最近诊断" width="112">
                <template #default="{row}">{{ row.diagSummary.lastDiag ? row.diagSummary.lastDiag.replace('T',' ').slice(5,16) : '—' }}</template>
              </el-table-column>
              <el-table-column label="风险" width="84">
                <template #default="{row}">
                  <el-tag :type="tagLevel(row.risk.level)" size="small">{{ row.risk.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column width="50" align="center">
                <template #default>
                  <el-icon><ArrowRight/></el-icon>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <!-- 中：装置卡片区（2×3） -->
        <div class="col-span-6">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">装置概览</div>
            <div class="flex items-center gap-2">
              <span class="text-xs opacity-70">排序</span>
              <el-select v-model="sortKey" size="small" class="w-36">
                <el-option label="高概率设备数" value="highDevices"/>
                <el-option label="高概率诊断数" value="highCount"/>
                <el-option label="风险评分" value="risk"/>
              </el-select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <el-card v-for="card in unitCards.slice(0,6)" :key="card.unit.id" shadow="hover"
                     class="hover:shadow-lg transition-all dark:bg-neutral-800 cursor-pointer"
                     @click="goUnit(card)">
              <div class="flex items-center justify-between mb-1">
                <div class="font-medium truncate">{{ card.unit.system_name }}</div>
                <el-tag :type="(card.unit.system_status==='Fault'?'danger':card.unit.system_status==='Warning'?'warning':'success')" size="small">
                  {{ card.unit.system_status }}
                </el-tag>
              </div>
              <div class="text-xs opacity-70 mb-2">
                {{ card.unit.system_type }} · {{ card.unit.system_code }}
              </div>

              <div class="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div class="opacity-60">诊断数</div>
                  <div class="font-semibold">{{ card.diagSummary.count }}</div>
                </div>
                <div>
                  <div class="opacity-60">高概率</div>
                  <div class="font-semibold text-red-500 dark:text-red-400">{{ card.diagSummary.highCount }}</div>
                </div>
                <div>
                  <div class="opacity-60">高概设备</div>
                  <div class="font-semibold">{{ card.diagSummary.highDevices }}</div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div class="opacity-60">装置RUL</div>
                  <div class="font-semibold">{{ card.health.unitLevel.remaining_life }}天</div>
                </div>
                <div>
                  <div class="opacity-60">装置Conf</div>
                  <div class="font-semibold">{{ card.health.unitLevel.confidence_level }}%</div>
                </div>
                <div>
                  <div class="opacity-60">设备Avg RUL</div>
                  <div class="font-semibold">{{ card.health.deviceAgg.avgRUL }}</div>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-2">
                <div class="text-xs opacity-60">风险</div>
                <div class="flex-1 h-2 rounded bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div class="h-full"
                       :class="card.risk.level==='high'?'bg-red-500':(card.risk.level==='mid'?'bg-amber-500':'bg-emerald-500')"
                       :style="{ width: Math.min(100, card.risk.score) + '%' }"></div>
                </div>
                <el-tag :type="tagLevel(card.risk.level)" size="small">{{ card.risk.level }}</el-tag>
              </div>
            </el-card>
          </div>

          <div class="mt-2 text-xs opacity-60">
            * 展示 6 张卡片，更多请通过左侧榜单或筛选进入装置页
          </div>
        </div>

        <!-- 右：设备统计（两张小图） -->
        <div class="col-span-3 flex flex-col gap-3">
          <el-card shadow="never" class="dark:bg-neutral-800">
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">设备健康度分布</div>
              <el-tag size="small" effect="plain">点击分档筛装置</el-tag>
            </div>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="b in healthBuckets" :key="b.label"
                      @click="applyBucketFilter(b.label)"
                      class="flex flex-col items-center gap-1 px-2 py-3 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition">
                <div class="text-sm font-medium">{{ b.count }}</div>
                <div class="text-[10px] opacity-70">{{ b.label }}</div>
                <div class="text-[10px] opacity-60">{{ b.percent }}%</div>
              </button>
            </div>
          </el-card>

          <el-card shadow="never" class="dark:bg-neutral-800">
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">RUL 分布（天）</div>
              <el-tag size="small" effect="plain">点击分档筛装置</el-tag>
            </div>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="b in rulBuckets" :key="b.label"
                      @click="applyBucketFilter(b.label)"
                      class="flex flex-col items-center gap-1 px-2 py-3 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition">
                <div class="text-sm font-medium">{{ b.count }}</div>
                <div class="text-[10px] opacity-70">{{ b.label }}</div>
                <div class="text-[10px] opacity-60">{{ b.percent }}%</div>
              </button>
            </div>
          </el-card>
        </div>
      </div>
    </el-skeleton>
  </div>
</template>

<style scoped>
/* 适度收紧卡片留白，提升信息密度 */
:deep(.el-card__body){ padding: 12px; }
</style>
