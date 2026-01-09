<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="logo-area">
        <el-icon :size="24" color="#00A8FF"><DataAnalysis /></el-icon>
        <span style="margin-left: 10px">BridgeGuard</span>
      </div>

      <nav class="nav-links desktop-only">
        <a class="nav-item active">首页大屏</a>
        <a class="nav-item">设备管理</a>
        <a class="nav-item">数据报表</a>
        <a class="nav-item">预警中心</a>
      </nav>

      <div class="header-actions">
        <el-tag :type="socketConnected ? 'success' : 'danger'" effect="dark" size="small" round class="desktop-only">
          <el-icon><component :is="socketConnected ? 'Link' : 'CircleClose'" /></el-icon>
          {{ socketConnected ? 'WS连' : '断' }}
        </el-tag>
        <div class="icon-btn">
          <el-badge :value="alertList.length" :max="99" class="item">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
        </div>
        <div class="icon-btn desktop-only">
          <el-icon :size="20"><User /></el-icon>
        </div>
      </div>
    </header>

    <main class="main-grid">

      <section class="kpi-section">
        <div class="kpi-card">
          <div class="kpi-title">监测点在线率</div>
          <div><span class="kpi-value">98.5</span><span class="kpi-unit">%</span></div>
          <div class="kpi-sub success">
            <el-icon><Top /></el-icon> 197/200 在线
          </div>
        </div>
        <div class="kpi-card alert">
          <div class="kpi-title">一级预警</div>
          <div><span class="kpi-value danger-text">3</span><span class="kpi-unit">起</span></div>
          <div class="kpi-sub danger-text">需立即处置</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">冲刷深度</div>
          <div><span class="kpi-value">2,450</span><span class="kpi-unit">mm</span></div>
          <div class="kpi-sub normal-text">同比 +12mm</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-title">消息吞吐</div>
          <div><span class="kpi-value warning-text">{{ msgCount }}</span><span class="kpi-unit">条</span></div>
          <div class="kpi-sub normal-text">接收中</div>
        </div>
      </section>

      <section class="monitor-section">
        <div class="section-header">
          <div class="title-group">
            <el-icon color="#00A8FF" :size="20"><VideoCamera /></el-icon>
            <h3>实时监控</h3>
          </div>
          <div class="controls">
            <span class="time-display desktop-only">{{ currentTime }}</span>
            <el-select v-model="currentCamera" size="small" class="cam-select" effect="dark">
              <el-option label="3号桥墩" value="cam1" />
              <el-option label="1号桥墩" value="cam2" />
            </el-select>
          </div>
        </div>

        <div class="split-view">
          <div class="video-container" id="video-container-ref">
            <div id="ez-player-target" class="video-layer"></div>
            <div class="video-overlay">
              <div class="rec-tag"><span class="pulse-dot"></span> LIVE</div>
              <div class="cam-name">CAM_03_PIER</div>
              <div class="water-line-marker" style="top: 40%">
                <span>水位: 12.5m</span>
              </div>
            </div>
            <div v-if="!playerInstance" class="video-placeholder">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
              <p>连接中...</p>
            </div>
          </div>

          <div class="chart-wrapper">
            <div ref="chartRef" class="chart-dom"></div>
          </div>
        </div>
      </section>

      <section class="sidebar-section">
        <div class="map-card">
          <h4>GIS 分布</h4>
          <div class="map-grid-bg"></div>
          <div class="map-point" style="top:40%; left:50%" title="正常"></div>
          <div class="map-point alert" style="top:45%; left:55%" title="报警"></div>
        </div>

        <div class="alert-list-card">
          <div class="card-header">
            <h4>通信日志</h4>
            <el-button type="primary" link size="small" @click="clearLogs">清空</el-button>
          </div>

          <div class="log-container" ref="logContainerRef">
            <div v-for="(log, index) in alertList" :key="index" :class="['alert-item', getLogClass(log.type)]">
              <div class="alert-info">
                <h4 :class="getLogColor(log.type)">{{ log.type }}</h4>
                <div class="alert-content">{{ log.content }}</div>
                <div class="alert-time">{{ log.time }}</div>
              </div>
              <el-tag size="small" :type="getTagType(log.type)" effect="dark">
                {{ log.type === 'RAW' ? 'D' : log.type[0] }}
              </el-tag>
            </div>
            <div v-if="alertList.length === 0" class="empty-state">
              <span>等待数据...</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <nav class="mobile-bottom-nav">
      <div class="mobile-nav-item active">
        <el-icon :size="20"><DataAnalysis /></el-icon>
        <span>监控</span>
      </div>
      <div class="mobile-nav-item">
        <el-icon :size="20"><VideoCamera /></el-icon>
        <span>视频</span>
      </div>
      <div class="mobile-nav-item">
        <el-icon :size="20"><Bell /></el-icon>
        <span>预警</span>
      </div>
      <div class="mobile-nav-item">
        <el-icon :size="20"><User /></el-icon>
        <span>我的</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, shallowRef } from 'vue';
import * as echarts from 'echarts';
import EZUIKit from 'ezuikit-js';
import {
  DataAnalysis, Bell, User, Link, CircleClose, Top,
  VideoCamera, Loading
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- 配置常量 ---
const EZ_ACCESS_TOKEN = 'at.ahc7oy27dky94otg69ycu9o527u0r25s-1sfjb890af-07h35ut-dsukqz9k1';
const EZ_VIDEO_URL = 'ezopen://open.ys7.com/G02145391/1.hd.live';
const WS_SID = '1001';

// --- 状态数据 ---
const socketConnected = ref(false);
const alertList = ref([]);
const msgCount = ref(0);
const currentCamera = ref('cam1');
const currentTime = ref('');
const chartRef = ref(null);
const logContainerRef = ref(null);

let playerInstance = null;
let chartInstance = null;
let socket = null;
let reconnectTimer = null;
let timeInterval = null;

// =======================
// 1. WebSocket 逻辑
// =======================
const initWebSocket = () => {
  const baseUrl = import.meta.env?.VITE_APP_BASE_API || 'http://localhost:8080';
  let wsRoot = baseUrl.replace(/^http/, 'ws');
  const separator = wsRoot.endsWith('/') ? '' : '/';
  const wsUrl = `${wsRoot}${separator}websocket/${WS_SID}`;

  try {
    socket = new WebSocket(wsUrl);
    socket.onopen = () => { socketConnected.value = true; addLog({ type: 'SYSTEM', content: '服务连接成功' }); };
    socket.onmessage = (event) => { handleIncomingData(event.data); };
    socket.onerror = () => { socketConnected.value = false; addLog({ type: 'ERROR', content: '连接异常' }); };
    socket.onclose = () => { socketConnected.value = false; addLog({ type: 'SYSTEM', content: '连接已断开' }); startReconnect(); };
  } catch (e) {
    console.warn("WS Failed, Simulating");
    startSimulationData();
  }
};

const handleIncomingData = (data) => {
  msgCount.value++;
  let content = data;
  let type = 'RAW';
  try {
    const json = JSON.parse(data);
    if (json.payload) { content = json.payload; type = json.type || 'RAW'; }
    else { content = JSON.stringify(json); }
  } catch (e) {}
  addLog({ type, content });
};

const addLog = (logObj) => {
  alertList.value.unshift({ time: new Date().toLocaleTimeString(), ...logObj });
  if (alertList.value.length > 50) alertList.value.pop();
};

const startReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; initWebSocket(); }, 5000);
};

const startSimulationData = () => {
  setInterval(() => {
    const types = ['INFO', 'RAW', 'WARN', 'ERROR'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const msgs = ['传感器 T-903 上报: 2450mm', '心跳正常', '波形异常', '丢帧警告'];
    handleIncomingData(JSON.stringify({ type: randomType, payload: msgs[Math.floor(Math.random() * msgs.length)] }));
  }, 3000);
  socketConnected.value = true;
};

// =======================
// 2. 视频逻辑
// =======================
const initVideoPlayer = () => {
  const container = document.getElementById('ez-player-target');
  const wrapper = document.getElementById('video-container-ref');
  if (!container || !wrapper) return;
  const { clientWidth, clientHeight } = wrapper;
  try {
    playerInstance = new EZUIKit.EZUIKitPlayer({
      id: 'ez-player-target',
      autoplay: true,
      url: EZ_VIDEO_URL,
      accessToken: EZ_ACCESS_TOKEN,
      width: clientWidth,
      height: clientHeight,
      template: 'simple',
    });
  } catch (e) { console.error(e); }
};

// =======================
// 3. 图表逻辑
// =======================
const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value, 'dark');
  let data = [];
  let now = new Date();
  let value = 2400;
  for (let i = 0; i < 60; i++) {
    data.push({ name: now.toString(), value: [[now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/') + ' ' + [now.getHours(), now.getMinutes(), now.getSeconds()].join(':'), Math.round(value)] });
    now = new Date(+now - 1000);
    value += Math.random() * 20 - 10;
  }
  data.reverse();

  const option = {
    backgroundColor: 'transparent',
    title: { text: '冲刷深度 (1H)', textStyle: { fontSize: 12, color: '#A4B0BE' }, left: 5, top: 5 },
    tooltip: { trigger: 'axis' },
    grid: { top: 40, left: 40, right: 10, bottom: 25 },
    xAxis: { type: 'time', splitLine: { show: false }, axisLabel: { color: '#A4B0BE', fontSize: 10 } },
    yAxis: { type: 'value', min: 2000, max: 4000, splitLine: { lineStyle: { type: 'dashed', color: '#333' } }, axisLabel: { color: '#A4B0BE', fontSize: 10 } },
    series: [{
      name: '深度', type: 'line', showSymbol: false, data: data,
      lineStyle: { color: '#00E5FF', width: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0, 229, 255, 0.5)' }, { offset: 1, color: 'rgba(0, 229, 255, 0.0)' }]) }
    }]
  };
  chartInstance.setOption(option);

  setInterval(() => {
    let now = new Date();
    let lastVal = data[data.length - 1].value[1];
    let newVal = lastVal + (Math.random() * 40 - 15);
    if(newVal > 3800) newVal = 3800;
    if(newVal < 2000) newVal = 2000;
    data.shift();
    data.push({ name: now.toString(), value: [[now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/') + ' ' + [now.getHours(), now.getMinutes(), now.getSeconds()].join(':'), Math.round(newVal)] });
    chartInstance.setOption({ series: [{ data: data }] });
  }, 2000);
};

// =======================
// 辅助函数
// =======================
const getLogClass = (type) => (type === 'ERROR' ? 'level-1' : type === 'WARN' ? 'level-2' : '');
const getLogColor = (type) => (type === 'ERROR' ? 'color-danger' : type === 'WARN' ? 'color-warning' : 'color-info');
const getTagType = (type) => ({ 'RAW': 'info', 'INFO': '', 'ERROR': 'danger', 'WARN': 'warning', 'SYSTEM': 'success' }[type] || 'info');
const clearLogs = () => { alertList.value = []; msgCount.value = 0; };

// =======================
// 生命周期
// =======================
onMounted(() => {
  timeInterval = setInterval(() => { currentTime.value = new Date().toLocaleTimeString(); }, 1000);
  initChart();
  initWebSocket();
  setTimeout(() => { initVideoPlayer(); }, 500);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
  if (socket) socket.close();
  if (playerInstance && playerInstance.stop) playerInstance.stop();
  if (chartInstance) chartInstance.dispose();
  window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
  if (chartInstance) chartInstance.resize();
};
</script>

<style scoped>
/* ================= CSS 变量与基础 ================= */
.dashboard-container {
  /* PC端默认：强制全屏 */
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 9999;
  background-color: #1A1C24;
  color: #FFFFFF;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  --card-bg: #232732;
  --header-bg: #15171e;
  --primary-blue: #00A8FF;
  --accent-cyan: #00E5FF;
  --alert-red: #FF4757;
  --warning-orange: #FF9F43;
  --text-sub: #A4B0BE;
  --border-color: #2C3E50;
}

/* Header */
.header {
  height: 60px;
  flex-shrink: 0;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between; padding: 0 20px;
}
.logo-area { display: flex; align-items: center; font-weight: bold; font-size: 1.2rem; }
.nav-links { display: flex; gap: 30px; }
.nav-item { color: var(--text-sub); cursor: pointer; font-size: 0.95rem; }
.nav-item.active { color: var(--accent-cyan); }
.header-actions { display: flex; gap: 20px; align-items: center; }

/* Main Grid (PC) */
.main-grid {
  flex: 1; height: 0; padding: 20px;
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
}

/* KPI (PC) */
.kpi-section {
  grid-column: 1 / -1;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; height: 110px; flex-shrink: 0;
}
.kpi-card {
  background-color: var(--card-bg); border-radius: 8px; padding: 15px 20px;
  display: flex; flex-direction: column; justify-content: center;
  border-left: 4px solid var(--primary-blue);
}
.kpi-card.alert { border-color: var(--alert-red); }
.kpi-card.warning { border-color: var(--warning-orange); }
.kpi-title { font-size: 0.85rem; color: var(--text-sub); margin-bottom: 5px; }
.kpi-value { font-size: 1.8rem; font-weight: bold; font-family: monospace; }
.kpi-unit { font-size: 0.9rem; margin-left: 5px; color: var(--text-sub); }
.kpi-sub { font-size: 0.8rem; margin-top: 5px; display: flex; align-items: center; gap: 5px; }

/* Monitor Section (PC) */
.monitor-section {
  grid-column: 1; grid-row: 2;
  background-color: var(--card-bg); border-radius: 8px; padding: 20px;
  display: flex; flex-direction: column; gap: 15px; min-height: 0; overflow: hidden;
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.title-group { display: flex; align-items: center; gap: 10px; }
.controls { display: flex; align-items: center; gap: 15px; }
.time-display { font-family: monospace; font-size: 1.1rem; font-weight: bold; color: var(--primary-blue); }
.split-view { flex: 1; display: flex; gap: 20px; min-height: 0; }
.video-container { flex: 1; background-color: #000; position: relative; border-radius: 4px; overflow: hidden; }
.chart-wrapper { flex: 1; background: rgba(255,255,255,0.02); border-radius: 4px; position: relative; }
.video-layer, .chart-dom { width: 100%; height: 100%; }
.video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.rec-tag { position: absolute; top: 15px; left: 15px; background: rgba(255, 0, 0, 0.8); padding: 2px 8px; border-radius: 2px; font-size: 0.7rem; color: white; display: flex; align-items: center; gap: 5px; }
.pulse-dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1s infinite; }
.cam-name { position: absolute; top: 40px; left: 15px; font-size: 0.8rem; color: rgba(255,255,255,0.7); text-shadow: 1px 1px 2px black; }
.water-line-marker { position: absolute; width: 100%; border-top: 1px dashed var(--primary-blue); color: var(--primary-blue); font-size: 0.8rem; text-align: right; }
.water-line-marker span { background: rgba(0,0,0,0.6); padding: 2px 5px; }
.video-placeholder { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; gap: 10px; }

/* Sidebar Section (PC) */
.sidebar-section {
  grid-column: 2; grid-row: 2;
  display: flex; flex-direction: column; gap: 20px; height: 100%; min-height: 0; overflow: hidden;
}
.map-card { height: 200px; flex-shrink: 0; background-color: var(--card-bg); border-radius: 8px; padding: 15px; position: relative; }
.map-grid-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(#2c3e50 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5; }
.map-point { position: absolute; width: 12px; height: 12px; background-color: var(--primary-blue); border-radius: 50%; box-shadow: 0 0 10px var(--primary-blue); cursor: pointer; }
.map-point.alert { background-color: var(--alert-red); box-shadow: 0 0 15px var(--alert-red); animation: pulse 1s infinite; }
.alert-list-card { flex: 1; display: flex; flex-direction: column; background-color: var(--card-bg); border-radius: 8px; padding: 15px; min-height: 0; overflow: hidden; }
.card-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.log-container { flex: 1; overflow-y: auto; padding-right: 5px; }
.alert-item { background: rgba(255,255,255,0.03); margin-bottom: 8px; padding: 10px; border-radius: 4px; border-left: 3px solid #666; display: flex; justify-content: space-between; align-items: flex-start; }
.alert-item.level-1 { border-left-color: var(--alert-red); background: rgba(255, 71, 87, 0.1); }
.alert-item.level-2 { border-left-color: var(--warning-orange); }
.alert-info { flex: 1; font-size: 0.85rem; }
.alert-info h4 { margin: 0 0 4px 0; font-size: 0.9rem; }
.alert-content { color: #ccc; margin-bottom: 4px; word-break: break-all; }
.alert-time { font-size: 0.75rem; color: #666; font-family: monospace; }
.color-danger { color: var(--alert-red); }
.color-warning { color: var(--warning-orange); }
.color-info { color: var(--primary-blue); }
.success { color: #2ed573; }
.danger-text { color: var(--alert-red); }
.warning-text { color: var(--warning-orange); }
.normal-text { color: var(--text-sub); }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
::-webkit-scrollbar-track { background: transparent; }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

/* 移动端导航默认隐藏 */
.mobile-bottom-nav { display: none; }

/* =================================================================
   ★★★ 移动端适配 (Max Width: 768px) ★★★
================================================================= */
@media (max-width: 768px) {
  .desktop-only { display: none !important; }

  /* 1. 全局容器：允许滚动，高度自动 */
  .dashboard-container {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding-bottom: 70px; /* 留出底部导航位置 */
  }

  /* 2. 主网格：转为 Flex 列式布局 */
  .main-grid {
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 15px;
    padding: 10px;
  }

  /* 3. KPI：2列布局 */
  .kpi-section {
    grid-template-columns: repeat(2, 1fr);
    height: auto;
  }
  .kpi-card { padding: 10px; }
  .kpi-value { font-size: 1.5rem; }

  /* 4. 监控区：上下排列 */
  .monitor-section {
    padding: 10px;
    overflow: visible; /* 允许内部元素撑开 */
  }
  .split-view {
    flex-direction: column; /* 视频在上，图表在下 */
    gap: 15px;
  }
  .video-container {
    height: 200px; /* 视频固定高度 */
    flex: none;
  }
  .chart-wrapper {
    height: 250px; /* 图表固定高度 */
    flex: none;
  }
  .cam-select { width: 140px !important; }

  /* 5. 侧边栏：放在最底部 */
  .sidebar-section {
    height: auto;
    gap: 15px;
  }
  .map-card { height: 180px; }
  .alert-list-card {
    height: 400px; /* 给日志一个固定高度 */
    flex: none;
  }

  /* 6. 显示底部导航栏 */
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; width: 100%; height: 60px;
    background-color: var(--card-bg);
    border-top: 1px solid var(--border-color);
    justify-content: space-around;
    align-items: center;
    z-index: 10000;
  }
  .mobile-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    color: var(--text-sub); font-size: 12px;
  }
  .mobile-nav-item.active { color: var(--primary-blue); }
}
</style>