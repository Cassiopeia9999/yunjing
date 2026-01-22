<template>
  <div class="intro-page" ref="pageContainer" @scroll="handleScroll">

    <nav class="navbar" :class="{ scrolled: isScrolled }">
      <div class="brand">
        <div class="logo-box">
          <span class="logo-icon">✈️</span>
        </div>
        <div class="brand-text">
          <div class="title">机场道面智慧管养平台</div>
          <div class="subtitle">Digital Twin Pavement Management System</div>
        </div>
      </div>
      <div class="nav-links">
        <a href="#philosophy" @click.prevent="scrollToSection('philosophy')">核心理念</a>
        <a href="#workflow" @click.prevent="scrollToSection('workflow')">业务闭环</a>
        <a href="#capabilities" @click.prevent="scrollToSection('capabilities')">技术能力</a>
        <button class="login-btn" @click="enterSystem">
          进入 GIS 系统 <span class="arrow">➔</span>
        </button>
      </div>
    </nav>

    <header class="hero-section">
      <div class="tech-grid-bg"></div>
      <div class="radar-circle"></div>

      <div class="hero-content">
        <div class="badge animate-up">V2.0 全新发布</div>
        <h1 class="hero-title animate-up delay-1">
          <span class="gradient-text">数据驱动</span> 精准管养<br>
          重塑机场运维价值链
        </h1>
        <p class="hero-desc animate-up delay-2">
          面向未来的数字孪生解决方案。覆盖“感、知、析、策”全业务环节，
          通过全数字化流程，让每一寸道面都在掌控之中。
        </p>
        <div class="cta-group animate-up delay-3">
          <button class="primary-btn" @click="enterSystem">
            <span class="icon">🚀</span> 开启智慧巡检
          </button>
          <button class="outline-btn">查看技术白皮书</button>
        </div>
      </div>

      <div class="scroll-down-hint" @click="scrollToSection('philosophy')">
        <span>Scroll Down</span>
        <div class="chevron"></div>
        <div class="chevron"></div>
        <div class="chevron"></div>
      </div>

      <div class="data-flow-line"></div>
    </header>

    <section id="philosophy" class="section philosophy-section">
      <div class="container">
        <div class="section-header center">
          <span class="section-tag">核心主张 · CORE PHILOSOPHY</span>
          <h2>全业务环节覆盖 · 全面数字化</h2>
          <p>告别经验主义，走向数据理性。构建物理世界与数字世界的精准映射。</p>
        </div>

        <div class="pillars-grid">
          <div class="pillar-card">
            <div class="p-icon">👁️</div>
            <h3>全域感知 (Sensing)</h3>
            <p>打破信息孤岛，实现从<b>表观</b>到<b>内部</b>、从<b>跑道</b>到<b>管线</b>的数据全融合。</p>
            <div class="p-tags">
              <span>无人机影像</span>
              <span>探地雷达</span>
              <span>物联网</span>
            </div>
          </div>

          <div class="pillar-card highlight">
            <div class="glow-effect"></div>
            <div class="p-icon">⚙️</div>
            <h3>流程驱动 (Process)</h3>
            <p>数据是流动的血液。通过标准化的<b>DAS解译</b>与<b>GIS入库</b>流程，将原始数据转化为资产。</p>
            <div class="process-mini">
              <span>采集</span>→<span>解译</span>→<span>评估</span>
            </div>
          </div>

          <div class="pillar-card">
            <div class="p-icon">🎯</div>
            <h3>精准决策 (Decision)</h3>
            <p>基于 PCI/SCI 模型，实现从“被动抢修”向<b>“预防性养护”</b>的根本转变。</p>
            <div class="metrics-mini">
              <div><strong>30%</strong><small>成本降低</small></div>
              <div><strong>5x</strong><small>效率提升</small></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="workflow" class="section workflow-section">
      <div class="container">
        <div class="section-header left">
          <span class="section-tag">业务闭环 · WORKFLOW</span>
          <h2>DAS 与 GIS 的深度协同</h2>
          <p>打通数据生产到消费的最后一公里，支持在线推送与离线导入双模式。</p>
        </div>

        <div class="workflow-diagram">
          <div class="wf-step">
            <div class="step-icon">🛰️</div>
            <div class="step-info">
              <h4>01. 智能采集</h4>
              <p>雷达车/巡检车进场，采集高清影像与雷达波数据。</p>
            </div>
          </div>
          <div class="wf-arrow"></div>

          <div class="wf-step">
            <div class="step-icon">🧠</div>
            <div class="step-info">
              <h4>02. DAS解译</h4>
              <p>AI 自动识别裂缝、脱空等病害，生成 GeoJSON。</p>
            </div>
          </div>
          <div class="wf-arrow"></div>

          <div class="wf-step active">
            <div class="step-icon">💾</div>
            <div class="step-info">
              <h4>03. 数据交互</h4>
              <p>通过 API 或离线包导入 GIS，建立检测任务批次。</p>
            </div>
          </div>
          <div class="wf-arrow"></div>

          <div class="wf-step">
            <div class="step-icon">🌍</div>
            <div class="step-info">
              <h4>04. 决策应用</h4>
              <p>GIS 一张图管理，自动生成维修工单与评估报告。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="capabilities" class="section features-section">
      <div class="container">
        <div class="feature-layout">
          <div class="feature-text">
            <span class="section-tag">技术能力 · CAPABILITIES</span>
            <h2>数字孪生底座<br>赋能精细化管理</h2>
            <ul class="feature-list">
              <li>
                <span class="check">✓</span>
                <div>
                  <strong>海量数据秒级渲染</strong>
                  <p>支持千万级矢量要素加载，自研切片算法优化超大分辨率影像。</p>
                </div>
              </li>
              <li>
                <span class="check">✓</span>
                <div>
                  <strong>表观与内部一体化</strong>
                  <p>独有的“透视模式”，在地图上同时查看路面裂缝与地下空洞。</p>
                </div>
              </li>
              <li>
                <span class="check">✓</span>
                <div>
                  <strong>历史回溯与演变</strong>
                  <p>基于“检测任务”的时间轴管理，清晰查看病害的生长趋势。</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="feature-visual">
            <div class="system-mockup">
              <div class="mock-header">
                <div class="dots"><span></span><span></span><span></span></div>
              </div>
              <div class="mock-body">
                <div class="mock-sidebar"></div>
                <div class="mock-map-area">
                  <div class="mock-path"></div>
                  <div class="mock-popover">
                    <div class="pop-title">内部隐患: 脱空</div>
                    <div class="pop-data">深度: 0.5m | 面积: 2.4㎡</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="glow-bg"></div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-flex">
        <div class="f-info">
          <h3>机场道面智慧管养平台</h3>
          <p>© 2025 Intelligent Pavement Maintenance System.</p>
        </div>
        <div class="f-stack">
          <span>Powered by:</span>
          <span class="tag">Vue 3</span>
          <span class="tag">Leaflet</span>
          <span class="tag">AI Analysis</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isScrolled = ref(false);
const pageContainer = ref(null); // [新增] 获取容器实例

// [修改] 滚动处理逻辑：不再监听 window，而是监听容器
const handleScroll = (e) => {
  // 获取容器的 scrollTop
  const scrollTop = e.target.scrollTop;
  isScrolled.value = scrollTop > 50;
};

// [新增] 平滑滚动到指定区域
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element && pageContainer.value) {
    // 容器内滚动
    pageContainer.value.scrollTo({
      top: element.offsetTop, // 这里不需要减去导航栏高度，因为是容器内部定位，或者视情况微调
      behavior: 'smooth'
    });
  }
};

const enterSystem = () => {
  console.log("Entering System...");
  router.push('/inner/gis'); // 确保路由路径正确
};
</script>

<style scoped>
/* ================= 核心修改：容器独立滚动 ================= */
.intro-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #050a14;
  color: #fff;
  width: 100%;

  /* 关键：强制占满视口高度，并开启内部滚动 */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth; /* 启用 CSS 平滑滚动 */

  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #1890ff #050a14;
}

/* Webkit 滚动条美化 */
.intro-page::-webkit-scrollbar { width: 8px; }
.intro-page::-webkit-scrollbar-track { background: #050a14; }
.intro-page::-webkit-scrollbar-thumb { background-color: rgba(24,144,255,0.3); border-radius: 4px; }
.intro-page::-webkit-scrollbar-thumb:hover { background-color: rgba(24,144,255,0.6); }

/* ================= 布局基础 ================= */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

a { text-decoration: none; color: inherit; }
button { outline: none; font-family: inherit; }

/* 通用动画类 */
.animate-up { opacity: 0; transform: translateY(30px); animation: fadeInUp 0.8s forwards; }
.delay-1 { animation-delay: 0.2s; }
.delay-2 { animation-delay: 0.4s; }
.delay-3 { animation-delay: 0.6s; }

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.section { padding: 100px 0; }
.section-header { margin-bottom: 60px; }
.section-header.center { text-align: center; max-width: 800px; margin-left: auto; margin-right: auto; }
.section-header h2 { font-size: 36px; margin: 15px 0 20px; }
.section-header p { color: rgba(255,255,255,0.6); line-height: 1.6; }
.section-tag { color: #1890ff; font-size: 12px; letter-spacing: 2px; font-weight: 700; background: rgba(24,144,255,0.1); padding: 4px 8px; border-radius: 4px; }

/* ================= 导航栏 ================= */
.navbar {
  /* [注意] 这里改为 absolute 还是 fixed 取决于滚动容器。
     如果 .intro-page 在滚动，fixed 是相对于浏览器窗口，absolute 是相对于容器。
     通常 fixed 在容器内滚动时仍然有效。
  */
  position: fixed;
  top: 0; left: 0; width: 100%; height: 70px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px; z-index: 100; transition: all 0.3s;
  background: transparent;
}
.navbar.scrolled {
  background: rgba(5, 10, 20, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  height: 60px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { width: 40px; height: 40px; background: #1890ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.brand-text .title { font-size: 18px; font-weight: 700; color: #fff; }
.brand-text .subtitle { font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; }

.nav-links { display: flex; align-items: center; gap: 30px; }
.nav-links a { font-size: 14px; color: rgba(255,255,255,0.7); transition: color 0.3s; cursor: pointer; }
.nav-links a:hover { color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }

.login-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, #1890ff, #0050b3);
  border: none; border-radius: 20px; color: #fff; font-weight: 600; cursor: pointer;
  transition: all 0.3s; display: flex; align-items: center; gap: 6px;
}
.login-btn:hover { box-shadow: 0 0 15px rgba(24,144,255,0.5); transform: translateY(-1px); }

/* ================= Hero Section ================= */
.hero-section {
  position: relative;
  min-height: 100vh; /* 确保首屏至少撑满一屏 */
  display: flex; align-items: center; justify-content: center;
  text-align: center; background: #050a14; overflow: hidden;
}

/* 科技背景 */
.tech-grid-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(24,144,255,0.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(24,144,255,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  perspective: 1000px; transform: scale(1.1);
}
.radar-circle {
  position: absolute; width: 800px; height: 800px;
  border: 1px solid rgba(24,144,255,0.1); border-radius: 50%;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  animation: pulse 4s infinite;
}
@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
}

.hero-content { position: relative; z-index: 2; max-width: 900px; padding: 0 20px; margin-top: -60px; /* 视觉上移一点 */ }
.badge { display: inline-block; padding: 6px 16px; background: rgba(255,255,255,0.1); border-radius: 30px; font-size: 13px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2); }

.hero-title { font-size: 64px; line-height: 1.1; margin-bottom: 24px; font-weight: 800; }
.gradient-text { background: linear-gradient(120deg, #fff, #40a9ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-desc { font-size: 18px; color: rgba(255,255,255,0.7); max-width: 700px; margin: 0 auto 40px; }

.cta-group { display: flex; gap: 20px; justify-content: center; }
.primary-btn {
  padding: 16px 48px; font-size: 18px; background: #1890ff; color: #fff;
  border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
  transition: all 0.3s;
}
.primary-btn:hover { background: #40a9ff; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(24,144,255,0.3); }

.outline-btn {
  padding: 16px 48px; font-size: 18px; background: transparent; color: #fff;
  border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer;
  transition: all 0.3s;
}
.outline-btn:hover { border-color: #fff; background: rgba(255,255,255,0.05); }

/* [新增] 滚动提示箭头样式 */
.scroll-down-hint {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; opacity: 0.7; transition: opacity 0.3s;
  z-index: 10;
}
.scroll-down-hint:hover { opacity: 1; }
.scroll-down-hint span { font-size: 12px; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; }
.chevron {
  width: 20px; height: 4px; opacity: 0; transform: scale3d(0.5, 0.5, 0.5);
  animation: move 3s ease-out infinite;
}
.chevron:first-child { animation: move 3s ease-out 1s infinite; }
.chevron:nth-child(2) { animation: move 3s ease-out 2s infinite; }
.chevron:before, .chevron:after {
  content: ' '; position: absolute; top: 0; height: 100%; width: 51%; background: #fff;
}
.chevron:before { left: 0; transform: skew(0deg, 30deg); }
.chevron:after { right: 0; width: 50%; transform: skew(0deg, -30deg); }

@keyframes move {
  25% { opacity: 1; }
  33% { opacity: 1; transform: translateY(30px); }
  67% { opacity: 1; transform: translateY(40px); }
  100% { opacity: 0; transform: translateY(55px) scale3d(0.5, 0.5, 0.5); }
}

/* ================= 核心理念 (Philosophy) ================= */
.philosophy-section { background: linear-gradient(180deg, #050a14 0%, #08101f 100%); }
.pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 50px; }

.pillar-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px; padding: 40px 30px; text-align: center;
  transition: all 0.4s; position: relative; overflow: hidden;
}
.pillar-card:hover { transform: translateY(-10px); background: rgba(255,255,255,0.05); }
.pillar-card.highlight { border-color: rgba(24,144,255,0.4); background: rgba(24,144,255,0.05); }

.p-icon { font-size: 48px; margin-bottom: 20px; }
.pillar-card h3 { font-size: 22px; margin-bottom: 15px; color: #fff; }
.pillar-card p { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 25px; }
.p-tags span { display: inline-block; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 4px; font-size: 12px; margin: 0 4px; color: #aaa; }
.process-mini { color: #1890ff; font-weight: bold; font-size: 14px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; display: inline-block; }
.metrics-mini { display: flex; justify-content: space-around; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
.metrics-mini strong { display: block; font-size: 20px; color: #52c41a; }
.metrics-mini small { font-size: 12px; color: #666; }

/* ================= 业务流程 (Workflow) ================= */
.workflow-section { background: #08101f; border-top: 1px solid rgba(255,255,255,0.05); }
.workflow-diagram { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-top: 60px; gap: 20px; }
.wf-step { flex: 1; min-width: 200px; background: #0c1829; padding: 30px 20px; border-radius: 12px; border: 1px solid transparent; transition: all 0.3s; position: relative; }
.wf-step:hover, .wf-step.active { border-color: #1890ff; box-shadow: 0 0 20px rgba(24,144,255,0.15); }
.step-icon { font-size: 32px; margin-bottom: 15px; }
.step-info h4 { font-size: 16px; color: #fff; margin-bottom: 8px; }
.step-info p { font-size: 13px; color: #666; line-height: 1.5; }
.wf-arrow { width: 40px; height: 2px; background: #333; position: relative; }
.wf-arrow::after { content: '>'; position: absolute; right: -5px; top: -10px; font-size: 16px; color: #333; }

/* ================= 技术能力 (Features) ================= */
.features-section { background: linear-gradient(135deg, #08101f 0%, #050a14 100%); }
.feature-layout { display: flex; align-items: center; gap: 80px; }
.feature-text { flex: 1; }
.feature-text h2 { font-size: 42px; margin: 20px 0 40px; }
.feature-list { list-style: none; padding: 0; }
.feature-list li { display: flex; gap: 20px; margin-bottom: 30px; }
.check { width: 24px; height: 24px; background: #52c41a; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 4px; }
.feature-list strong { font-size: 18px; color: #fff; display: block; margin-bottom: 8px; }
.feature-list p { color: #888; font-size: 14px; line-height: 1.6; }
.feature-visual { flex: 1; position: relative; }
.system-mockup { background: #111; border-radius: 12px; border: 1px solid #333; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); transform: perspective(1000px) rotateY(-5deg) rotateX(5deg); transition: transform 0.5s; width: 100%; aspect-ratio: 16/10; }
.system-mockup:hover { transform: perspective(1000px) rotateY(0) rotateX(0); }
.mock-header { height: 30px; background: #222; border-bottom: 1px solid #333; display: flex; align-items: center; padding: 0 10px; }
.dots span { display: inline-block; width: 8px; height: 8px; borderRadius: 50%; background: #444; margin-right: 6px; }
.mock-body { height: calc(100% - 30px); display: flex; }
.mock-sidebar { width: 60px; background: #1a1a1a; border-right: 1px solid #333; }
.mock-map-area { flex: 1; background: #0c1829; position: relative; background-image: radial-gradient(#2a3d55 1px, transparent 1px); background-size: 20px 20px; }
.mock-popover { position: absolute; top: 40%; left: 60%; background: rgba(0,0,0,0.8); border: 1px solid #1890ff; padding: 10px; border-radius: 4px; width: 180px; }
.pop-title { color: #1890ff; font-weight: bold; font-size: 12px; margin-bottom: 4px; }
.pop-data { color: #ccc; font-size: 11px; }
.glow-bg { position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(24,144,255,0.2) 0%, transparent 70%); transform: translate(-50%, -50%); z-index: -1; }

/* ================= 页脚 ================= */
.footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 40px 0; font-size: 14px; color: #666; }
.footer-flex { display: flex; justify-content: space-between; align-items: center; }
.f-info h3 { color: #fff; margin-bottom: 5px; font-size: 16px; }
.f-stack { display: flex; align-items: center; gap: 10px; }
.tag { background: #1f1f1f; padding: 2px 8px; border-radius: 4px; font-size: 12px; }

/* ================= 移动端适配 ================= */
@media (max-width: 900px) {
  .hero-title { font-size: 42px; }
  .feature-layout { flex-direction: column; }
  .workflow-diagram { flex-direction: column; }
  .wf-arrow { transform: rotate(90deg); margin: 10px 0; }
  .navbar { padding: 0 20px; }
  .nav-links { display: none; }
}
</style>