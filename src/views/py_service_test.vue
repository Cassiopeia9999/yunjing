<template>
  <div class="p-4 space-y-4">
    <div v-for="service in serviceList" :key="service.name_code" class="border p-4 rounded shadow-sm bg-white">
      <div class="grid grid-cols-12 gap-4 items-start p-4 border rounded-md bg-white">
        <!-- 左：服务描述与参数列表 -->
        <div class="col-span-3 text-left space-y-2">
          <div class="font-bold text-blue-700">{{ service.name }} ({{ service.name_code }})</div>
          <div class="text-sm text-gray-600">{{ service.service_des }}</div>
          <div v-if="service.params?.length" class="text-sm text-gray-700 mt-2">
            <div v-for="param in service.params" :key="param.param_name" class="pl-1">
              <div>
                <span class="font-semibold text-gray-800">{{ param.param_name }}</span>
                <span class="text-gray-500">({{ param.param_type }})</span>：
                <span class="text-gray-500">{{ param.param_desc }}</span>
                <span v-if="param.param_default != null" class="text-gray-400 ml-1">[默认: {{ param.param_default }}]</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中：JSON 输入 -->
        <div class="col-span-4">
          <VueJsonPretty
              v-model:data="service.input"
              class="vue-json-pretty rounded border bg-white text-gray-800 text-sm min-h-[150px]"
          />
        </div>

        <!-- 中右：按钮与状态 -->
        <div class="col-span-1 flex flex-col items-center justify-start space-y-2 w-full">
          <el-button type="primary" size="large" class="w-full min-h-[32px]" @click="invokeService(service)">调用</el-button>

          <div v-if="service.status !== null"
               class="text-sm mt-1"
               :class="service.status ? 'text-green-600' : 'text-red-600'">
            {{ service.status ? '成功' : '失败' }}
          </div>
          <el-button type="info" size="large" class="w-full min-h-[32px]" @click="openParamDialog(service)">修改参数</el-button>

        </div>

        <!-- 右：输出 -->
        <div class="col-span-4">
          <VueJsonPretty
              :data="service.result"
              class="vue-json-pretty rounded border bg-white text-gray-800 text-sm min-h-[150px]"
          />
        </div>
      </div>

    </div>
    <!-- 🔍 参数编辑弹框 -->
    <el-dialog v-model="dialogVisible" title="编辑参数" width="600px">
      <el-table :data="editingService?.params" border>
        <el-table-column label="参数名" prop="param_name" width="160"/>
        <el-table-column label="参数值">
          <template #default="{ row }">
            <el-input
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 5 }"
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

// 每次打开弹窗时初始化 paramValues
function openParamDialog(service) {
  editingService.value = service
  dialogVisible.value = true

  paramValues.value = {}
  for (const key in service.input) {
    const val = service.input[key]
    if (typeof val === 'object') {
      try {
        paramValues.value[key] = JSON.stringify(val, null, 2)
      } catch {
        paramValues.value[key] = ''
      }
    } else {
      paramValues.value[key] = String(val ?? '')
    }
  }
}

// 当用户编辑时，尝试 parse JSON
function handleInputChange(key) {
  try {
    const raw = paramValues.value[key]
    editingService.value.input[key] = JSON.parse(raw)
  } catch {
    // 非法 JSON，暂不覆盖
  }
}

onMounted(async () => {
  await commonServiceClient.init()
  serviceList.value = []

  for (const [code, service] of commonServiceClient.serviceConfigMap.entries()) {
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
      result: null,
      success: null
    })
  }
})

async function invokeService(service) {
  try {
    const res = await commonServiceClient.invoke(service.name_code, service.input)
    service.result = res.data
    service.status = service.result.success
  } catch (e) {
    service.result = { error: e.message }
    service.status = false
  }
}
</script>

<style scoped>
.min-h-\[100px\] {
  min-height: 100px;
}
</style>
