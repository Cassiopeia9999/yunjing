<template>
  <div class="home-container">
    <nav :class="{ 'scrolled': isScrolled }">
      <div class="container nav-inner">
        <div class="logo">
          <i class="fa-solid fa-bridge-water" style="color: var(--primary); margin-right: 10px;"></i>
          DEEPBLUE<span style="color: var(--primary);">GUARD</span>
        </div>
        <div class="nav-links">
          <a href="#features">核心价值</a>
          <a href="#architecture">系统架构</a>
          <a href="#hardware">感知硬件</a>
          <a href="#comparison">效能对比</a>
        </div>
        <div class="nav-actions">
          <el-button type="warning" plain @click="navigateTo('/bridge-view/monitor')">
            <el-icon class="el-icon--left"><Monitor /></el-icon>
            桥梁监测
          </el-button>

          <el-button type="warning" plain @click="navigateTo('/radioMonitor')">
            <el-icon class="el-icon--left"><Monitor /></el-icon>
            原始数据
          </el-button>

          <el-button type="success" plain @click="navigateTo('/EzPlayer')">
            <el-icon class="el-icon--left"><VideoPlay /></el-icon>
            实时视频
          </el-button>

          <el-button type="primary">
            <el-icon class="el-icon--left"><User /></el-icon>
            控制台登录
          </el-button>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div class="container hero-content">
        <span class="tagline"><i class="fa-solid fa-network-wired"></i> 端-边-云协同 • 工业级全栈方案</span>
        <h1>桥梁水下结构<br>全天候智能监测与预警系统</h1>
        <p>针对传统检测“盲区多、频率低、风险高”的痛点，集成高精度声呐、AI视觉及水文传感技术。<br>构建在线监测平台，实现对桥墩冲刷、河床演变及外部入侵的实时量化监控。</p>
        <div class="cta-group">
          <el-button type="primary" size="large" round class="hero-btn">
            获取解决方案
          </el-button>
          <el-button size="large" round plain class="hero-btn glass-btn">
            下载技术白皮书
          </el-button>
        </div>
      </div>
    </section>

    <div class="stats-bar">
      <div class="container stats-grid">
        <div class="stat-item" v-for="(item, index) in stats" :key="index">
          <h3>{{ item.value }}</h3>
          <p>{{ item.label }}</p>
        </div>
      </div>
    </div>

    <section id="architecture" class="section-padding tech-section">
      <div class="container">
        <h2>五层解耦 • 稳健架构</h2>
        <p class="subtitle">基于 Spring Cloud Alibaba 微服务生态构建，实现从感知到决策的全链路数据闭环。</p>

        <div class="arch-container">
          <div class="arch-text">
            <div class="layer-card" v-for="(layer, index) in layers" :key="index">
              <h4><i :class="layer.icon"></i> {{ layer.title }}</h4>
              <p>{{ layer.desc }}</p>
            </div>
          </div>
          <div class="arch-visual">
            <img src="/images/bridge-1.png" alt="DeepBlue System Architecture Diagram">
          </div>
        </div>
      </div>
    </section>

    <section id="hardware" class="section-padding hardware-section">
      <div class="container">
        <h2>感知层 • 工业级硬件</h2>
        <p class="subtitle">自主研发固件适配，专为恶劣水下环境设计，实现多维数据采集。</p>

        <div class="hw-grid">
          <div class="hw-card" v-for="(hw, index) in hardware" :key="index">
            <div class="hw-icon"><i :class="hw.icon"></i></div>
            <h3>{{ hw.name }}</h3>
            <p style="color: #888; margin-bottom: 15px;">{{ hw.model }}</p>
            <ul class="hw-specs">
              <li v-for="(spec, sIndex) in hw.specs" :key="sIndex">{{ spec }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="section-padding features-section">
      <div class="container">
        <div class="feature-grid">
          <div>
            <h2>我们的使命<br>保障桥梁水下结构安全运行</h2>
            <p style="color: var(--text-gray); margin-bottom: 40px;">突破恶劣天气与水文条件限制，变“被动抢修”为“主动预防”。</p>

            <div class="feature-list-item" v-for="(feat, index) in features" :key="index">
              <div class="f-icon"><i :class="feat.icon"></i></div>
              <div>
                <h4>{{ feat.title }}</h4>
                <p style="color: #888; font-size: 0.9rem;">{{ feat.desc }}</p>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: center;">
            <img src="/images/screen.png" alt="DeepBlue Dashboard Interface" class="dashboard-preview">
          </div>
        </div>

        <div id="comparison">
          <table class="comparison-table">
            <thead>
            <tr>
              <th width="30%">指标对比</th>
              <th width="35%">传统人工/潜水员检测</th>
              <th width="35%" class="highlight-col"><i class="fa-solid fa-circle-check"></i> DeepBlue 智能监测</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(row, index) in comparisons" :key="index">
              <td>{{ row.feature }}</td>
              <td>{{ row.traditional }}</td>
              <td class="highlight-col">{{ row.deepblue }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="logo" style="margin-bottom: 20px;">
              <i class="fa-solid fa-bridge-water"></i> DeepBlue Guard
            </div>
            <p style="color: #666; font-size: 0.9rem; max-width: 300px;">
              利用工业互联网与数字孪生技术，为每一座桥梁建立水下结构健康电子档案。
            </p>
          </div>
          <div class="footer-col">
            <h4>解决方案</h4>
            <ul>
              <li><a href="#">桥墩冲刷监测</a></li>
              <li><a href="#">水位流速监测</a></li>
              <li><a href="#">桥梁防撞预警</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>开发者与支持</h4>
            <ul>
              <li><a href="#">API 文档中心</a></li>
              <li><a href="#">硬件接入指南</a></li>
              <li><a href="#">系统运维手册</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>联系我们</h4>
            <ul>
              <li><i class="fa-solid fa-phone"></i> 400-DEEP-BLUE</li>
              <li><i class="fa-solid fa-envelope"></i> contact@deepblue.com</li>
            </ul>
          </div>
        </div>
        <div class="copyright">
          &copy; 2024 DeepBlue Guard System. All Rights Reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
// 引入 Element Plus 图标
import { Monitor, VideoPlay, User } from '@element-plus/icons-vue';

const router = useRouter();
const isScrolled = ref(false);

// 路由跳转方法
const navigateTo = (path) => {
  router.push(path);
};

// 滚动监听
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// --- 数据部分 (文案已更新为方案二) ---

const stats = [
  { value: '99.9%', label: '数据传输可靠性' },
  { value: '< 2s', label: '端到端预警延迟' },
  { value: '5000mm', label: '最大监测深度' },
  { value: 'IP68', label: '水下设备防护等级' }
];

const layers = [
  { title: '应用与展现层 (Application)', desc: 'PC大屏数字孪生、微信小程序预警触达。', icon: 'fa-solid fa-cloud' },
  { title: '微服务核心层 (Microservices)', desc: '设备接入、规则引擎、视频鉴权等独立服务。', icon: 'fa-solid fa-server' },
  { title: '数据存储层 (Storage)', desc: 'InfluxDB 处理高频时序数据，MySQL 管理业务。', icon: 'fa-solid fa-database' },
  { title: '边缘感知层 (Edge & Sensing)', desc: '声呐传感器与AI摄像机数据 MQTT/4G 上报。', icon: 'fa-solid fa-tower-broadcast' }
];

const hardware = [
  {
    name: '水下测距声呐', model: 'SN-2000 Pro', icon: 'fa-solid fa-satellite-dish',
    specs: ['量程：0 ~ 5000mm 高精度', '特点：穿透浑水，抗干扰算法', '防护：IP68 30米深度防水']
  },
  {
    name: '智能边缘DTU', model: 'DT-4G Box AI', icon: 'fa-solid fa-microchip',
    specs: ['通信：4G Cat.1 / NB-IoT 双模', '边缘计算：本地数据清洗与缓存', '安全：TLS 双向认证加密']
  },
  {
    name: '视觉感知摄像机', model: 'EZ-Vision Star', icon: 'fa-solid fa-video',
    specs: ['画质：400万星光级夜视', '联动：预警触发自动录像', '生态：无缝对接萤石云平台']
  }
];

// 核心功能 - 更新为 4大核心价值
const features = [
  {
    title: '【精细化感知】多源异构数据融合',
    desc: '采用工业级声呐扫描桥墩周边地形，结合AI摄像机捕捉碰撞证据，辅以水位数据，形成完整的水下健康档案。',
    icon: 'fa-solid fa-layer-group'
  },
  {
    title: '【实时化管控】全时段在线监测',
    desc: '突破恶劣环境限制，7x24小时连续运行。数据加密回传至云端，管理人员随时掌握桥梁“脉搏”。',
    icon: 'fa-solid fa-clock-rotate-left'
  },
  {
    title: '【可视化评估】三维动态与趋势分析',
    desc: '将晦涩数据转化为直观的3D模型与演变曲线。支持历史极值对比，精准研判冲刷趋势。',
    icon: 'fa-solid fa-chart-line'
  },
  {
    title: '【主动式维保】智能预警与决策闭环',
    desc: '基于国标设定动态阈值，异常第一时间分级预警。变“被动抢修”为“主动预防”，降低运维成本。',
    icon: 'fa-solid fa-shield-halved'
  }
];

// 对比表格 - 保持与方案二语境一致
const comparisons = [
  { feature: '监测频率', traditional: '数月一次（仅枯水期）', deepblue: '7x24小时 实时在线' },
  { feature: '洪水响应能力', traditional: '无法作业，关键数据缺失', deepblue: '全天候运行，精准捕捉极值' },
  { feature: '数据维度', traditional: '单一、离散的数值报告', deepblue: '深度+视频+3D模型 三维融合' },
  { feature: '风险与成本', traditional: '人员作业风险高，单次成本昂贵', deepblue: '无人化作业，长期边际成本低' }
];
</script>

<style scoped>
/* Element Plus 按钮样式覆盖 */
:deep(.el-button) {
  font-weight: 600;
}

/* 主容器样式 */
.home-container {
  --bg-dark: #05070a;
  --bg-layer-1: #0f141f;
  --bg-layer-2: #161b28;
  --primary: #00A8FF;
  --secondary: #00E5FF;
  --accent: #2e86de;
  --text-main: #ffffff;
  --text-gray: #aab2bd;
  --border-light: rgba(255, 255, 255, 0.08);

  background-color: var(--bg-dark);
  color: var(--text-main);
  line-height: 1.6;
  font-family: 'Inter', 'PingFang SC', system-ui, sans-serif;
  overflow-x: hidden;
}

.container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
.section-padding { padding: 100px 0; }

h2 { font-size: 2.5rem; margin-bottom: 20px; text-align: center; position: relative; display: inline-block; left: 50%; transform: translateX(-50%); color: #fff;}
h2::after { content: ''; display: block; width: 60px; height: 4px; background: var(--primary); margin: 15px auto 0; border-radius: 2px; }
.subtitle { text-align: center; color: var(--text-gray); max-width: 600px; margin: 0 auto 60px; font-size: 1.1rem; }

/* 导航栏 */
nav {
  position: fixed; width: 100%; top: 0; z-index: 1000; padding: 20px 0;
  transition: 0.3s;
  background: rgba(5, 7, 10, 0.2);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
nav.scrolled {
  background: rgba(5, 7, 10, 0.95);
  padding: 15px 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.nav-inner { display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 1.5rem; font-weight: 800; color: white; display: flex; align-items: center; }
.nav-links { display: flex; }
.nav-links a { color: var(--text-gray); text-decoration: none; margin: 0 20px; transition: 0.3s; font-size: 0.95rem; }
.nav-links a:hover { color: var(--primary); }
.nav-actions { display: flex; gap: 10px; align-items: center;}

/* Hero Section */
.hero {
  height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden;
  background: linear-gradient(rgba(5, 7, 10, 0.6), rgba(5, 7, 10, 0.8)), url('/images/hero.png');
  background-size: cover; background-position: center;
}
.hero-content { position: relative; z-index: 2; text-align: center; max-width: 900px; margin: 0 auto; }
.tagline { color: var(--secondary); font-weight: 600; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; display: inline-block; padding: 5px 15px; background: rgba(0, 229, 255, 0.1); border-radius: 20px; border: 1px solid rgba(0, 229, 255, 0.2); }
.hero h1 { font-size: 4rem; line-height: 1.2; margin-bottom: 30px; background: -webkit-linear-gradient(#fff, #87cefa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(0, 168, 255, 0.3); }
.hero p { font-size: 1.1rem; color: var(--text-gray); margin-bottom: 40px; max-width: 800px; margin-left: auto; margin-right: auto;}

.cta-group { display: flex; gap: 20px; justify-content: center; }
.hero-btn { min-width: 160px; font-size: 1rem; }
.glass-btn { background: rgba(255,255,255,0.05); color: var(--primary); border-color: var(--primary); }
.glass-btn:hover { background: rgba(0,168,255,0.1); }

/* Stats */
.stats-bar { background: var(--bg-layer-2); padding: 40px 0; border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
.stat-item h3 { font-size: 2.5rem; color: var(--primary); font-family: 'Courier New', monospace; margin-bottom: 5px; margin-top: 0;}
.stat-item p { color: var(--text-gray); font-size: 0.9rem; margin-bottom: 0;}

/* Architecture */
.tech-section { background: var(--bg-layer-1); }
.arch-container { display: flex; gap: 50px; align-items: center; margin-top: 50px; }
.arch-text { flex: 1; }
.arch-visual { flex: 1.2; position: relative; display: flex; justify-content: center; align-items: center; }
.arch-visual img { width: 100%; height: auto; object-fit: contain; filter: drop-shadow(0 0 30px rgba(0, 168, 255, 0.15)); transition: transform 0.3s; }
.arch-visual img:hover { transform: scale(1.02); }

.layer-card { background: rgba(255,255,255,0.03); padding: 20px; border-left: 4px solid var(--primary); margin-bottom: 15px; border-radius: 0 8px 8px 0; transition: 0.3s; }
.layer-card:hover { background: rgba(0, 168, 255, 0.1); transform: translateX(10px); }
.layer-card h4 { color: white; margin-bottom: 5px; margin-top: 0; }
.layer-card p { font-size: 0.9rem; color: var(--text-gray); margin-bottom: 0; }

/* Hardware */
.hardware-section { position: relative; background: var(--bg-dark); }
.hw-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
.hw-card { background: var(--bg-layer-2); padding: 40px 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border-light); transition: 0.3s; }
.hw-card:hover { border-color: var(--primary); transform: translateY(-10px); box-shadow: 0 10px 30px rgba(0, 168, 255, 0.1); }
.hw-icon { width: 80px; height: 80px; background: rgba(0, 168, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; color: var(--primary); font-size: 2rem; }
.hw-specs { text-align: left; margin-top: 20px; list-style: none; padding-left: 20px; }
.hw-specs li { color: var(--text-gray); font-size: 0.9rem; margin-bottom: 8px; position: relative; }
.hw-specs li::before { content: '•'; color: var(--secondary); position: absolute; left: -15px; }

/* Features */
.features-section { background: linear-gradient(180deg, var(--bg-layer-1) 0%, var(--bg-dark) 100%); }
.feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 60px; align-items: center; }
.feature-list-item { display: flex; gap: 20px; margin-bottom: 30px; }
.f-icon { width: 50px; height: 50px; background: var(--bg-layer-2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--secondary); flex-shrink: 0; font-size: 1.2rem; border: 1px solid rgba(0, 229, 255, 0.2); }

.dashboard-preview { width: 100%; border-radius: 12px; border: 1px solid rgba(0, 168, 255, 0.4); box-shadow: 0 20px 60px rgba(0, 168, 255, 0.25); transition: transform 0.3s; }
.dashboard-preview:hover { transform: scale(1.01); }

/* Comparison Table */
.comparison-table { width: 100%; border-collapse: collapse; margin-top: 60px; color: var(--text-gray); background: var(--bg-layer-2); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.comparison-table th, .comparison-table td { padding: 25px; border-bottom: 1px solid var(--border-light); text-align: left; }
.comparison-table th { color: white; font-size: 1.1rem; background: rgba(0, 168, 255, 0.1); }
.highlight-col { color: var(--primary); font-weight: bold; background: rgba(0, 168, 255, 0.08); }
.comparison-table tr:hover td { background: rgba(255,255,255,0.02); }

/* Footer */
footer { background: #020304; padding: 80px 0 30px; border-top: 1px solid var(--border-light); }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }
.footer-col h4 { color: white; margin-bottom: 20px; margin-top: 0; }
.footer-col ul { list-style: none; padding: 0; }
.footer-col ul li { margin-bottom: 10px; }
.footer-col ul li a { color: var(--text-gray); text-decoration: none; transition: 0.2s; }
.footer-col ul li a:hover { color: var(--primary); }
.copyright { text-align: center; padding-top: 30px; border-top: 1px solid var(--border-light); color: #555; font-size: 0.9rem; }

/* Mobile Responsive */
@media (max-width: 1024px) {
  .hero h1 { font-size: 3rem; }
  .arch-container, .feature-grid { flex-direction: column; grid-template-columns: 1fr; gap: 40px; }
  .arch-visual { order: -1; margin-bottom: 30px; }
}

@media (max-width: 768px) {
  .hero h1 { font-size: 2.2rem; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .hw-grid { grid-template-columns: 1fr; }
  .nav-links, .nav-actions { display: none; }
  .logo { flex-grow: 1; justify-content: center; }
  .footer-grid { grid-template-columns: 1fr; text-align: center; }
}
</style>