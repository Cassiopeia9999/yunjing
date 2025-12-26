<template>
  <div class="monitor-layout">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left">
            <el-icon :class="['status-icon', connected ? 'is-online' : 'is-offline']">
              <Monitor />
            </el-icon>
            <span class="title">无线协议实时监控</span>
            <el-tag :type="connected ? 'success' : 'danger'" size="small" round>
              {{ connected ? '已连接' : '断开' }}
            </el-tag>
          </div>
          <div class="right">
            <span class="ws-url">{{ wsUrl }}</span>
            <el-divider direction="vertical" />
            <el-button-group>
              <el-button type="primary" :icon="Refresh" size="small" @click="manualReconnect" :disabled="connected">
                重连
              </el-button>
              <el-button type="warning" :icon="Delete" size="small" @click="clearLogs">
                清空日志
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div class="terminal" ref="logContainer">
        <div v-for="(log, index) in messageList" :key="index" class="log-line">
          <span class="log-time">{{ log.time }}</span>
          <el-tag :type="getTagType(log.type)" size="mini" class="log-tag" effect="plain">
            {{ log.type }}
          </el-tag>
          <span class="log-content">{{ log.content }}</span>
        </div>

        <el-empty v-if="messageList.length === 0" description="等待数据推送中..." :image-size="100">
          <template #image>
            <el-icon v-if="connected" class="is-loading" :size="40"><Loading /></el-icon>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Monitor, Refresh, Delete, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- 响应式数据 ---
const connected = ref(false);
const messageList = ref([]);
const logContainer = ref(null);
const wsUrl = ref('');
const sid = `1001`;

let socket = null;
let reconnectTimer = null;

// --- 工具函数 ---
const getTagType = (type) => {
  const map = { 'RAW': '', 'INFO': 'info', 'ERROR': 'danger', 'SYSTEM': 'warning' };
  return map[type] || 'info';
};

const initWebSocket = () => {
  // 1. 获取 .env 中配置的基础地址 (优先使用低代码基础 URL)
  const baseUrl = import.meta.env.VITE_LOWCODE_BASE_URL || import.meta.env.VITE_APP_BASE_API;

  // 2. 协议转换：将 https:// 替换为 wss://，http:// 替换为 ws://
  // replace(/^http/, 'ws') 会处理 http->ws 和 https->wss
  let wsRoot = baseUrl.replace(/^http/, 'ws');

  // 3. 拼接路径 (自动处理末尾斜杠)
  const separator = wsRoot.endsWith('/') ? '' : '/';
  wsUrl.value = `${wsRoot}${separator}websocket/${sid}`;

  console.log("WebSocket 目标地址:", wsUrl.value);

  try {
    socket = new WebSocket(wsUrl.value);


    socket.onopen = () => {
      connected.value = true;
      ElMessage.success('WebSocket 已连接');
      addLog({ type: 'SYSTEM', content: '与服务器建立连接成功' });
    };

    socket.onmessage = (event) => {
      handleIncomingData(event.data);
    };

    socket.onerror = (err) => {
      connected.value = false;
      addLog({ type: 'ERROR', content: '连接发生错误，准备重连...' });
    };

    socket.onclose = () => {
      connected.value = false;
      addLog({ type: 'SYSTEM', content: '连接已关闭' });
      startReconnect();
    };
  } catch (error) {
    console.error('WebSocket 初始化失败', error);
    startReconnect();
  }
};

const handleIncomingData = (data) => {
  let displayContent = data;
  let type = 'RAW';

  try {
    const json = JSON.parse(data);
    // 兼容后端封装的 Map 结构
    if (json.payload) {
      displayContent = json.payload;
      type = json.type || 'RAW';
    } else {
      displayContent = JSON.stringify(json, null, 2);
    }
  } catch (e) {
    // 纯文本数据
  }

  addLog({ type, content: displayContent });
};

const addLog = (logObj) => {
  messageList.value.push({
    time: new Date().toLocaleTimeString(),
    ...logObj
  });

  // 限制日志长度
  if (messageList.value.length > 500) messageList.value.shift();

  // 自动滚动
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const startReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!connected.value) initWebSocket();
  }, 5000);
};

const manualReconnect = () => {
  if (socket) socket.close();
  initWebSocket();
};

const clearLogs = () => {
  messageList.value = [];
};

// --- 生命周期 ---
onMounted(() => {
  initWebSocket();
});

onUnmounted(() => {
  if (socket) socket.close();
  if (reconnectTimer) clearTimeout(reconnectTimer);
});
</script>

<style scoped>
.monitor-layout {
  padding: 20px;
  height: calc(100vh - 40px);
  background-color: #f5f7fa;
}

.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon.is-online { color: #67c23a; }
.status-icon.is-offline { color: #f56c6c; }

.ws-url {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  margin-right: 10px;
}

/* 终端样式 */
.terminal {
  height: 100%;
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  overflow-y: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.log-line {
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid #2d2d2d;
  padding-bottom: 4px;
}

.log-time {
  color: #888;
  min-width: 85px;
}

.log-tag {
  margin: 0 10px;
  height: 18px;
  line-height: 16px;
  padding: 0 4px;
}

.log-content {
  color: #b5cea8;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 滚动条美化 */
.terminal::-webkit-scrollbar {
  width: 8px;
}
.terminal::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
.terminal::-webkit-scrollbar-track {
  background: #1e1e1e;
}
</style>