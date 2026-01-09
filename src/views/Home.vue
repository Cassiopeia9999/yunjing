<template>
  <div class="portal-container">
    <nav class="portal-nav">
      <div class="container nav-inner">
        <div class="logo">
          <i class="fa-solid fa-cube" style="color: var(--primary);"></i>
          DEEPBLUE<span style="color: var(--secondary);">BRAIN</span>
        </div>
        <div class="nav-links">
          <a href="#">平台概览</a>
          <a href="#">解决方案</a>
          <a href="#">合作伙伴</a>
        </div>
        <el-button type="primary" round>控制台登录</el-button>
      </div>
    </nav>

    <section class="portal-hero">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <span class="tagline">Industrial Digital Twin Platform</span>
        <h1>全场景工业数字孪生<br>赋能千行百业</h1>
        <p>基于 DeepBlue Brain 核心引擎，为交通、制造、能源等领域提供<br>从感知到决策的一站式数字化解决方案。</p>
      </div>
    </section>

    <section class="scenarios-section">
      <div class="container">
        <h2>多维场景 · 智能触达</h2>
        <div class="scenario-grid">

          <div class="scenario-card" @click="navigateTo('/bridge')">
            <div class="card-image bridge-img">
              <div class="overlay"></div>
              <span class="status-badge online">运行中</span>
            </div>
            <div class="card-content">
              <div class="icon-box"><i class="fa-solid fa-bridge-water"></i></div>
              <h3>桥梁水下智能监测</h3>
              <p>集成声呐与视觉技术，针对桥墩冲刷、碰撞预警的防汛抗洪专业方案。</p>
              <div class="link-arrow">进入系统 <i class="fa-solid fa-arrow-right"></i></div>
            </div>
          </div>

          <div class="scenario-card" @click="navigateTo('/diagnosis')">
            <div class="card-image factory-img">
              <div class="overlay"></div>
              <span class="status-badge warning">维护中</span>
            </div>
            <div class="card-content">
              <div class="icon-box"><i class="fa-solid fa-gears"></i></div>
              <h3>工业设备故障诊断</h3>
              <p>基于振动频谱分析与AI模型，实现大型旋转机械的预测性维护与故障定位。</p>
              <div class="link-arrow">进入系统 <i class="fa-solid fa-arrow-right"></i></div>
            </div>
          </div>


          <div class="scenario-card" @click="navigateTo('/urcs-dashboard')">
            <div class="card-image agv-bg">
              <div class="overlay"></div>
              <span class="status-badge success">运行中</span>
            </div>
            <div class="card-content">
              <div class="icon-box"><i class="fa-solid fa-robot"></i></div>
              <h3>AGV统一调度中枢</h3>
              <p>面向多品牌异构AGV的统一管控平台。核心实现影子队列同步、全局路权智能裁决与混合充电策略。</p>
              <div class="link-arrow">进入控制台 <i class="fa-solid fa-arrow-right"></i></div>
            </div>
          </div>

          <div class="scenario-card disabled">
            <div class="card-image site-img">
              <div class="overlay"></div>
              <span class="status-badge offline">建设中</span>
            </div>
            <div class="card-content">
              <div class="icon-box"><i class="fa-solid fa-helmet-safety"></i></div>
              <h3>智慧工地安全监管</h3>
              <p>利用边缘计算识别违规作业，构建人-机-环全方位的安全防护体系。</p>
              <div class="link-arrow">敬请期待</div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section class="platform-base">
      <div class="container">
        <h2>DeepBlue Brain 核心能力</h2>
        <div class="base-grid">
          <div class="base-item">
            <i class="fa-solid fa-network-wired"></i>
            <h4>万物互联</h4>
            <p>支持 200+ 工业协议接入</p>
          </div>
          <div class="base-item">
            <i class="fa-solid fa-brain"></i>
            <h4>AI 算法引擎</h4>
            <p>内置 50+ 场景化算法模型</p>
          </div>
          <div class="base-item">
            <i class="fa-brands fa-unity"></i>
            <h4>孪生渲染</h4>
            <p>UE5 / Unity 高保真映射</p>
          </div>
          <div class="base-item">
            <i class="fa-solid fa-shield-halved"></i>
            <h4>数据安全</h4>
            <p>端到端加密与私有化部署</p>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div class="copyright">© 2025 DeepBlue Brain Platform. All Rights Reserved.</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
/* 定义变量，保持原有色调但更加宏大 */
.portal-container {
  --bg-dark: #05070a;
  --bg-card: #0f141f;
  --primary: #00A8FF;
  --secondary: #00E5FF;
  --text-main: #ffffff;
  --text-gray: #aab2bd;

  background-color: var(--bg-dark);
  color: var(--text-main);
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}

.container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }

/* 导航 */
.portal-nav {
  position: fixed; top: 0; width: 100%; z-index: 100;
  padding: 20px 0; background: rgba(5,7,10,0.8); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.nav-inner { display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.nav-links a { color: var(--text-gray); margin: 0 20px; text-decoration: none; transition: 0.3s; }
.nav-links a:hover { color: var(--primary); }

/* Hero */
.portal-hero {
  height: 60vh; display: flex; align-items: center; text-align: center; position: relative;
  background: radial-gradient(circle at center, #1a2a40 0%, #05070a 70%);
}
.hero-content { position: relative; z-index: 2; }
.tagline { color: var(--secondary); letter-spacing: 3px; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 15px; display: block;}
h1 { font-size: 3.5rem; line-height: 1.2; margin-bottom: 20px; background: -webkit-linear-gradient(#fff, #87cefa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.portal-hero p { color: var(--text-gray); font-size: 1.2rem; max-width: 700px; margin: 0 auto; }

/* 场景卡片区 */
.scenarios-section { padding: 80px 0; }
h2 { text-align: center; font-size: 2rem; margin-bottom: 60px; }

.scenario-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;
}

.scenario-card {
  background: var(--bg-card); border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05); transition: 0.4s; cursor: pointer;
  position: relative;
}
.scenario-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 168, 255, 0.15);
  border-color: var(--primary);
}
.scenario-card.disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.8); }

/* 卡片图片区 (使用渐变模拟图片，实际可换成 img) */
.card-image { height: 200px; position: relative; background-size: cover; background-position: center; }
.bridge-img { background-image: url('/images/hero.png'); }
.factory-img { background-image: url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format'); }
.site-img { background-image: url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format'); }

.overlay { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-card), transparent); }

.status-badge {
  position: absolute; top: 15px; right: 15px; padding: 4px 10px; border-radius: 20px;
  font-size: 0.8rem; font-weight: bold; color: white; backdrop-filter: blur(5px);
}
.online { background: rgba(46, 213, 115, 0.2); border: 1px solid #2ed573; color: #2ed573; }
.warning { background: rgba(255, 165, 2, 0.2); border: 1px solid #ffa502; color: #ffa502; }
.offline { background: rgba(255, 255, 255, 0.1); border: 1px solid #999; color: #999; }

/* 卡片内容 */
.card-content { padding: 30px; position: relative; }
.icon-box {
  width: 50px; height: 50px; background: rgba(0, 168, 255, 0.1); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.5rem; margin-bottom: 20px;
}
.card-content h3 { font-size: 1.4rem; margin-bottom: 10px; }
.card-content p { color: var(--text-gray); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px; height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

.link-arrow { color: var(--secondary); font-weight: 600; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
.scenario-card:hover .link-arrow { gap: 15px; }

/* 平台底座 */
.platform-base { padding: 60px 0; background: var(--bg-card); border-top: 1px solid rgba(255,255,255,0.05); }
.base-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
.base-item i { font-size: 2rem; color: var(--text-gray); margin-bottom: 15px; }
.base-item h4 { font-size: 1.1rem; margin-bottom: 5px; color: white; }
.base-item p { color: var(--text-gray); font-size: 0.9rem; }
/* AGV 专属背景图 */
.agv-bg {
  /* 建议替换为真实的 AGV 小车或工厂跑道图片 */
  background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
  background-size: cover;
  background-position: center;
}

/* 运行中状态 - 绿色样式 */
.status-badge.success {
  background: rgba(225, 243, 216, 0.9);
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
footer { padding: 30px 0; text-align: center; color: #555; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.05); }

/* 响应式 */
@media (max-width: 1024px) {
  .scenario-grid { grid-template-columns: repeat(2, 1fr); }
  h1 { font-size: 2.5rem; }
}
@media (max-width: 768px) {
  .scenario-grid { grid-template-columns: 1fr; }
  .base-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
  .nav-links { display: none; }
}
</style>