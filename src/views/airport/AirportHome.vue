<template>
  <div class="airport-home">
    <div class="welcome-section">
      <div class="text-content">
        <h1>机场道面智慧管养平台</h1>
        <p>Airport Pavement Intelligent Management System</p>
        <div class="weather-widget">
          <span>🌤️ 乌兰查布机场 | 24°C | 适宜巡检</span>
        </div>
      </div>
      <div class="hero-image">
        <div class="tech-circle"></div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="icon-box blue">🛣️</div>
        <div class="kpi-info">
          <span class="label">覆盖跑道面积</span>
          <span class="value">1,240,000 <small>m²</small></span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box orange">⚠️</div>
        <div class="kpi-info">
          <span class="label">待修复病害</span>
          <span class="value">12 <small>处</small></span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box green">✅</div>
        <div class="kpi-info">
          <span class="label">今日巡检完成率</span>
          <span class="value">98.5 <small>%</small></span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box purple">📊</div>
        <div class="kpi-info">
          <span class="label">道面健康指数</span>
          <span class="value">92 <small>分</small></span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="nav-grid">
        <div class="nav-card active-card" @click="navigateTo('gis')">
          <div class="card-bg"></div>
          <div class="card-content">
            <h3>GIS 数字孪生作业</h3>
            <p>基于 GeoJSON 的病害精准定位、图层管理与数据录入。</p>
            <button class="enter-btn">进入系统 &rarr;</button>
          </div>
        </div>

        <div class="nav-card" @click="navigateTo('monitor')">
          <div class="card-bg monitor-bg"></div>
          <div class="card-content">
            <h3>实时监控大屏</h3>
            <p>全屏展示巡检机器人轨迹、实时视频回传与全局态势。</p>
            <button class="enter-btn">查看大屏 &rarr;</button>
          </div>
        </div>

        <div class="nav-card" @click="navigateTo('report')">
          <div class="card-bg report-bg"></div>
          <div class="card-content">
            <h3>智能诊断报告</h3>
            <p>基于 AI 的病害识别分析报告与历史趋势查询。</p>
            <button class="enter-btn">查看报告 &rarr;</button>
          </div>
        </div>
      </div>

      <div class="news-panel">
        <div class="panel-header">
          <h3>📢 实时巡检动态</h3>
        </div>
        <ul class="activity-list">
          <li v-for="(item, index) in activities" :key="index" class="activity-item">
            <span class="time">{{ item.time }}</span>
            <div class="detail">
              <span class="tag" :class="item.typeClass">{{ item.type }}</span>
              <span class="desc">{{ item.desc }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 模拟实时动态数据
const activities = ref([
  { time: '10:42', type: '新发现', typeClass: 'warn', desc: '跑道 02L 发现轻微裂缝 (ID: 2.11-73)' },
  { time: '10:30', type: '巡检中', typeClass: 'info', desc: '机器人 #03 完成 A 区扫描' },
  { time: '09:15', type: '已修复', typeClass: 'success', desc: '工单 #8823 坑槽修补完成' },
  { time: '08:00', type: '系统', typeClass: 'system', desc: '早班巡检任务已自动下发' },
  { time: '07:55', type: '天气', typeClass: 'system', desc: '气象条件更新：能见度良好' },
]);

// 路由跳转逻辑
const navigateTo = (module) => {
  switch (module) {
    case 'gis':
      router.push({ name: 'AirportGis' }); // 跳转到 GIS Dashboard
      break;
    case 'monitor':
      // 暂时提示开发中，因为AirportMonitor组件尚未实现
      alert('实时监控大屏模块开发中...');
      break;
    case 'report':
      // 暂时跳到故障诊断或提示开发中
      // router.push({ name: 'FaultDiagnosis' });
      alert('报表模块开发中...');
      break;
  }
};
</script>

<style scoped>
.airport-home {
  padding: 24px;
  background-color: #f5f7fa; /* 浅灰底色 */
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 顶部欢迎区 */
.welcome-section {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  padding: 30px 40px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(30, 60, 114, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.text-content p {
  margin: 8px 0 16px;
  opacity: 0.8;
  font-size: 14px;
}

.weather-widget {
  background: rgba(255,255,255,0.1);
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
}

/* 装饰圆圈 */
.tech-circle {
  width: 200px;
  height: 200px;
  border: 20px solid rgba(255,255,255,0.05);
  border-radius: 50%;
  position: absolute;
  right: -50px;
  top: -50px;
}

/* KPI 指标区 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-box.blue { background: #e6f7ff; color: #1890ff; }
.icon-box.orange { background: #fff7e6; color: #faad14; }
.icon-box.green { background: #f6ffed; color: #52c41a; }
.icon-box.purple { background: #f9f0ff; color: #722ed1; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-info .label {
  font-size: 20px;
  color: #8c8c8c;
}

.kpi-info .value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.kpi-info .value small {
  font-size: 12px;
  font-weight: normal;
  color: #9ca3af;
}

/* 主要内容区 */
.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr; /* 左侧导航占2/3，右侧动态占1/3 */
  gap: 24px;
  flex: 1;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 两列 */
  gap: 20px;
  /* 让第一个大卡片跨两行或者保持独立，这里使用Flex wrap效果 */
}

.nav-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.nav-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #1890ff;
}

/* 卡片背景装饰 */
.card-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 50%);
  z-index: 0;
  opacity: 0.5;
}

.card-content {
  position: relative;
  z-index: 1;
}

.nav-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.nav-card p {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.enter-btn {
  background: none;
  border: 1px solid #1890ff;
  color: #1890ff;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.nav-card:hover .enter-btn {
  background: #1890ff;
  color: white;
}

/* 动态面板 */
.news-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.panel-header h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  color: #0B1220;
  border-left: 4px solid #1890ff;
  padding-left: 10px;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  font-size: 18px;
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item .time {
  font-size: 12px;
  color: #999;
  min-width: 40px;
}

.activity-item .detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-item .tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.tag.warn { background: #fff1f0; color: #f5222d; }
.tag.info { background: #e6f7ff; color: #1890ff; }
.tag.success { background: #f6ffed; color: #52c41a; }
.tag.system { background: #f3f4f6; color: #6b7280; }

.activity-item .desc {
  font-size: 13px;
  color: #333;
}
</style>