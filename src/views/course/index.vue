<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex flex-col">
    <!-- 顶部标题区 -->
    <section class="flex-1 flex flex-col justify-center items-center text-center px-6 py-20">
      <h1 class="text-5xl font-extrabold tracking-wide mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
        AI赋能个人：能力革命课
      </h1>
      <p class="text-lg text-gray-300 max-w-2xl">
        不是教你用几个工具，而是重构你的个人能力体系
      </p>
    </section>

    <!-- 中部价值主张 -->
    <section class="flex-1 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6 py-12">
      <div class="flex items-start space-x-4">
        <el-icon class="text-blue-400 text-3xl"><IEpRocket /></el-icon>
        <div>
          <h3 class="text-xl font-bold mb-2">进化路径</h3>
          <p class="text-gray-300">从工具使用者 → AI协作者 → 能力驱动者</p>
        </div>
      </div>

      <div class="flex items-start space-x-4">
        <el-icon class="text-green-400 text-3xl"><IEpTarget /></el-icon>
        <div>
          <h3 class="text-xl font-bold mb-2">能力框架</h3>
          <p class="text-gray-300">思维 × 表达 × 理解 × 沟通 × 数字素养</p>
        </div>
      </div>

      <div class="flex items-start space-x-4">
        <el-icon class="text-yellow-400 text-3xl"><IEpTrophy /></el-icon>
        <div>
          <h3 class="text-xl font-bold mb-2">两大实战专题</h3>
          <p class="text-gray-300">AI重塑办公室工作 ｜ AI重塑软件生产</p>
        </div>
      </div>

      <div class="flex items-start space-x-4">
        <el-icon class="text-pink-400 text-3xl"><IEpRefresh /></el-icon>
        <div>
          <h3 class="text-xl font-bold mb-2">方法论</h3>
          <p class="text-gray-300">重做一切：合理粒度 × 清晰表达 × 评测闭环</p>
        </div>
      </div>
    </section>

    <!-- 底部行动区 -->
    <section class="bg-gray-800 py-12 px-6">
      <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 text-center">
        <div class="p-6 border border-gray-700 rounded-lg hover:border-blue-500 transition">
          <h4 class="text-lg font-semibold mb-2">AI工作流蓝图</h4>
          <p class="text-gray-400">打造属于你的AI驱动个人操作系统</p>
        </div>
        <div class="p-6 border border-gray-700 rounded-lg hover:border-green-500 transition">
          <h4 class="text-lg font-semibold mb-2">Prompt模板库</h4>
          <p class="text-gray-400">即用即改，快速上手AI实践</p>
        </div>
        <div class="p-6 border border-gray-700 rounded-lg hover:border-yellow-500 transition">
          <h4 class="text-lg font-semibold mb-2">双项目认证</h4>
          <p class="text-gray-400">办公+软件生产双实战，成果可见</p>
        </div>
      </div>

      <!-- CTA按钮 -->
      <div class="flex justify-center mt-10">
        <el-button
            size="large"
            type="primary"
            class="!bg-gradient-to-r !from-blue-500 !to-indigo-600 !border-0 !px-10 !py-5 text-lg font-bold"
        >
          立即加入 | 抢占AI时代先机
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ElIcon } from 'element-plus'
import { Promotion as IEpRocket, Aim as IEpTarget, Trophy as IEpTrophy, Refresh as IEpRefresh } from '@element-plus/icons-vue'
</script>
