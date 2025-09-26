<script setup>
import {onMounted, ref, computed, watch} from 'vue'
import {getBasePageData} from '@/mock/basePageService'  // 保持不变
import {BASE_FORM_ID, getSysConfigFormId} from '@/api/constant/form_constant';

import ThemeToggle from '@/components/ThemeToggle.vue'
import {ArrowRight} from '@element-plus/icons-vue'
import DeviceAssessmentModal from '@/buz/eavalue/DeviceAssessmentModal.vue'
import {getAssessmentUnits, getBaseList} from "@/mock/fetchDataApi.js";
import {useRoute} from "vue-router";
import router from "@/router/index.js";

const days = ref(7)
const loading = ref(true)
const data = ref(null)
const sortKey = ref('highDevices') // 装置卡排序
const rankTab = ref('devices')     // 左榜 Tab：devices/diagnoses/rul/lag
const dialogAssess = ref(false)    // 任务评估弹窗
const assessmentUnits = ref([])

const baseList = ref([]) // 基地列表

const selectedBaseId = ref(null)
const selectedBase = computed(() =>
    baseList.value.find(b => String(b.id) === String(selectedBaseId.value)) || null
)

// 路由参数
const route = useRoute()

// 监听路由参数变化，把它同步到 selectedBaseId
watch(
    () => route.params.baseId,
    (newBaseId) => {
      if (newBaseId) {
        selectedBaseId.value = String(newBaseId)
      }
    },
    { immediate: true } // 页面初始挂载时也执行一次
)

// 状态映射：与设备/装置一致风格，兼容数字/英文/中文
const BASE_STATUS_MAP = {
  '1': { label: '正常', type: 'success' },
  '2': { label: '预警', type: 'warning' },
  '3': { label: '故障', type: 'danger' },
  '4': { label: '停用', type: 'info' },
  normal:  { label: '正常', type: 'success' },
  warning: { label: '预警', type: 'warning' },
  fault:   { label: '故障', type: 'danger' },
  stopped: { label: '停用', type: 'info' },
  '正常':  { label: '正常', type: 'success' },
  '预警':   { label: '预警', type: 'warning' },
  '故障':   { label: '故障', type: 'danger' },
  '停用':   { label: '停用', type: 'info' }
};

const baseStatusInfo = computed(() => {
  const raw = baseInfo.value?.status ?? '';
  const k1 = String(raw).trim();
  const k2 = k1.toLowerCase();
  return BASE_STATUS_MAP[k1] || BASE_STATUS_MAP[k2] || BASE_STATUS_MAP[String(Number(k1))] || { label: '未知', type: 'info' };
});

// 小工具：数值转定点字符串
// 小工具：数值转定点字符串（JS版，不带类型注解）
const toFixedOrEmpty = (v, n = 6) => {
  const num = Number(v)
  return Number.isFinite(num) ? num.toFixed(n) : ''
}

// 兼容不同字段命名：longitude/lat/long/lat、start_date/startDate
const rawLng = computed(() =>
    baseInfo.value?.longitude ?? baseInfo.value?.lng ?? baseInfo.value?.long ?? ''
)
const rawLat = computed(() =>
    baseInfo.value?.latitude ?? baseInfo.value?.lat ?? ''
)
const rawStartDate = computed(() =>
    baseInfo.value?.start_date ?? baseInfo.value?.startDate ?? baseInfo.value?.startTime ?? ''
)

// 输出给模板用的格式化文本
const fmtLng = computed(() => toFixedOrEmpty(rawLng.value))      // 例如 "104.061234"
const fmtLat = computed(() => toFixedOrEmpty(rawLat.value))      // 例如 "30.658765"
const fmtStartDate = computed(() => {
  const s = String(rawStartDate.value || '')
  // 兼容 "YYYY-MM-DD" 或 ISO 时间串，尽量取日期部分
  if (!s) return ''
  return s.includes('T') ? s.replace('T',' ').slice(0,19) : s.slice(0,10)
})

// 可选：评价时间兜底（有就显示）
const baseAssessTime = computed(() => {
  const b = baseInfo.value || {};
  return b.evaluate_time || b.assess_time || b.assessTime || b.time || '';
});

const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold || 70}%`)
const kpis = computed(() => data.value?.kpis || {})
const baseInfo = computed(() => data.value?.base || {})

const unitCards = computed(() => {
  if (!data.value) return []
  const list = [...data.value.unitCards]
  switch (sortKey.value) {
    case 'highDevices':
      return list.sort((a, b) => b.diagSummary.highDevices - a.diagSummary.highDevices)
    case 'highCount':
      return list.sort((a, b) => b.diagSummary.highCount - a.diagSummary.highCount)
    case 'risk':
      return list.sort((a, b) => b.risk.score - a.risk.score)
    default:
      return list
  }
})

const healthBuckets = computed(() => data.value?.deviceStats?.healthBuckets || [])
const rulBuckets = computed(() => data.value?.deviceStats?.rulBuckets || [])
const rankRows = computed(() => {
  if (!data.value) return []
  switch (rankTab.value) {
    case 'devices':
      return data.value.rankings.byHighProbDevices
    case 'diagnoses':
      return data.value.rankings.byHighProbDiagnoses
    case 'rul':
      return data.value.rankings.byShortRULShare
    case 'lag':
      return data.value.rankings.byCoverageLag
  }
})

function tagLevel(level) {
  return level === 'high' ? 'danger' : level === 'mid' ? 'warning' : 'success'
}

function goUnit(rowOrCard) {
  // 兼容：左侧榜单 row 有 row.unit；中间卡片直接传 card（包含 card.unit）
  const unit = rowOrCard?.unit ?? rowOrCard
  const uid  = unit?.id
  const bid  = selectedBaseId?.value ?? route.params.baseId

  if (!uid || !bid) {
    console.error('[goUnit] 缺少必要参数', { uid, bid, rowOrCard })
    return
  }

  router.push({
    name: 'ManageSysView',
    params: {
      baseId: String(bid),
      unitId: String(uid)
    }
  })
}



function applyBucketFilter(label) {
  if (label.includes('天')) sortKey.value = 'risk'
  else sortKey.value = 'highDevices'
}

async function loadBaseList() {
  const baseListRes = await getBaseList()
  baseList.value = baseListRes || []

  selectedBaseId.value = route.params.baseId
      ? String(route.params.baseId)
      : (baseList.value[0] ? String(baseList.value[0].id) : null)

  if (selectedBaseId.value != null) {
    await load()
  }
}


async function load() {
  loading.value = true
  data.value = await getBasePageData(getSysConfigFormId(BASE_FORM_ID), selectedBaseId.value, {
    days: days.value,
    highProbThreshold: 70
  })
  assessmentUnits.value = await getAssessmentUnits(selectedBaseId.value)
  loading.value = false
}

onMounted(() => {
  loadBaseList();  // 在页面加载时调用 loadBaseList 方法加载基地列表
});
</script>

<template>
  <div
      class="p-1 lg:p-2 bg-white dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 顶部条 -->
    <div class="px-4 lg:px-6 pt-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
      <!-- 第一行：左(基地名+状态牌) | 右(3个主KPI) -->
      <div class="grid grid-cols-12 gap-4 items-start">
        <!-- 左：基地名 + 状态牌 + 评价时间 -->
        <div class="col-span-12 min-w-0">
          <div class="flex items-center gap-12">
            <h1 class="device-title truncate">{{ selectedBase?.name || '请选择基地' }}</h1>

            <!-- 状态牌 + 评价时间（与设备页一致） -->
            <div class="flex flex-col items-center">
              <div class="status-board" :class="'sb-' + baseStatusInfo.type">
                <span class="sb-text">{{ baseStatusInfo.label }}</span>
              </div>
              <div class="mt-1 text-[14px] opacity-80 text-center" v-if="baseAssessTime">
                评价时间：<span class="font-medium">{{ baseAssessTime.replace('T',' ').slice(0,19) }}</span>
              </div>
            </div>

            <!-- 添加ml-auto使KPI部分右对齐 -->
            <div class="grid grid-cols-5 gap-3 ml-auto">
              <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
                <div class="kpi-label">装置 / 设备</div>
                <div class="kpi-value">{{ kpis.unitsCount || 0 }} / {{ kpis.devicesCount || 0 }}</div>
              </el-card>
              <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
                <div class="kpi-label">诊断次数（{{ days }}天）</div>
                <div class="kpi-value">{{ kpis.diagnosisCount || 0 }}</div>
              </el-card>
              <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
                <div class="kpi-label">高概率诊断数</div>
                <div class="kpi-value text-red-500 dark:text-red-400">{{ kpis.highProbCount || 0 }}</div>
              </el-card>
              <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
                <div class="kpi-label">高概率设备数</div>
                <div class="kpi-value">{{ kpis.highProbDevices || 0 }}</div>
              </el-card>
              <el-card shadow="never" class="kpi-card dark:bg-neutral-800">
                <div class="kpi-label">数据新鲜度（中位）</div>
                <div class="kpi-value">{{ kpis.freshnessHours != null ? (kpis.freshnessHours + 'h') : '—' }}</div>
              </el-card>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：基地选择器（弱化，放单独一行） -->
      <div class="mt-3 flex items-center gap-1">
        <el-select v-model="selectedBaseId" placeholder="请选择基地" style="width:150px;" @change="load">
          <el-option v-for="base in baseList" :key="base.id" :label="base.name" :value="String(base.id)" />
        </el-select>
      </div>

      <!-- 第三行：信息 Tag（地址/经纬度/启用时间） -->
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <el-tag size="default" effect="plain">地址：{{ baseInfo.address || '—' }}</el-tag>
        <el-tag v-if="fmtLng" size="default" effect="plain">经度：{{ fmtLng }}</el-tag>
        <el-tag v-if="fmtLat" size="default" effect="plain">纬度：{{ fmtLat }}</el-tag>
        <el-tag v-if="fmtStartDate" size="default" effect="plain">启用：{{ fmtStartDate }}</el-tag>
      </div>

    </div>


    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="rect" style="height:420px"/>
      </template>

      <!-- 单屏三栏 -->
      <div class="grid grid-cols-12 gap-4">
        <!-- 左：装置风险榜 -->
        <el-card class="col-span-3 dark:bg-neutral-800" shadow="never" body-style="padding:0">
          <div class="p-3 border-b border-neutral-200 dark:border-neutral-700">
            <div class="header-bar font-medium mb-2">装置风险榜</div>
            <el-segmented
                v-model="rankTab"
                :options="[
                    {label:'高概率设备',value:'devices'},
                    {label:'高概率诊断',value:'diagnoses'},
                    {label:'RUL短期',value:'rul'},
                    {label:'覆盖滞后',value:'lag'}
                  ]"
                              size="small"
                          />
          </div>

          <div class="max-h-[520px] overflow-auto">
            <el-table :data="rankRows" size="small" class="!bg-transparent" :row-class-name="()=>'cursor-pointer'"
                      @row-click="(row)=>goUnit(row)">
              <el-table-column label="装置" min-width="120">
                <template #default="{row}">
                  <div class="flex items-center gap-2">
                    <span class="truncate" :title="row.unit.system_name">{{ row.unit.system_name }}</span>
                    <el-tag size="small"
                            :type="(row.unit.system_status==='Fault'?'danger':row.unit.system_status==='Warning'?'warning':'success')">
                      {{ row.unit.system_status }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="rankTab==='devices'" label="高概率设备" width="96" prop="diagSummary.highDevices"/>
              <el-table-column v-else-if="rankTab==='diagnoses'" label="高概率诊断" width="96"
                               prop="diagSummary.highCount"/>
              <el-table-column v-else-if="rankTab==='rul'" label="Avg RUL" width="88">
                <template #default="{row}">{{ row.health.deviceAgg.avgRUL }}</template>
              </el-table-column>
              <el-table-column v-else label="最近诊断" width="112">
                <template #default="{row}">
                  {{ row.diagSummary.lastDiag ? row.diagSummary.lastDiag.replace('T', ' ').slice(5, 16) : '—' }}
                </template>
              </el-table-column>
              <el-table-column label="风险" width="84">
                <template #default="{row}">
                  <el-tag :type="tagLevel(row.risk.level)" size="small">{{ row.risk.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column width="50" align="center">
                <template #default>
                  <el-icon>
                    <ArrowRight/>
                  </el-icon>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <!-- 中：装置卡片区（2×3） -->
        <div class="col-span-6">
          <div class="flex items-center justify-between mb-2 header-bar">
            <div class="font-medium ">装置概览</div>
            <div class="flex items-center gap-3"> <!-- gap 改大一点 -->
              <span class="text-xs opacity-70">排序</span>
              <el-select v-model="sortKey" size="small" style="width: 150px" class="w-40">
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
                <el-tag
                    :type="(card.unit.system_status==='Fault'?'danger':card.unit.system_status==='Warning'?'warning':'success')"
                    size="small">
                  {{ card.unit.system_status }}
                </el-tag>
              </div>
              <div class="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                {{ card.unit.system_type }} · {{ card.unit.system_code }}
              </div>

              <div class="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">诊断数</div>
                  <div class="font-semibold">{{ card.diagSummary.count }}</div>
                </div>
                <div>
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">高概率</div>
                  <div class="font-semibold text-red-500 dark:text-red-400">{{ card.diagSummary.highCount }}</div>
                </div>
                <div>
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">高概设备</div>
                  <div class="font-semibold">{{ card.diagSummary.highDevices }}</div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">装置RUL</div>
                  <div class="font-semibold">{{ card.health.unitLevel.remaining_life }}天</div>
                </div>
                <div>
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">装置Conf</div>
                  <div class="font-semibold">{{ card.health.unitLevel.confidence_level }}%</div>
                </div>
                <div>
                  <
                  <div class="text-[13px] text-neutral-600 dark:text-neutral-300">设备Avg RUL</div>
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
            <div class="flex items-center justify-between mb-2 header-bar">
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
            <div class="flex items-center justify-between mb-2 header-bar">
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

    <el-dialog
        v-model="dialogAssess"
        title="任务评估"
        width="60vw"
        append-to-body
    >
      <!-- 传入 mock 数据与基地经纬度 -->
      <DeviceAssessmentModal
          :devices="assessmentUnits"
          :baseLat="baseInfo.latitude"
          :baseLon="baseInfo.longitude"
      />
    </el-dialog>


  </div>
</template>

<style scoped>
/* 适度收紧卡片留白，提升信息密度 */
:deep(.el-card__body) {
  padding: 12px;
}

/* KPI 卡片：有“线条感”的边框与微渐变 */
.kpi-card{
  border: 1px solid rgba(0,0,0,.10);
  background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.05));
}
.dark .kpi-card{
  border-color: rgba(255,255,255,.12);
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.05));
}
.kpi-label{ font-size: 14px; font-weight: 500; opacity: .9; }
.kpi-value{ margin-top: 2px; font-size: 22px; font-weight: 400; line-height: 1; }
.kpi-unit{ margin-left: 4px; font-size: 12px; font-weight: 400; opacity: .85; }
.status-board {
  min-width: 160px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.15);
}
.sb-text{
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 2px;
}
/* 标题栏背景：亮色模式浅灰、暗色模式深灰 */
.header-bar {
  background: linear-gradient(180deg, #f9fafb, #fdffff); /* 亮色：浅灰渐变 */
  padding: 5px 10px;
  margin: 5px 10px;

}
.dark .header-bar {
  background: linear-gradient(180deg, #1f1f1f, #2a2a2a); /* 暗色：深灰渐变 */
  border-bottom: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
  padding: 5px 10px;
  margin: 0;
}

/* 颜色方案（跟随 statusInfo.type） */
.sb-success{ background: #08af15; color: #f6f2f6; }  /* 正常：深绿底、荧绿字 */
.sb-warning{ background: #ef9907; color: #f6f2f6; }  /* 预警 */
.sb-danger { background: #7a0a0a; color: #ffb3b3; }  /* 故障 */
.sb-info   { background: #3a3a3a; color: #dcdcdc; }  /* 停用/未知 */

/* 大标题：和截图同级的“视觉分量” */
.device-title{
  font-size: clamp(32px, 6vw, 52px); /* 1号主泵 的量级 */
  font-weight: 700;
  line-height: 1;
  letter-spacing: .5px;
  white-space: nowrap;
}

</style>
