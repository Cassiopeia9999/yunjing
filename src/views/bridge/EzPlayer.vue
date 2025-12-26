<template>
  <div class="monitor-container">

    <div id="bridge-video-player" class="video-layer"></div>

    <div class="ui-layer">

      <div class="hud-header">
        <div class="left-section">
          <div class="live-indicator">
            <span class="pulse-dot"></span> LIVE
          </div>
          <div class="title-group">
            <h1 class="project-name">G02145391 长江大桥-主跨监测点</h1>
            <span class="sub-info">设备ID: CAM-N-003 | 信号强度: Strong</span>
          </div>
        </div>

        <div class="right-section">
          <div class="weather-box">
            <el-icon><Sunny /></el-icon>
            <span style="margin-left: 5px;">26°C 晴</span>
            <span class="divider">|</span>
            <span>能见度 > 5km</span>
          </div>
          <div class="time-box">{{ currentTime }}</div>
        </div>
      </div>

      <div class="hud-panel left-panel">
        <div class="panel-title">实时监测数据</div>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">瞬时风速</span>
            <span class="value warning">12.5 <small>m/s</small></span>
          </div>
          <div class="data-item">
            <span class="label">主梁震动</span>
            <span class="value">0.03 <small>g</small></span>
          </div>
          <div class="data-item">
            <span class="label">车流量</span>
            <span class="value">1,204 <small>辆/h</small></span>
          </div>
        </div>
      </div>

      <div class="hud-footer">
        <div class="event-ticker">
          <el-icon><BellFilled /></el-icon>
          <span style="margin-left: 8px;">[10:42:05] 监测到风速超阈值预警</span>
        </div>
        <div class="controls">
          <el-button type="primary" size="small" round>截图</el-button>
          <el-button type="success" size="small" round>回放</el-button>
          <el-button type="danger" size="small" round>全屏</el-button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import EZUIKit from 'ezuikit-js'; // 引入真实播放器库

// --- 手动引入 Element Plus 组件 ---
import { ElButton, ElIcon } from 'element-plus';
import 'element-plus/dist/index.css';
import { Sunny, BellFilled } from '@element-plus/icons-vue';

// --- 配置区域 ---
const videoUrl = 'ezopen://open.ys7.com/G02145391/1.hd.live';
// ★★★ 请在这里填入你的真实 AccessToken ★★★
const accessToken = '你的_ACCESS_TOKEN_在这里';

// --- 状态管理 ---
const currentTime = ref('00:00:00');
let timer = null;
let playerInstance = null;

// --- 初始化播放器 ---
const initPlayer = () => {
  const container = document.getElementById('bridge-video-player');
  if (!container) return;

  // 获取容器的实时宽高
  const { clientWidth, clientHeight } = container;
  console.log(`正在初始化播放器: ${clientWidth}x${clientHeight}`);

  try {
    playerInstance = new EZUIKit.EZUIKitPlayer({
      id: 'bridge-video-player', // 对应 template 中的 ID
      autoplay: true,
      url: videoUrl,
      accessToken: accessToken,
      width: clientWidth,
      height: clientHeight,
      template: 'simple', // 使用无控制条模式，因为我们自己画了 UI
    });
  } catch (e) {
    console.error("播放器初始化失败:", e);
  }
};

// --- 生命周期 ---
onMounted(() => {
  // 1. 启动时钟
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString();
  }, 1000);

  // 2. 初始化播放器 (延迟 200ms 确保 DOM 已经渲染完毕)
  setTimeout(() => {
    initPlayer();
  }, 200);
});

onBeforeUnmount(() => {
  // 清理工作
  if (timer) clearInterval(timer);
  if (playerInstance) {
    try {
      // 停止播放 (依赖 SDK 版本，有的版本可能是 stopPlay)
      if (playerInstance.stop) playerInstance.stop();
    } catch(e) { console.log(e); }
    playerInstance = null;
  }
});
</script>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000;
}
</style>

<style scoped>
.monitor-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* --- 真实视频层 --- */
.video-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* 在最底层 */
  background: #000; /* 加载前的背景色 */
}

/* --- UI 层 (保持不变) --- */
.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10; /* 在视频之上 */
  pointer-events: none; /* 关键：允许鼠标穿透点击下面的视频 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
/* 恢复按钮的可点击性 */
.ui-layer > * { pointer-events: auto; }

/* 顶部 HUD */
.hud-header {
  height: 60px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 20px; color: #fff;
}
.left-section { display: flex; align-items: center; gap: 15px; }
.live-indicator {
  background: #f56c6c; padding: 2px 8px; border-radius: 4px;
  font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 5px;
}
.pulse-dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.5s infinite; }
.project-name { font-size: 18px; font-weight: bold; margin: 0; text-shadow: 1px 1px 2px black; }
.sub-info { font-size: 12px; color: #ddd; }
.right-section { display: flex; align-items: center; gap: 20px; text-shadow: 1px 1px 2px black; }
.weather-box { display: flex; align-items: center; }
.time-box { font-size: 20px; font-family: monospace; font-weight: bold; }
.divider { margin: 0 10px; opacity: 0.5; }

/* 左侧面板 */
.hud-panel {
  position: absolute; left: 20px; top: 80px; width: 220px;
  background: rgba(0, 20, 40, 0.6); backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 15px; color: #fff;
}
.panel-title { color: #409EFF; font-weight: bold; margin-bottom: 10px; font-size: 14px; border-left: 3px solid #409EFF; padding-left: 8px; }
.data-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; }
.value { font-weight: bold; font-size: 16px; font-family: monospace; }
.value.warning { color: #E6A23C; }

/* 底部栏 */
.hud-footer {
  height: 50px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  display: flex; justify-content: space-between; align-items: center; padding: 0 20px; color: #fff;
}
.event-ticker { color: #E6A23C; font-size: 14px; display: flex; align-items: center; }
.controls { display: flex; gap: 10px; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
</style>