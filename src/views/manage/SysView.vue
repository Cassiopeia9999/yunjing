<!-- src/pages/UnitView.vue -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { getUnitPageData } from '@/mock/unitMock'
import { ArrowRight, WarningFilled, TrendCharts, Operation } from '@element-plus/icons-vue'

/** 路由/状态 */
const route = useRoute()
const unitId = ref(route.params.unitId || 1)
const days = ref(7) // 7/30
const loading = ref(true)
const data = ref(null)

/** 过滤/排序/搜索 */
const keyword = ref('')
const sortKey = ref('health') // health/rul/conf/diagTime/alarm
const filters = ref({
  status: null, type: null, model: null, alarmSeverity: null
})

/** 阈值与派生 */
const highProbText = computed(() => `Pθ=${data.value?.meta?.highProbThreshold ?? 70}%`)
const highProb = computed(() => data.value?.meta?.highProbThreshold ?? 70)
const unit = computed(() => data.value?.unit || {})
const kpis = computed(() => data.value?.kpis || {})
const agg  = computed(() => data.value?.aggregates || {})
const rawDevices = computed(() => data.value?.devices || [])
const statusOptions = computed(()=> data.value?.enums?.status || [])
const typeOptions   = computed(()=> data.value?.enums?.types || [])
const modelOptions  = computed(()=> data.value?.enums?.models || [])
const alarmLevelOptions = computed(()=> data.value?.enums?.alarmLevels || [])

/** 列表计算 */
const devices = computed(() => {
  let list = [...rawDevices.value]
  if (keyword.value?.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(r =>
        (r.device_name||'').toLowerCase().includes(kw) ||
        (r.component_code||'').toLowerCase().includes(kw) ||
        (r.component_model||'').toLowerCase().includes(kw)
    )
  }
  if (filters.value.status) list = list.filter(r => r.status === filters.value.status)
  if (filters.value.type) list = list.filter(r => r.component_type === filters.value.type)
  if (filters.value.model) list = list.filter(r => r.component_model === filters.value.model)
  if (filters.value.alarmSeverity) list = list.filter(r => r.alarm?.severity === filters.value.alarmSeverity)

  switch (sortKey.value) {
    case 'health':   list.sort((a,b)=>(b.health_level??0)-(a.health_level??0)); break
    case 'rul':      list.sort((a,b)=>(b.remaining_life??0)-(a.remaining_life??0)); break
    case 'conf':     list.sort((a,b)=>(b.confidence_level??0)-(a.confidence_level??0)); break
    case 'diagTime': list.sort((a,b)=>new Date(b.diag?.diagnosis_time||0)-new Date(a.diag?.diagnosis_time||0)); break
    case 'alarm':    list.sort((a,b)=>(b.alarm?.severityLevel??0)-(a.alarm?.severityLevel??0)); break
  }
  return list
})

/** 业务入口/事件 */
const selection = ref([])
function onSelectionChange(rows){ selection.value = rows || [] }
function openDevice(row){ console.log('→ 设备页', row.device_name) }
function openDiagnosisDetail(row){ if(row?.diag) console.log('→ 诊断详情', row.diag) }
function openAlarmDetail(row){ if(row?.alarm) console.log('→ 告警详情', row.alarm) }

/** 图表 */
const elDiagDist = ref(null)
const elAlarmDist = ref(null)
const elTrend = ref(null)
let ecDiag, ecAlarm, ecTrend

function renderCharts(){
  if (elDiagDist.value) {
    ecDiag = echarts.init(elDiagDist.value)
    const s = data.value?.charts?.diagDist || []
    ecDiag.setOption({
      tooltip:{trigger:'item'},
      series:[{ type:'pie', roseType:'area', radius:['20%','70%'],
        data: s.map(d=>({ name:`${d.name} (${d.highShare}%)`, value:d.value })) }]
    })
    ecDiag.off('click')
    ecDiag.on('click', p => { if(p?.name){ keyword.value = p.name.split(' (')[0] } })
  }
  if (elAlarmDist.value) {
    ecAlarm = echarts.init(elAlarmDist.value)
    const s = data.value?.charts?.alarmDist || []
    ecAlarm.setOption({
      tooltip:{trigger:'item'},
      series:[{ type:'pie', radius:'70%', data: s.map(d=>({ name:d.level, value:d.count })) }]
    })
    ecAlarm.off('click')
    ecAlarm.on('click', p => { filters.value.alarmSeverity = p?.name || null })
  }
  if (elTrend.value) {
    ecTrend = echarts.init(elTrend.value)
    const s = data.value?.charts?.diagTrend || { dates:[], counts:[] }
    ecTrend.setOption({
      tooltip:{trigger:'axis'},
      xAxis:{ type:'category', data:s.dates },
      yAxis:{ type:'value' },
      series:[{ type:'line', smooth:true, data:s.counts }]
    })
  }
}

/** 抽屉/对话框 */
const drawerAlarm = ref(false)
const dialogBatchDiag = ref(false)
const dialogBatchForecast = ref(false)
const dialogDecision = ref(false)
function openAlarmCenter(){ drawerAlarm.value = true }
function openBatchDiagnose(){ dialogBatchDiag.value = true }
function openBatchForecast(){ dialogBatchForecast.value = true }
function openDecision(){ dialogDecision.value = true }

/** 加载 */
async function load(){
  loading.value = true
  data.value = await getUnitPageData(unitId.value, { days: days.value, highProbThreshold: highProb.value })
  loading.value = false
  await nextTick()
  renderCharts()
}
onMounted(load)
</script>

<template>
  <!-- 顶层固定布局：头部固定 + 内容滚动 -->
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 头部（固定区域，不滚动） -->
    <div class="p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-700">
      <!-- 顶部条 -->
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="text-3xl font-semibold">{{ unit.system_name || '—' }}</div>
          <el-tag size="small" :type="(unit.system_status==='Fault'?'danger':unit.system_status==='Warning'?'warning':'success')">
            {{ unit.system_status || 'Unknown' }}
          </el-tag>
          <el-tag size="small" effect="plain">{{ unit.system_type || '—' }} · {{ unit.system_code || '—' }}</el-tag>
          <el-tag size="small" effect="plain">型号：{{ unit.system_model || '—' }}</el-tag>
          <el-tag size="small" effect="plain">厂家：{{ unit.manufacturer || '—' }}</el-tag>
          <el-tag size="small" effect="plain">安装：{{ unit.install_date || '—' }}</el-tag>
        </div>
        <div class="flex items-center gap-3">
          <el-segmented v-model="days" :options="[7,30]" size="small" @change="load"/>
          <el-tag size="small" effect="plain">{{ highProbText }}</el-tag>
          <div class="text-xs opacity-70">更新时间：{{ (unit.time || '').replace('T',' ').slice(0,19) }}</div>
          <el-button size="small" @click="load">刷新</el-button>
          <ThemeToggle/>
        </div>
      </div>

      <!-- KPI 带 -->
      <div class="grid grid-cols-5 gap-3">
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">装置级 RUL / Conf</div>
          <div class="text-2xl font-semibold">{{ unit.remaining_life ?? '—' }}天 / {{ unit.confidence_level ?? '—' }}%</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">设备均值（RUL / Conf）</div>
          <div class="text-2xl font-semibold">{{ agg.avgRUL ?? '—' }} / {{ agg.avgConf ?? '—' }}%</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">诊断次数（{{days}}天）</div>
          <div class="text-2xl font-semibold">{{ kpis.diagCount ?? 0 }}</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">高概率诊断数</div>
          <div class="text-2xl font-semibold text-red-500 dark:text-red-400">{{ kpis.highCount ?? 0 }}</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">未处理告警数</div>
          <div class="text-2xl font-semibold">{{ kpis.alarmOpen ?? 0 }}</div>
        </el-card>
      </div>
    </div>

    <!-- 内容（滚动区域）：只这一块会滚动 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template>
          <el-skeleton-item variant="rect" style="height:420px" />
        </template>

        <!-- 主体两栏 -->
        <div class="grid grid-cols-12 gap-4 min-h-0">
        <!-- 左：设备列表 -->
          <el-card class="col-span-8 min-w-0 dark:bg-neutral-800" shadow="never" body-style="padding:0">
            <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div class="font-medium">设备列表</div>
              <div class="flex items-center gap-2">
                <el-input v-model="keyword" size="small" placeholder="搜索设备/编码/型号" clearable class="w-56" />
                <el-select v-model="filters.status" size="small" placeholder="状态" clearable class="w-28">
                  <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
                </el-select>
                <el-select v-model="filters.type" size="small" placeholder="类型" clearable class="w-32">
                  <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
                </el-select>
                <el-select v-model="filters.model" size="small" placeholder="型号" clearable class="w-36">
                  <el-option v-for="m in modelOptions" :key="m" :label="m" :value="m" />
                </el-select>
                <el-select v-model="filters.alarmSeverity" size="small" placeholder="告警等级" clearable class="w-32">
                  <el-option v-for="lv in alarmLevelOptions" :key="lv" :label="lv" :value="lv" />
                </el-select>
                <span class="text-xs opacity-70">排序</span>
                <el-select v-model="sortKey" size="small" class="w-32">
                  <el-option label="健康度" value="health"/>
                  <el-option label="RUL" value="rul"/>
                  <el-option label="置信度" value="conf"/>
                  <el-option label="最近诊断" value="diagTime"/>
                  <el-option label="告警等级" value="alarm"/>
                </el-select>
              </div>
            </div>

            <!-- 这里不限制高度，让外层内容容器滚动即可 -->
            <div>
              <el-table
                  :data="devices"
                  size="small"
                  class="!bg-transparent"
                  :row-class-name="()=>'cursor-pointer'"
                  @row-dblclick="openDevice"
                  @selection-change="onSelectionChange"
                  :row-key="row=>row.id"
              >
                <el-table-column type="selection" width="40"/>
                <el-table-column label="设备" min-width="180">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <div class="font-medium truncate" :title="row.device_name">{{ row.device_name }}</div>
                      <el-tag size="small" :type="(row.status==='Fault'?'danger':row.status==='Warning'?'warning':'success')">
                        {{ row.status }}
                      </el-tag>
                    </div>
                    <div class="text-[12px] opacity-70 truncate" :title="row.component_code">
                      {{ row.component_type }} · {{ row.component_model }} · {{ row.component_code }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="健康度" width="88">
                  <template #default="{row}">{{ row.health_level ?? '—' }}</template>
                </el-table-column>
                <el-table-column label="RUL(天)" width="96" prop="remaining_life"/>
                <el-table-column label="Conf(%)" width="92" prop="confidence_level"/>

                <el-table-column label="最近诊断" min-width="220">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <el-tag v-if="row?.diag?.probability != null"
                              :type="row.diag.probability >= highProb ? 'danger':'info'"
                              size="small">{{ Math.round(row.diag.probability) }}%</el-tag>
                      <span class="truncate" :title="row.diag?.fault_knowledge_name || '—'">
                        {{ row.diag?.fault_knowledge_name || '—' }}
                      </span>
                      <el-button link type="primary" size="small" @click.stop="openDiagnosisDetail(row)">详情</el-button>
                    </div>
                    <div class="text-[12px] opacity-70">
                      {{ row.diag?.diagnosis_time ? row.diag.diagnosis_time.replace('T',' ').slice(0,19) : '—' }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="最新告警" min-width="200">
                  <template #default="{row}">
                    <div class="flex items-center gap-2">
                      <el-icon v-if="row.alarm" class="shrink-0"><WarningFilled/></el-icon>
                      <el-tag v-if="row?.alarm?.severity" size="small">{{ row.alarm.severity }}</el-tag>
                      <span class="truncate" :title="row.alarm?.type || '—'">{{ row.alarm?.type || '—' }}</span>
                      <el-button v-if="row.alarm" link type="primary" size="small" @click.stop="openAlarmDetail(row)">处置</el-button>
                    </div>
                    <div class="text-[12px] opacity-70">
                      {{ row.alarm?.time ? row.alarm.time.replace('T',' ').slice(0,19) : '—' }}
                    </div>
                  </template>
                </el-table-column>

                <el-table-column align="center" width="44">
                  <template #default><el-icon><ArrowRight/></el-icon></template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>

          <!-- 右：分析图表 -->
          <div class="col-span-4 min-w-0 flex flex-col gap-3">
            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">故障知识分布</div>
                <el-tag size="small" effect="plain">点击联动列表</el-tag>
              </div>
              <div ref="elDiagDist" class="h-[220px]"></div>
            </el-card>

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">告警等级占比</div>
                <el-tag size="small" effect="plain">点击筛选告警</el-tag>
              </div>
              <div ref="elAlarmDist" class="h-[220px]"></div>
            </el-card>

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">诊断趋势（{{days}}天）</div>
              </div>
              <div ref="elTrend" class="h-[220px]"></div>
            </el-card>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="text-xs opacity-70">
            * 双击行进入设备页；{{ highProbText }} 用于高概率着色与统计
          </div>
          <div class="flex items-center gap-2">
            <el-button size="small" type="primary" :icon="TrendCharts" plain :disabled="!selection.length" @click="openBatchDiagnose">
              批量诊断（已选 {{ selection.length }}）
            </el-button>
            <el-button size="small" type="primary" :icon="TrendCharts" :disabled="!selection.length" @click="openBatchForecast">
              批量趋势预测
            </el-button>
            <el-button size="small" type="warning" :icon="WarningFilled" plain @click="openAlarmCenter">
              装置告警中心
            </el-button>
            <el-button size="small" type="success" :icon="Operation" @click="openDecision">
              进入维修决策
            </el-button>
          </div>
        </div>

        <!-- 在制故障 -->
        <el-card class="mt-3 dark:bg-neutral-800" shadow="never" v-if="(data?.faults?.length||0)>0">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">在制故障</div>
            <el-tag size="small" effect="plain">SLA 跟踪</el-tag>
          </div>
          <el-table :data="data?.faults" size="small" class="!bg-transparent">
            <el-table-column prop="code" label="故障编码" width="140"/>
            <el-table-column prop="status" label="状态" width="100"/>
            <el-table-column prop="owner" label="负责人" width="120"/>
            <el-table-column label="SLA 截止" width="160">
              <template #default="{row}">{{ row.sla_deadline?.replace('T',' ').slice(0,19) || '—' }}</template>
            </el-table-column>
            <el-table-column prop="summary" label="摘要" min-width="240" show-overflow-tooltip/>
          </el-table>
        </el-card>

        <!-- 抽屉/对话框 -->
        <el-drawer v-model="drawerAlarm" title="装置告警中心" size="60%">
          <div class="mb-3 text-sm opacity-70">聚焦当前装置未结告警，支持确认/升级为故障/忽略</div>
          <el-table :data="data?.alarmCenter || []" size="small">
            <el-table-column prop="device_name" label="设备" width="160"/>
            <el-table-column prop="type" label="告警类型" width="160"/>
            <el-table-column prop="severity" label="等级" width="100"/>
            <el-table-column label="时间" width="180">
              <template #default="{row}">{{ row.time?.replace('T',' ').slice(0,19) || '—' }}</template>
            </el-table-column>
            <el-table-column prop="desc" label="描述" min-width="240" show-overflow-tooltip/>
            <el-table-column label="操作" width="220">
              <template #default="{row}">
                <el-button size="small" type="primary">确认</el-button>
                <el-button size="small" type="warning">升级为故障</el-button>
                <el-button size="small" type="info" plain>忽略</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-drawer>

        <el-dialog v-model="dialogBatchDiag" title="批量诊断" width="520px">
          <div class="text-sm mb-3">将对已选择的 {{ selection.length }} 台设备发起诊断任务。</div>
          <el-input type="textarea" rows="3" placeholder="可选：任务备注…" />
          <template #footer>
            <el-button @click="dialogBatchDiag=false">取消</el-button>
            <el-button type="primary" @click="dialogBatchDiag=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogBatchForecast" title="批量趋势预测" width="520px">
          <div class="text-sm mb-3">将对已选择的 {{ selection.length }} 台设备发起 RUL/健康趋势预测。</div>
          <el-select size="small" class="w-40" placeholder="预测窗口">
            <el-option label="7天" value="7"/>
            <el-option label="30天" value="30"/>
            <el-option label="90天" value="90"/>
          </el-select>
          <template #footer>
            <el-button @click="dialogBatchForecast=false">取消</el-button>
            <el-button type="primary" @click="dialogBatchForecast=false">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="dialogDecision" title="维修决策" width="720px">
          <div class="text-sm mb-3 opacity-80">将装置 KPI（诊断/告警/健康聚合）作为上下文，进入维修计划编制。</div>
          <el-form label-width="110px">
            <el-form-item label="优先级"><el-select class="w-40" placeholder="选择"><el-option label="高" value="H"/><el-option label="中" value="M"/><el-option label="低" value="L"/></el-select></el-form-item>
            <el-form-item label="计划窗口"><el-date-picker type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束"/></el-form-item>
            <el-form-item label="说明"><el-input type="textarea" rows="3" placeholder="处置思路、备件、停机影响等"/></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogDecision=false">取消</el-button>
            <el-button type="success" @click="dialogDecision=false">生成决策草案</el-button>
          </template>
        </el-dialog>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
/* 与 Base 页一致的信息密度 */
:deep(.el-card__body){ padding: 12px; }
</style>
