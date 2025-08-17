<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { getDevicePageData } from '@/mock/deviceMock' // 下面提供
import { ArrowRight, WarningFilled, CircleCheck, Upload, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const deviceId = ref(route.params.deviceId || 101)
const days = ref(30)

const loading = ref(true)
const data = ref(null)

// 头部/基础
const dev = computed(()=> data.value?.device || {})
const parents = computed(()=> data.value?.parents || {})
const highProbText = computed(()=> `Pθ=${data.value?.meta?.highProbThreshold ?? 70}%`)

// 最新诊断快照
const snap = computed(()=> data.value?.snapshot || null)

// 诊断记录（时间线/表格）
const recordsRaw = computed(()=> data.value?.records || [])
const selectedRows = ref([])
const keyword = ref('')
const onlyHigh = ref(false)

const records = computed(()=>{
  let list = [...recordsRaw.value]
  if (keyword.value?.trim()){
    const k = keyword.value.trim().toLowerCase()
    list = list.filter(r =>
        (r.fault_name||'').toLowerCase().includes(k) ||
        (r.description||'').toLowerCase().includes(k)
    )
  }
  if (onlyHigh.value){
    const th = data.value?.meta?.highProbThreshold ?? 70
    list = list.filter(r => (r.probability ?? 0) >= th)
  }
  return list
})

// 规则提示
const tips = computed(()=> data.value?.riskTips || [])

// QA 禁用（关键特征质量）
const qa = computed(()=> data.value?.qa || { passed:true, block:false, msg:'' })
const actionsDisabled = computed(()=> qa.value?.block === true)

// 图表：可做“概率趋势/健康趋势”
const elProb = ref(null)
let ecProb
function renderCharts(){
  if (!elProb.value) return
  ecProb = echarts.init(elProb.value)
  const s = data.value?.charts?.probTrend || { dates:[], probs:[] }
  ecProb.setOption({
    tooltip:{trigger:'axis'},
    xAxis:{ type:'category', data:s.dates },
    yAxis:{ type:'value', min:0, max:100 },
    series:[{ type:'line', smooth:true, data:s.probs }]
  })
}

// 行操作
function markConfirmed(row){
  row.confirmed = true
  // 真实环境可调用 API；这里仅前端标注
}
function upgradeToFault(row){
  dialogUpgrade.value = { visible:true, record:row }
}
function viewBasis(row){
  drawerBasis.value = { visible:true, record:row }
}
function viewRaw(row){
  // 可跳转文件中心/下载页；这里用抽屉占位
  drawerRaw.value = { visible:true, record:row }
}
function exportSelected(){
  // 简易导出：把选中转成 CSV 下载（真实可走后端）
  const rows = selectedRows.value
  if (!rows.length) return
  const header = ['diagnosis_time','fault_name','probability','description']
  const csv = [header.join(',')].concat(
      rows.map(r => [r.diagnosis_time, `"${r.fault_name}"`, r.probability, `"${r.description||''}"`].join(','))
  ).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `diagnosis_${dev.value.component_code||deviceId.value}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// 选择变化
function onSelChange(rows){ selectedRows.value = rows || [] }

// 快捷操作
function goDiagnose(){
  if (actionsDisabled.value) return
  console.log('→ 跳诊断工作台', deviceId.value, days.value)
  // router.push({ name:'workbench', query:{ deviceId: deviceId.value, days: days.value } })
}
function goForecast(){
  if (actionsDisabled.value) return
  dialogForecast.value = true
}
function newOrLinkFault(){
  dialogNewFault.value = true
}

const drawerBasis = ref({ visible:false, record:null })
const drawerRaw   = ref({ visible:false, record:null })
const dialogForecast = ref(false)
const dialogNewFault = ref(false)
const dialogUpgrade = ref({ visible:false, record:null })

async function load(){
  loading.value = true
  data.value = await getDevicePageData(deviceId.value, { days: days.value })
  loading.value = false
  await nextTick(); renderCharts()
}
onMounted(load)
</script>

<template>
  <!-- 子页外层：服从框架，只内容滚动 -->
  <div class="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
    <!-- 头部区（固定） -->
    <div class="p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-700">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="text-xl font-semibold">{{ dev.device_name || '—' }}</div>
          <el-tag size="small" :type="(dev.status==='Fault'?'danger':dev.status==='Warning'?'warning':'success')">
            {{ dev.status || 'Unknown' }}
          </el-tag>
          <el-tag size="small" effect="plain">{{ dev.component_type || '—' }} · {{ dev.component_model || '—' }}</el-tag>
          <el-tag size="small" effect="plain">编号：{{ dev.component_code || '—' }}</el-tag>
          <el-tag size="small" effect="plain">厂家：{{ dev.manufacturer || '—' }}</el-tag>
          <el-tag size="small" effect="plain">安装：{{ dev.install_date || '—' }}</el-tag>
        </div>
        <div class="flex items-center gap-3">
          <el-segmented v-model="days" :options="[7,30]" size="small" @change="load"/>
          <el-tag size="small" effect="plain">{{ highProbText }}</el-tag>
          <el-tag size="small" effect="plain">装置：{{ parents.system_name || '—' }}</el-tag>
          <el-tag size="small" effect="plain">基地：{{ parents.site_name || '—' }}</el-tag>
          <ThemeToggle/>
        </div>
      </div>

      <!-- 健康与寿命（KPI 卡） -->
      <div class="grid grid-cols-5 gap-3">
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">健康度</div>
          <div class="text-2xl font-semibold">{{ dev.health_level ?? '—' }}</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">剩余寿命 RUL</div>
          <div class="text-2xl font-semibold">{{ dev.remaining_life ?? '—' }} 天</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">置信度</div>
          <div class="text-2xl font-semibold">{{ dev.confidence_level ?? '—' }}%</div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">最近诊断概率</div>
          <div class="text-2xl font-semibold">
            {{ snap?.probability != null ? (snap.probability + '%') : '—' }}
          </div>
        </el-card>
        <el-card shadow="never" class="dark:bg-neutral-800">
          <div class="text-xs opacity-60 mb-1">最近诊断时间</div>
          <div class="text-2xl font-semibold">
            {{ snap?.diagnosis_time ? snap.diagnosis_time.replace('T',' ').slice(0,19) : '—' }}
          </div>
        </el-card>
      </div>

      <!-- QA 拦截提示 -->
      <div v-if="qa?.block" class="mt-2 text-sm text-amber-500">
        关键特征质量未通过（{{ qa.msg }}），已禁用“开始诊断/趋势预测”。请先修复数据。
      </div>
    </div>

    <!-- 内容滚动区 -->
    <div class="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <el-skeleton :loading="loading" animated>
        <template #template><el-skeleton-item variant="rect" style="height:420px"/></template>

        <div class="grid grid-cols-12 gap-4 min-h-0">
          <!-- 左侧：最新诊断快照 + 风险提示 -->
          <div class="col-span-4 min-w-0 flex flex-col gap-3">
            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">最新诊断快照</div>
                <el-tag v-if="snap?.probability!=null" size="small"
                        :type="(snap.probability >= (data?.meta?.highProbThreshold||70)) ? 'danger':'info'">
                  {{ Math.round(snap.probability) }}%
                </el-tag>
              </div>
              <div class="text-sm mb-2">故障：{{ snap?.fault_name || '—' }}</div>
              <div class="text-xs opacity-80 mb-2">
                时间：{{ snap?.diagnosis_time ? snap.diagnosis_time.replace('T',' ').slice(0,19) : '—' }}
              </div>
              <div class="text-sm mb-2">
                依据（摘要）：<span class="opacity-80">{{ snap?.diagnosis_basis_short || '—' }}</span>
                <el-button v-if="snap" link size="small" @click="viewBasis(snap)">查看依据</el-button>
              </div>
              <div class="text-sm">
                原始文件：<span class="opacity-80">{{ snap?.raw_file_id || '—' }}</span>
                <el-button v-if="snap?.raw_file_id" link size="small" @click="viewRaw(snap)">查看源数据</el-button>
              </div>
            </el-card>

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">风险提示与建议</div>
                <el-tag size="small" effect="plain">规则提示</el-tag>
              </div>
              <ul class="space-y-2 text-sm">
                <li v-for="(t,i) in tips" :key="i" class="flex items-start gap-2">
                  <el-icon class="mt-[2px]"><WarningFilled/></el-icon>
                  <span v-html="t"></span>
                </li>
                <li v-if="!tips?.length" class="text-xs opacity-70">暂无提示</li>
              </ul>
            </el-card>

            <el-card shadow="never" class="dark:bg-neutral-800">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">概率趋势（{{ days }}天）</div>
              </div>
              <div ref="elProb" class="h-[220px]"></div>
            </el-card>
          </div>

          <!-- 右侧：诊断记录时间线/表格 -->
          <el-card class="col-span-8 min-w-0 dark:bg-neutral-800" shadow="never" body-style="padding:0">
            <div class="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div class="font-medium">诊断记录</div>
              <div class="flex items-center gap-2">
                <el-input v-model="keyword" size="small" placeholder="搜索故障/备注" clearable class="w-52"/>
                <el-checkbox v-model="onlyHigh" size="small">仅高概率</el-checkbox>
                <el-button size="small" :icon="Document" @click="exportSelected" :disabled="!selectedRows.length">
                  导出（已选 {{ selectedRows.length }}）
                </el-button>
              </div>
            </div>

            <div class="max-h-full">
              <el-table
                  :data="records"
                  size="small"
                  class="!bg-transparent"
                  :row-class-name="()=>'cursor-default'"
                  @selection-change="onSelChange"
                  :row-key="r=>r.id"
              >
                <el-table-column type="selection" width="40"/>
                <el-table-column label="时间" width="170">
                  <template #default="{row}">
                    {{ row.diagnosis_time.replace('T',' ').slice(0,19) }}
                  </template>
                </el-table-column>
                <el-table-column label="故障名称" min-width="180" show-overflow-tooltip prop="fault_name"/>
                <el-table-column label="概率" width="90">
                  <template #default="{row}">
                    <el-tag :type="row.probability >= (data?.meta?.highProbThreshold||70) ? 'danger':'info'" size="small">
                      {{ Math.round(row.probability) }}%
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="备注" min-width="200" show-overflow-tooltip prop="description"/>
                <el-table-column label="操作" width="280" align="center">
                  <template #default="{row}">
                    <el-button size="small" type="primary" plain @click="markConfirmed(row)" :disabled="row.confirmed">
                      {{ row.confirmed ? '已确认' : '标记已确认' }}
                    </el-button>
                    <el-button size="small" type="warning" @click="upgradeToFault(row)">
                      升级为故障
                    </el-button>
                    <el-button size="small" link type="primary" @click="viewBasis(row)">查看依据</el-button>
                    <el-button size="small" link type="primary" @click="viewRaw(row)">原始文件</el-button>
                  </template>
                </el-table-column>
                <el-table-column width="44" align="center">
                  <template #default><el-icon><ArrowRight/></el-icon></template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>

        <!-- 快捷操作 -->
        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="text-xs opacity-70">
            * 高概率阈值：{{ highProbText }}；每条诊断可作为故障证据挂载。
          </div>
          <div class="flex items-center gap-2">
            <el-button size="small" type="primary" :icon="CircleCheck" @click="goDiagnose" :disabled="actionsDisabled">
              开始故障诊断
            </el-button>
            <el-button size="small" type="primary" plain :icon="Upload" @click="goForecast" :disabled="actionsDisabled">
              趋势预测
            </el-button>
            <el-button size="small" type="success" @click="newOrLinkFault">
              新建故障 / 关联
            </el-button>
          </div>
        </div>

        <!-- 依据抽屉 -->
        <el-drawer v-model="drawerBasis.visible" title="诊断依据" size="50%">
          <div class="text-sm whitespace-pre-wrap">{{ drawerBasis.record?.diagnosis_basis || snap?.diagnosis_basis || '—' }}</div>
        </el-drawer>

        <!-- 原始文件抽屉（占位） -->
        <el-drawer v-model="drawerRaw.visible" title="原始文件" size="40%">
          <div class="text-sm">文件ID：{{ drawerRaw.record?.raw_file_id || snap?.raw_file_id }}</div>
          <el-button type="primary" class="mt-3" @click="$message.success('模拟打开/下载源数据')">打开源数据</el-button>
        </el-drawer>

        <!-- 升级为故障 -->
        <el-dialog v-model="dialogUpgrade.visible" title="升级为故障" width="640px">
          <div class="text-sm mb-3 opacity-80">将把所选诊断记录作为故障证据挂载。</div>
          <el-form label-width="110px">
            <el-form-item label="故障类型"><el-select class="w-52"><el-option label="机械" value="mech"/><el-option label="电气" value="elec"/><el-option label="工艺" value="proc"/></el-select></el-form-item>
            <el-form-item label="影响范围"><el-input class="w-80" placeholder="影响设备/产线/产品"/></el-form-item>
            <el-form-item label="负责人"><el-input class="w-52" placeholder="如：张工"/></el-form-item>
            <el-form-item label="说明"><el-input type="textarea" rows="3" placeholder="补充说明"/></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogUpgrade.visible=false">取消</el-button>
            <el-button type="warning" @click="dialogUpgrade.visible=false">确认升级</el-button>
          </template>
        </el-dialog>

        <!-- 趋势预测 -->
        <el-dialog v-model="dialogForecast" title="趋势预测" width="560px">
          <div class="text-sm mb-3">选择关键特征后进行预测（占位）。</div>
          <el-select class="w-60" placeholder="选择特征"><el-option label="振动RMS" value="v_rms"/><el-option label="温度" value="temp"/><el-option label="电流" value="curr"/></el-select>
          <template #footer>
            <el-button @click="dialogForecast=false">取消</el-button>
            <el-button type="primary" @click="dialogForecast=false">开始预测</el-button>
          </template>
        </el-dialog>

        <!-- 新建/关联故障 -->
        <el-dialog v-model="dialogNewFault" title="新建故障 / 关联" width="560px">
          <el-radio-group>
            <el-radio label="new">新建故障</el-radio>
            <el-radio label="link">关联现有故障</el-radio>
          </el-radio-group>
          <div class="mt-3">
            <el-input placeholder="可选：现有故障编码进行关联"/>
          </div>
          <template #footer>
            <el-button @click="dialogNewFault=false">取消</el-button>
            <el-button type="success" @click="dialogNewFault=false">提交</el-button>
          </template>
        </el-dialog>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card__body){ padding: 12px; }
</style>
