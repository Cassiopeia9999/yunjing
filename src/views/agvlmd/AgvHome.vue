<template>
  <div class="product-showcase">

    <section class="hero-section">
      <div class="hero-content">
        <h1 class="animate-up">U-RCS 产线物流统一调度中枢</h1>
        <p class="subtitle animate-up delay-1">
          连接群控大脑与物理执行的“数字神经系统”
        </p>
        <div class="tags-group animate-up delay-2">
          <el-tag effect="dark" round class="hero-tag">多品牌异构接入</el-tag>
          <el-tag effect="dark" round class="hero-tag" type="success">影子队列零错序</el-tag>
          <el-tag effect="dark" round class="hero-tag" type="warning">全局智能路权</el-tag>
        </div>
      </div>
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
    </section>

    <section class="section-container bg-primary">
      <div class="section-title">
        <h2>系统架构逻辑</h2>
        <p>承接群控业务指令，统筹底层异构设备，实现决策与执行的分层解耦</p>
      </div>

      <div class="architecture-diagram">

        <div class="layer north-layer">
          <div class="layer-label">北向：业务决策层 (群控平台)</div>
          <div class="layer-content-wrapper">
            <div class="module">生产节拍控制</div>
            <div class="module">MES 任务下发</div>
            <div class="module">物料绑定 (100%匹配)</div>
          </div>
        </div>

        <div class="connector-arrow">
          <el-icon><Bottom /></el-icon> 任务与队列指令
        </div>

        <div class="layer core-layer">
          <div class="layer-label text-white">核心：U-RCS 统一调度中枢</div>
          <el-row :gutter="20" class="core-modules">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="feature-box">
                <el-icon :size="40"><MapLocation /></el-icon>
                <h3>全域虚拟地图</h3>
                <p>统一坐标系，映射4家厂商地图</p>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="feature-box highlight">
                <el-icon :size="40"><List /></el-icon>
                <h3>影子队列引擎</h3>
                <p>虚实校验，拦截“10车少1车”</p>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="feature-box">
                <el-icon :size="40"><Guide /></el-icon>
                <h3>交通管制中心</h3>
                <p>路口互斥锁，多车智能避让</p>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="feature-box">
                <el-icon :size="40"><Van /></el-icon>
                <h3>智能选车策略</h3>
                <p>就近调度，降低空闲率</p>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="connector-arrow">
          <el-icon><Bottom /></el-icon> 标准化运动指令 (Move, Lift, Charge)
        </div>

        <div class="layer south-layer">
          <div class="layer-label">南向：异构执行层 (设备适配)</div>
          <div class="device-group-wrapper">
            <div class="device-card hik">
              <div class="card-icon"><el-icon><Van /></el-icon></div>
              <span class="brand">海康 AGV</span>
              <span class="role">物流搬运 / 顶升</span>
            </div>
            <div class="device-card siyuan">
              <div class="card-icon"><el-icon><Cpu /></el-icon></div>
              <span class="brand">四院 AGV</span>
              <span class="role">装配作业 / 无人岛</span>
            </div>
            <div class="device-card self">
              <div class="card-icon"><el-icon><Tools /></el-icon></div>
              <span class="brand">自研/驰众</span>
              <span class="role">物料配送 / 补料</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-container bg-secondary">
      <div class="section-title">
        <h2>车门装配全流程接管</h2>
        <p>从拆解到Top5缓存，U-RCS 提供全生命周期的物流保障</p>
      </div>

      <div class="process-flow">
        <el-steps :active="activeStep" :direction="isMobile ? 'vertical' : 'horizontal'" align-center finish-status="success" class="custom-steps">
          <el-step title="拆解绑定" description="扫码绑定门ID" :icon="Edit" />
          <el-step title="物料装配" description="人工亮灯确认" :icon="Tools" />
          <el-step title="异常处理" description="自动挂起/重排" :icon="Warning" />
          <el-step title="上电自检" description="合格信号回传" :icon="CircleCheck" />
          <el-step title="Top5 缓存" description="智能计算停靠" :icon="Sort" />
        </el-steps>

        <div class="flow-control">
          <el-card class="step-detail-card" shadow="never">
            <div class="step-content">
              <div v-if="activeStep === 0">
                <h4><el-tag size="large" effect="dark">Step 1</el-tag> 拆解与身份绑定</h4>
                <p>核心逻辑：操作员扫码 -> 数据传PLC -> U-RCS生成唯一追踪Token。解决痛点：源头防止车门与车身不匹配。</p>
              </div>
              <div v-if="activeStep === 1">
                <h4><el-tag type="warning" size="large" effect="dark">Step 2</el-tag> 导轨线装配</h4>
                <p>核心逻辑：AGV运送至固定工位。海康AGV负责长距离，四院AGV负责作业区微调。支持“边走边充”技术。</p>
              </div>
              <div v-if="activeStep === 2">
                <h4><el-tag type="danger" size="large" effect="dark">Step 3</el-tag> 异常熔断机制</h4>
                <p>核心逻辑：一旦人工拍灯（缺料），U-RCS 立即锁定该车任务，防止异常品流向后段，并自动触发队列重算。</p>
              </div>
              <div v-if="activeStep === 3">
                <h4><el-tag type="success" size="large" effect="dark">Step 4</el-tag> 上电自检</h4>
                <p>核心逻辑：检测台信号与AGV联动。只有检测通过（OK信号），AGV才会接到“驶向缓存区”的指令。</p>
              </div>
              <div v-if="activeStep === 4">
                <h4><el-tag size="large" effect="dark">Step 5</el-tag> 智能入库排序</h4>
                <p>核心逻辑：扫描5个缓冲区状态。根据总装线需求，自动计算最优停靠位，确保“先进先出”或“按序出库”。</p>
              </div>
            </div>
            <div class="btn-group">
              <el-button type="primary" size="large" @click="nextStep" round>演示下一步逻辑</el-button>
            </div>
          </el-card>
        </div>
      </div>
    </section>

    <section class="section-container bg-primary">
      <div class="section-title">
        <h2>系统建设价值对比</h2>
      </div>
      <el-row :gutter="40" class="comparison-row">
        <el-col :xs="24" :md="12" class="mb-20">
          <el-card class="compare-card before" shadow="hover">
            <template #header>
              <div class="card-header-red">
                <el-icon><CloseBold /></el-icon> 改造前：各自为政
              </div>
            </template>
            <ul>
              <li><strong>多头管理：</strong> 4套系统切来切去，数据不通。</li>
              <li><strong>队列错乱：</strong> 10车少1车，物理与数据脱节。</li>
              <li><strong>效率低下：</strong> 路口死等，无全局最优规划。</li>
              <li><strong>人工繁琐：</strong> 异常车需人工手动记录并调整。</li>
            </ul>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card class="compare-card after" shadow="hover">
            <template #header>
              <div class="card-header-green">
                <el-icon><Select /></el-icon> 改造后：U-RCS 统一接管
              </div>
            </template>
            <ul>
              <li><strong>统一入口：</strong> 一个平台管理所有异构AGV。</li>
              <li><strong>影子队列：</strong> 实时纠偏，100% 队列准确率。</li>
              <li><strong>智能路权：</strong> 动态交通锁，通行效率提升30%。</li>
              <li><strong>自动闭环：</strong> 异常自动挂起，补料后自动复位。</li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <footer class="footer">
      <p>© 2026 U-RCS Project Team | 赋能汽车产线数字化转型</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  MapLocation, List, Guide, Van,
  Edit, Tools, Warning, CircleCheck, Sort,
  CloseBold, Select, Bottom, Cpu
} from '@element-plus/icons-vue'

// 步骤演示逻辑
const activeStep = ref(0)
const nextStep = () => {
  if (activeStep.value++ > 3) activeStep.value = 0
}

// 移动端检测
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ========================================
  1. CSS 变量定义 (主题引擎)
  ========================================
  默认定义亮色主题，通过 html.dark 覆盖暗色主题
*/
:root {
  /* 亮色主题默认值 */
  --urcs-bg-primary: #ffffff;
  --urcs-bg-secondary: #f5f7fa;
  --urcs-text-main: #303133;
  --urcs-text-sub: #606266;
  --urcs-border: #ebeef5;
  --urcs-card-bg: #ffffff;
  --urcs-north-bg: #eef1f6;
  --urcs-north-border: #b3c0d1;
  --urcs-south-bg: #f0f2f5;
  --urcs-hero-bg: linear-gradient(135deg, #1c2438 0%, #2d3a4b 100%);
  --urcs-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* 暗色主题 (当 html 标签有 class="dark" 时生效)
  这是对接 Element Plus 全局暗色模式的关键
*/
html.dark .product-showcase {
  --urcs-bg-primary: #141414;        /* 极深背景 */
  --urcs-bg-secondary: #000000;      /* 纯黑背景 */
  --urcs-text-main: #E5EAF3;         /* 高亮白 */
  --urcs-text-sub: #A3A6AD;          /* 次级灰 */
  --urcs-border: #363637;            /* 深色边框 */
  --urcs-card-bg: #1D1E1F;           /* 卡片深灰 */
  --urcs-north-bg: #1D1E1F;          /* 北向层深灰 */
  --urcs-north-border: #4C4D4F;      /* 边框提亮 */
  --urcs-south-bg: #1D1E1F;          /* 南向层深灰 */
  --urcs-hero-bg: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  --urcs-shadow: 0 4px 12px rgba(0,0,0,0.3); /* 加深阴影 */
}

/* 应用变量 */
.product-showcase {
  background-color: var(--urcs-bg-primary);
  color: var(--urcs-text-main);
  transition: background-color 0.3s, color 0.3s;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.bg-primary { background-color: var(--urcs-bg-primary); }
.bg-secondary { background-color: var(--urcs-bg-secondary); }
.text-white { color: #fff !important; }

/* 通用容器 */
.section-container { padding: 80px 8%; }

/* ========================================
  2. Hero Section (头部)
  ========================================
*/
.hero-section {
  height: 50vh;
  min-height: 450px;
  background: var(--urcs-hero-bg);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content h1 {
  font-size: 3.5rem; /* 大字体 */
  margin-bottom: 24px;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.hero-content .subtitle {
  font-size: 1.6rem;
  opacity: 0.9;
  margin-bottom: 40px;
  font-weight: 300;
}

.tags-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}
.hero-tag { font-size: 1.1rem !important; padding: 22px 30px !important; }

/* ========================================
  3. 系统架构图 (核心视觉)
  ========================================
*/
.section-title { text-align: center; margin-bottom: 60px; }
.section-title h2 { font-size: 2.8rem; margin-bottom: 15px; color: var(--urcs-text-main); }
.section-title p { color: var(--urcs-text-sub); font-size: 1.3rem; }

.architecture-diagram { max-width: 1400px; margin: 0 auto; }

/* 北向层 */
.layer {
  border-radius: 12px;
  padding: 30px;
  position: relative;
  margin-bottom: 10px;
  border: 1px solid transparent; /* 预留边框位置 */
}

.layer-label {
  position: absolute;
  top: -16px;
  left: 30px;
  background: #303133;
  color: white;
  padding: 6px 18px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  z-index: 2;
}
/* 暗色模式下标签颜色微调 */
html.dark .layer-label { background: #409EFF; }

.north-layer {
  background: var(--urcs-north-bg);
  border: 2px dashed var(--urcs-north-border);
}

.layer-content-wrapper, .device-group-wrapper {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
}

/* 模块卡片 (北向) */
.module {
  background: var(--urcs-card-bg);
  color: var(--urcs-text-main);
  padding: 20px 40px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: var(--urcs-shadow);
  border: 1px solid var(--urcs-border);
  flex: 1;
  min-width: 200px;
  text-align: center;
}

/* 核心层 (保持蓝色调，但增加质感) */
.core-layer {
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
  color: white;
  padding: 60px 30px;
  box-shadow: 0 10px 30px rgba(64, 158, 255, 0.3);
  margin: 20px 0;
}
/* 暗色模式下核心层颜色加深一点，避免太刺眼 */
html.dark .core-layer {
  background: linear-gradient(135deg, #2b7bc4 0%, #1e63a3 100%);
  border: 1px solid #409eff;
}

.feature-box {
  background: rgba(255,255,255,0.15);
  padding: 30px 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.3);
  height: 100%;
  backdrop-filter: blur(5px);
  transition: transform 0.3s;
}
.feature-box:hover { transform: translateY(-5px); background: rgba(255,255,255,0.25); }
.feature-box h3 { margin: 15px 0 10px; font-size: 1.4rem; color: #fff; }
.feature-box p { font-size: 1rem; opacity: 0.95; line-height: 1.5; color: #fff; }

/* 南向层 */
.south-layer {
  background: var(--urcs-south-bg);
  border-top: 4px solid #67c23a;
  border-left: 1px solid var(--urcs-border);
  border-right: 1px solid var(--urcs-border);
  border-bottom: 1px solid var(--urcs-border);
}

.device-card {
  flex: 1;
  background: var(--urcs-card-bg);
  padding: 25px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid var(--urcs-border);
  min-width: 200px;
  box-shadow: var(--urcs-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s;
}
.device-card:hover { transform: translateY(-3px); }

/* 品牌色条 */
.device-card.hik { border-top: 5px solid #409eff; }
.device-card.siyuan { border-top: 5px solid #67c23a; }
.device-card.self { border-top: 5px solid #e6a23c; }

.device-card .brand { font-size: 1.3rem; font-weight: bold; margin: 10px 0 5px; color: var(--urcs-text-main); }
.device-card .role { font-size: 1rem; color: var(--urcs-text-sub); }

.connector-arrow {
  text-align: center;
  font-weight: bold;
  color: var(--urcs-text-sub);
  margin: 15px 0;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

/* ========================================
  4. 业务流程 & 对比卡片
  ========================================
*/
.process-flow { max-width: 1200px; margin: 0 auto; }

/* 步骤详情卡片 */
.step-detail-card {
  margin-top: 40px;
  text-align: center;
  background-color: var(--urcs-card-bg);
  border: 1px solid var(--urcs-border);
  color: var(--urcs-text-main);
}
/* 强行覆盖 Element Card 样式以适配暗色 */
html.dark .step-detail-card { background-color: #1D1E1F; border-color: #363637; }

.step-detail-card h4 { font-size: 1.8rem; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 15px;}
.step-detail-card p { font-size: 1.3rem; color: var(--urcs-text-sub); line-height: 1.8; max-width: 800px; margin: 0 auto; }
.btn-group { margin-top: 30px; }

/* 对比卡片 */
.compare-card {
  height: 100%;
  background-color: var(--urcs-card-bg);
  border: 1px solid var(--urcs-border);
  color: var(--urcs-text-main);
}
/* 暗色模式特定处理 */
html.dark .compare-card { background-color: #1D1E1F; border-color: #363637; }

.card-header-red { color: #f56c6c; font-weight: bold; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;}
.card-header-green { color: #67c23a; font-weight: bold; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;}
.compare-card ul { padding-left: 20px; line-height: 2.2; color: var(--urcs-text-sub); font-size: 1.15rem; }

/* ========================================
  5. 移动端适配
  ========================================
*/
@media (max-width: 768px) {
  .section-container { padding: 50px 5%; }
  .hero-content h1 { font-size: 2.2rem; }
  .hero-content .subtitle { font-size: 1.2rem; }
  .section-title h2 { font-size: 2rem; }

  .layer-content-wrapper, .device-group-wrapper { flex-direction: column; }
  .module, .device-card { width: 100%; margin-bottom: 10px; }

  .custom-steps { height: auto; min-height: 400px; }
  .mb-20 { margin-bottom: 20px; }
}

.footer {
  text-align: center;
  padding: 30px;
  background: #141414; /* 永远深色 */
  color: #909399;
  font-size: 1rem;
  border-top: 1px solid #1f1f1f;
}
</style>