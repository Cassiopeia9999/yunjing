<template>
  <div class="html-to-pdf-page">
    <div class="page-header">
      <h1>HTML 转 PDF</h1>
      <p class="subtitle">将 HTML 压缩包转换为 PDF 文件</p>
    </div>

    <div class="content-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".zip"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传包含 HTML 文件的 ZIP 压缩包，压缩包中应包含 index.html 作为入口文件
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 文件信息 -->
      <div v-if="selectedFile" class="file-info">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>已选择的文件</span>
            </div>
          </template>
          <div class="file-details">
            <p><strong>文件名：</strong>{{ selectedFile.name }}</p>
            <p><strong>文件大小：</strong>{{ formatFileSize(selectedFile.size) }}</p>
            <p><strong>文件类型：</strong>{{ selectedFile.type || 'application/zip' }}</p>
          </div>
        </el-card>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button
          type="primary"
          size="large"
          :disabled="!selectedFile || loading"
          :loading="loading"
          @click="handleConvert"
        >
          <el-icon><document /></el-icon>
          转换为 PDF
        </el-button>
        <el-button
          size="large"
          :disabled="!selectedFile || loading"
          @click="handleClear"
        >
          清除
        </el-button>
      </div>

      <!-- 状态提示 -->
      <div v-if="message" class="message-section">
        <el-alert
          :title="message"
          :type="messageType"
          :closable="false"
          show-icon
        />
      </div>

      <!-- 使用说明 -->
      <div class="instructions">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>使用说明</span>
            </div>
          </template>
          <div class="instruction-content">
            <h4>压缩包结构要求：</h4>
            <ul>
              <li>压缩包格式：ZIP 格式</li>
              <li>必须包含 <code>index.html</code> 作为入口文件</li>
              <li>index.html 中可以通过 <code>pages</code> 数组定义多个 HTML 文件的转换顺序</li>
              <li>所有引用的资源文件（CSS、图片等）应放在同一目录或子目录中</li>
            </ul>
            <h4>示例 index.html 结构：</h4>
            <pre><code>&lt;script&gt;
  var pages = [
    { file: "page1.html" },
    { file: "page2.html" },
    { file: "page3.html" }
  ];
&lt;/script&gt;</code></pre>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { convertHtmlToPdf, downloadPdf } from '@/api/html2pdf'

const selectedFile = ref(null)
const loading = ref(false)
const message = ref('')
const messageType = ref('info')

// 处理文件选择
const handleFileChange = (uploadFile) => {
  selectedFile.value = uploadFile.raw
  message.value = ''
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理转换
const handleConvert = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  loading.value = true
  message.value = '正在转换中，请稍候...'
  messageType.value = 'info'

  try {
    const response = await convertHtmlToPdf(selectedFile.value)
    downloadPdf(response.data, 'output.pdf')
    message.value = '转换成功！PDF 文件已下载'
    messageType.value = 'success'
    ElMessage.success('转换成功！')
  } catch (error) {
    console.error('转换失败:', error)
    message.value = '转换失败：' + (error.response?.data?.error || error.message || '未知错误')
    messageType.value = 'error'
    ElMessage.error('转换失败')
  } finally {
    loading.value = false
  }
}

// 清除选择
const handleClear = () => {
  selectedFile.value = null
  message.value = ''
}
</script>

<style scoped>
.html-to-pdf-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.el-icon--upload {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 10px;
}

.file-info {
  background: #fff;
  border-radius: 8px;
}

.file-details p {
  margin: 8px 0;
  color: #606266;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px 0;
}

.message-section {
  margin-top: 10px;
}

.instructions {
  background: #fff;
  border-radius: 8px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.instruction-content {
  color: #606266;
}

.instruction-content h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #303133;
}

.instruction-content ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

.instruction-content li {
  margin: 5px 0;
}

.instruction-content code {
  background-color: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #409eff;
}

.instruction-content pre {
  background-color: #f4f4f5;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
}

.instruction-content pre code {
  background-color: transparent;
  padding: 0;
  color: #606266;
}
</style>
