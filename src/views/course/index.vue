<!DOCTYPE html>
<html lang="zh-CN" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI自动化实战课程 - 释放你的生产力</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet">

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Noto Sans SC"', 'sans-serif'],
          },
          colors: {
            brand: {
              dark: '#0f172a',
              primary: '#8b5cf6',
              secondary: '#ec4899',
              accent: '#06b6d4'
            }
          },
          animation: {
            'float': 'float 6s ease-in-out infinite',
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'blob': 'blob 7s infinite',
          },
          keyframes: {
            float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-20px)' },
            },
            blob: {
              '0%': { transform: 'translate(0px, 0px) scale(1)' },
              '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
              '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
              '100%': { transform: 'translate(0px, 0px) scale(1)' },
            }
          }
        }
      }
    }
  </script>

  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      overflow-x: hidden;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-track {
      background: #1e293b;
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #8b5cf6, #ec4899);
      border-radius: 5px;
    }

    /* Glassmorphism Utilities */
    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .glass-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      transition: all 0.3s ease;
    }

    .glass-card:hover {
      transform: translateY(-5px);
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow: 0 15px 40px -10px rgba(139, 92, 246, 0.3);
    }

    /* Text Gradients */
    .text-gradient {
      background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Animation Classes */
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease-out;
    }

    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }

    /* Timeline */
    .timeline-line {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #8b5cf6, #ec4899);
      border-radius: 2px;
      z-index: 0;
    }

    @media (max-width: 768px) {
      .timeline-line {
        left: 20px;
      }
    }
  </style>
</head>
<body>

<div id="app">
  <!-- Scroll Progress Bar -->
  <div class="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 z-50 transition-all duration-100" :style="{ width: scrollProgress + '%' }"></div>

  <!-- Navigation -->
  <nav class="fixed w-full z-40 transition-all duration-300" :class="{'glass py-3': isScrolled, 'py-6 bg-transparent': !isScrolled}">
    <div class="container mx-auto px-6 flex justify-between items-center">
      <div class="text-2xl font-black tracking-tighter flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <i class="fa-solid fa-robot text-white text-sm"></i>
        </div>
        <span class="text-white">AI<span class="text-purple-400">Flow</span></span>
      </div>

      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center space-x-8">
        <a href="#features" class="text-slate-300 hover:text-white transition-colors">核心特色</a>
        <a href="#curriculum" class="text-slate-300 hover:text-white transition-colors">课程大纲</a>
        <a href="#testimonials" class="text-slate-300 hover:text-white transition-colors">学员评价</a>
        <a href="#faq" class="text-slate-300 hover:text-white transition-colors">常见问题</a>
      </div>

      <div class="hidden md:block">
        <button @click="scrollToPricing" class="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105">
          立即加入
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-white text-2xl">
        <i :class="mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
      </button>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div v-if="mobileMenuOpen" class="md:hidden absolute top-full left-0 w-full glass border-t border-slate-700 p-6 flex flex-col space-y-4 animate-fade-in">
      <a href="#features" @click="mobileMenuOpen = false" class="text-slate-300 hover:text-white">核心特色</a>
      <a href="#curriculum" @click="mobileMenuOpen = false" class="text-slate-300 hover:text-white">课程大纲</a>
      <a href="#testimonials" @click="mobileMenuOpen = false" class="text-slate-300 hover:text-white">学员评价</a>
      <button @click="scrollToPricing(); mobileMenuOpen = false" class="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
        立即加入
      </button>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
    <!-- Animated Background Blobs -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

    <div class="container mx-auto px-6 relative z-10 text-center">
      <div class="inline-block mb-4 px-4 py-1 rounded-full glass border border-purple-500/30 text-purple-300 text-sm font-medium animate-float">
        🚀 AI 自动化实战训练营 v3.0
      </div>

      <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight">
        你还在让AI当<br>
        <span class="text-gradient">"聊天工具"</span> 用吗?
      </h1>

      <p class="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
        别再只用 ChatGPT 问简单问题了。掌握 <span class="text-white font-bold">AI 自动化核心方法论</span>，构建你的专属数字员工，让工作效率实现 <span class="text-cyan-400 font-bold">10倍</span> 指数级增长。
      </p>

      <div class="flex flex-col md:flex-row justify-center items-center gap-6 mb-16">
        <button @click="scrollToPricing" class="group relative px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]">
          <span class="relative z-10 group-hover:text-purple-700 transition-colors">开始你的自动化之旅 <i class="fa-solid fa-arrow-right ml-2"></i></span>
        </button>
        <div class="flex items-center gap-2 text-slate-400">
          <div class="flex -space-x-2">
            <img v-for="i in 4" :key="i" :src="`https://i.pravatar.cc/100?img=${i+10}`" class="w-10 h-10 rounded-full border-2 border-slate-900" alt="Student">
          </div>
          <span class="text-sm">2,000+ 学员已加入</span>
        </div>
      </div>

      <!-- Animated Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto glass p-8 rounded-2xl">
        <div v-for="(stat, index) in stats" :key="index" class="text-center">
          <div class="text-3xl md:text-4xl font-bold text-white mb-1">{{ stat.current }}{{ stat.suffix }}</div>
          <div class="text-sm text-slate-400">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Problem Section -->
  <section class="py-20 bg-slate-900 relative">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16 reveal">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">你是否面临这些 <span class="text-pink-500">痛点</span>?</h2>
        <p class="text-slate-400">大多数人使用AI的方式，其实都错了。</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="glass-card p-8 rounded-2xl border-l-4 border-pink-500 reveal">
          <div class="text-4xl mb-4">😫</div>
          <h3 class="text-xl font-bold mb-3 text-white">重复劳动无休止</h3>
          <p class="text-slate-400">每天花费大量时间在整理表格、回复邮件、搬运数据上，没有时间思考核心业务。</p>
        </div>
        <div class="glass-card p-8 rounded-2xl border-l-4 border-purple-500 reveal" style="transition-delay: 100ms;">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-xl font-bold mb-3 text-white">只会简单提问</h3>
          <p class="text-slate-400">把AI当搜索引擎用，不知道如何让AI处理复杂任务，Prompt写出来总是不如意。</p>
        </div>
        <div class="glass-card p-8 rounded-2xl border-l-4 border-cyan-500 reveal" style="transition-delay: 200ms;">
          <div class="text-4xl mb-4">🧩</div>
          <h3 class="text-xl font-bold mb-3 text-white">工具碎片化</h3>
          <p class="text-slate-400">听说过很多AI工具，但不知道如何将它们串联起来，形成真正的工作流。</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Unique Value Props -->
  <section id="features" class="py-20 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="text-center mb-16 reveal">
        <span class="text-cyan-400 font-bold tracking-wider uppercase text-sm">Why Us?</span>
        <h2 class="text-3xl md:text-5xl font-bold mt-2 mb-4">不仅仅是课程，更是 <span class="text-gradient">思维升级</span></h2>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(feature, index) in features" :key="index" class="glass-card p-6 rounded-2xl hover:bg-slate-800/80 transition-all reveal" :style="{ transitionDelay: index * 100 + 'ms' }">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-6 shadow-lg border border-slate-600">
            <i :class="feature.icon" class="text-2xl text-purple-400"></i>
          </div>
          <h3 class="text-lg font-bold text-white mb-3">{{ feature.title }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 Layers Visualization -->
  <section class="py-24 bg-slate-900">
    <div class="container mx-auto px-6">
      <div class="flex flex-col lg:flex-row items-center gap-16">
        <div class="lg:w-1/2 reveal">
          <h2 class="text-4xl font-bold mb-6">三层进阶体系<br>打造你的 <span class="text-gradient">AI 竞争力</span></h2>
          <p class="text-slate-400 mb-8 text-lg">我们不教过时的工具操作，我们教你驾驭AI的底层逻辑。</p>

          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-bold shrink-0">01</div>
              <div>
                <h4 class="text-xl font-bold text-white mb-1">思维转变 (Mindset)</h4>
                <p class="text-slate-400 text-sm">从"操作者"转变为"指挥官"，学会拆解业务流程。</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-pink-900/50 flex items-center justify-center text-pink-400 font-bold shrink-0">02</div>
              <div>
                <h4 class="text-xl font-bold text-white mb-1">方法掌握 (Method)</h4>
                <p class="text-slate-400 text-sm">掌握结构化Prompt、CoT思维链、RAG知识库搭建。</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">03</div>
              <div>
                <h4 class="text-xl font-bold text-white mb-1">实战能力 (Action)</h4>
                <p class="text-slate-400 text-sm">基于国内可访问平台（Coze/Dify）搭建真实自动化工作流。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:w-1/2 relative reveal">
          <!-- Visual Representation -->
          <div class="relative h-[400px] w-full flex items-center justify-center">
            <div class="absolute w-64 h-64 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>

            <div class="relative z-30 w-64 p-6 glass-card rounded-2xl transform translate-y-0 translate-x-0 border-l-4 border-cyan-400 shadow-2xl">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-white">实战层</span>
                <i class="fa-solid fa-rocket text-cyan-400"></i>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full w-3/4 bg-cyan-400"></div></div>
            </div>

            <div class="absolute z-20 w-72 p-6 glass-card rounded-2xl transform translate-y-16 translate-x-8 border-l-4 border-pink-500 opacity-90">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-white">方法层</span>
                <i class="fa-solid fa-code-branch text-pink-500"></i>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full w-1/2 bg-pink-500"></div></div>
            </div>

            <div class="absolute z-10 w-80 p-6 glass-card rounded-2xl transform translate-y-32 translate-x-16 border-l-4 border-purple-600 opacity-80">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-white">思维层</span>
                <i class="fa-solid fa-brain text-purple-600"></i>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full w-full bg-purple-600"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Curriculum / Roadmap -->
  <section id="curriculum" class="py-20 bg-slate-800 relative overflow-hidden">
    <div class="container mx-auto px-6 relative z-10">
      <div class="text-center mb-16 reveal">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">课程 <span class="text-purple-400">实战路线图</span></h2>
        <p class="text-slate-400">从小白到AI自动化专家的4周旅程</p>
      </div>

      <div class="relative max-w-4xl mx-auto">
        <div class="timeline-line"></div>

        <div v-for="(module, index) in curriculum" :key="index" class="relative mb-12 w-full flex items-center reveal" :class="index % 2 === 0 ? 'justify-start' : 'justify-end'">
          <!-- Dot -->
          <div class="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-4 border-purple-500 z-10 md:block hidden"></div>

          <!-- Card -->
          <div class="w-full md:w-[45%] glass-card p-6 rounded-xl relative" :class="index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'">
            <div class="absolute top-4 right-4 text-5xl opacity-10 font-black text-white">{{ index + 1 }}</div>
            <h3 class="text-xl font-bold text-white mb-2">{{ module.title }}</h3>
            <p class="text-slate-400 text-sm mb-4">{{ module.desc }}</p>
            <ul class="space-y-2">
              <li v-for="(item, i) in module.items" :key="i" class="flex items-center text-sm text-slate-300">
                <i class="fa-solid fa-check text-green-400 mr-2 text-xs"></i> {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Target Audience -->
  <section class="py-20 bg-slate-900">
    <div class="container mx-auto px-6">
      <div class="grid md:grid-cols-2 gap-12">
        <!-- Who is this for -->
        <div class="glass-card p-8 rounded-2xl border border-green-500/30 reveal">
          <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
            <i class="fa-solid fa-circle-check text-green-500 mr-3"></i> 适合人群
          </h3>
          <ul class="space-y-4">
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
              <span><strong>职场白领：</strong>希望摆脱重复报表、文档工作，提早下班。</span>
            </li>
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
              <span><strong>内容创作者：</strong>需要批量生成文案、脚本，构建内容矩阵。</span>
            </li>
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
              <span><strong>创业者/自由职业：</strong>想用AI构建一人公司，降低人力成本。</span>
            </li>
          </ul>
        </div>

        <!-- Who is NOT for -->
        <div class="glass-card p-8 rounded-2xl border border-red-500/30 reveal">
          <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
            <i class="fa-solid fa-circle-xmark text-red-500 mr-3"></i> 不适合人群
          </h3>
          <ul class="space-y-4">
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-xmark text-red-500 mt-1 mr-3"></i>
              <span><strong>寻找"一夜暴富"：</strong>本课程教的是提效工具，不是赚钱偏方。</span>
            </li>
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-xmark text-red-500 mt-1 mr-3"></i>
              <span><strong>完全不愿动手：</strong>只听不练无法掌握自动化技能。</span>
            </li>
            <li class="flex items-start text-slate-300">
              <i class="fa-solid fa-xmark text-red-500 mt-1 mr-3"></i>
              <span><strong>期待AI完全替代人类：</strong>AI是副驾驶，你才是机长。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-20 bg-slate-800 relative">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16 reveal">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">学员 <span class="text-pink-500">真实反馈</span></h2>
        <p class="text-slate-400">看看他们如何通过课程改变工作方式</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="(review, index) in testimonials" :key="index" class="glass-card p-6 rounded-xl reveal" :style="{ transitionDelay: index * 100 + 'ms' }">
          <div class="flex items-center mb-4">
            <div class="text-yellow-400 text-sm">
              <i v-for="star in 5" :key="star" class="fa-solid fa-star"></i>
            </div>
          </div>
          <p class="text-slate-300 mb-6 italic">"{{ review.text }}"</p>
          <div class="flex items-center">
            <img :src="review.avatar" class="w-10 h-10 rounded-full mr-3" alt="Avatar">
            <div>
              <div class="text-white font-bold text-sm">{{ review.name }}</div>
              <div class="text-slate-500 text-xs">{{ review.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section id="pricing" class="py-24 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-slate-900 z-0"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-12 text-center border border-purple-500/50 shadow-[0_0_50px_rgba(139,92,246,0.2)] reveal">

        <!-- Countdown Timer -->
        <div class="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full font-mono font-bold mb-8 animate-pulse">
          <i class="fa-solid fa-clock"></i> 优惠倒计时: {{ countdownDisplay }}
        </div>

        <h2 class="text-4xl md:text-5xl font-black text-white mb-6">
          立即掌握 AI 自动化<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">重塑你的职业生涯</span>
        </h2>

        <div class="flex flex-col md:flex-row justify-center items-end gap-4 mb-8">
          <div class="text-slate-400 text-xl line-through">原价 ¥1,299</div>
          <div class="text-6xl font-black text-white">¥399</div>
          <div class="text-green-400 font-bold mb-2">限时 3 折</div>
        </div>

        <ul class="flex flex-wrap justify-center gap-4 mb-10 text-slate-300">
          <li class="flex items-center"><i class="fa-solid fa-check-circle text-purple-500 mr-2"></i> 永久回放权限</li>
          <li class="flex items-center"><i class="fa-solid fa-check-circle text-purple-500 mr-2"></i> 专属学员社群</li>
          <li class="flex items-center"><i class="fa-solid fa-check-circle text-purple-500 mr-2"></i> 导师1对1答疑</li>
          <li class="flex items-center"><i class="fa-solid fa-check-circle text-purple-500 mr-2"></i> 赠送 Prompt 库</li>
        </ul>

        <button class="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-purple-500/50 mb-6">
          立即报名锁定名额
        </button>

        <div class="text-sm text-slate-500">
          <i class="fa-solid fa-shield-halved mr-1"></i> 30天无理由退款保证
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="py-20 bg-slate-900">
    <div class="container mx-auto px-6 max-w-3xl">
      <h2 class="text-3xl font-bold text-center mb-12">常见问题解答</h2>

      <div class="space-y-4">
        <div v-for="(faq, index) in faqs" :key="index" class="glass-card rounded-xl overflow-hidden reveal">
          <button @click="toggleFaq(index)" class="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none">
            <span class="font-bold text-white">{{ faq.question }}</span>
            <i class="fa-solid transition-transform duration-300" :class="activeFaq === index ? 'fa-minus text-purple-400' : 'fa-plus text-slate-500'"></i>
          </button>
          <div v-show="activeFaq === index" class="px-6 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-4 animate-fade-in">
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-950 py-12 border-t border-slate-800">
    <div class="container mx-auto px-6 text-center">
      <div class="flex justify-center items-center gap-2 mb-6">
        <i class="fa-solid fa-robot text-purple-500 text-2xl"></i>
        <span class="text-2xl font-bold text-white">AIFlow</span>
      </div>
      <div class="flex justify-center gap-6 mb-8">
        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all"><i class="fa-brands fa-weixin"></i></a>
        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all"><i class="fa-brands fa-bilibili"></i></a>
        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all"><i class="fa-brands fa-zhihu"></i></a>
      </div>
      <p class="text-slate-600 text-sm">
        © 2023 AIFlow Automation Course. All rights reserved.<br>
        Designed for the AI Era.
      </p>
    </div>
  </footer>

  <!-- Floating Action Button (Mobile) -->
  <div class="fixed bottom-6 right-6 z-50 md:hidden">
    <button @click="scrollToPricing" class="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg flex items-center justify-center animate-bounce">
      <i class="fa-solid fa-bolt text-xl"></i>
    </button>
  </div>

</div>

<script>
  const { createApp, ref, onMounted, onUnmounted, computed } = Vue;

  createApp({
    setup() {
      const mobileMenuOpen = ref(false);
      const isScrolled = ref(false);
      const scrollProgress = ref(0);
      const activeFaq = ref(0);
      const timeLeft = ref(7200); // 2 hours in seconds

      // Data
      const stats = ref([
        { current: 0, target: 2000, suffix: '+', label: '付费学员' },
        { current: 0, target: 50, suffix: '+', label: '实战案例' },
        { current: 0, target: 98, suffix: '%', label: '好评率' },
        { current: 0, target: 10, suffix: '倍', label: '效率提升' }
      ]);

      const features = [
        { title: '授人以渔', desc: '不只教工具操作，更教底层逻辑。让你在工具迭代中永远保持竞争力。', icon: 'fa-solid fa-lightbulb' },
        { title: '方法论驱动', desc: '独家"AI工作流拆解法"，任何复杂任务都能转化为自动化流程。', icon: 'fa-solid fa-sitemap' },
        { title: '精简案例', desc: '拒绝注水，精选10个高频办公/创作场景，学完即用。', icon: 'fa-solid fa-crop-simple' },
        { title: '国内平台', desc: '基于Coze/Dify等国内可无障碍访问平台教学，无需魔法。', icon: 'fa-solid fa-server' }
      ];

      const curriculum = [
        { title: '第一周：AI思维重塑与Prompt工程', desc: '打破对AI的固有认知，掌握结构化提示词编写技巧。', items: ['AI底层原理通俗解构', '结构化Prompt编写框架', 'ChatGPT/Claude/文心一言横向对比'] },
        { title: '第二周：自动化工作流基础', desc: '认识自动化工具，搭建你的第一个Bot。', items: ['Coze/Dify 平台入门', '工作流节点与逻辑控制', '实战：搭建一个自动周报生成器'] },
        { title: '第三周：知识库与RAG应用', desc: '让AI拥有你的私有知识，打造专属专家。', items: ['RAG技术原理解析', '数据清洗与知识库上传', '实战：搭建企业级客服机器人'] },
        { title: '第四周：API对接与多Agent协作', desc: '连接外部世界，实现真正的全自动。', items: ['API调用与Webhook', '多Agent协作模式', '实战：全自动自媒体内容流水线'] }
      ];

      const testimonials = [
        { name: '李明', role: '电商运营总监', text: '以前写商品文案要一下午，现在用课程里的工作流，10分钟生成50条高质量文案，太震撼了！', avatar: 'https://i.pravatar.cc/100?img=11' },
        { name: 'Sarah', role: '自由撰稿人', text: '不仅仅是省时间，更重要的是帮我拓展了思路。我现在一个人就是一个团队。', avatar: 'https://i.pravatar.cc/100?img=5' },
        { name: '张伟', role: '行政主管', text: '完全没有编程基础也能学会，老师讲得非常通俗易懂，强烈推荐！', avatar: 'https://i.pravatar.cc/100?img=3' }
      ];

      const faqs = [
        { question: '没有编程基础可以学吗？', answer: '完全可以。本课程专为非技术人员设计，使用低代码/无代码平台（如Coze），通过拖拽连线即可实现自动化，无需写代码。' },
        { question: '课程需要购买额外的软件会员吗？', answer: '我们主要使用免费或有免费额度的国内平台（如字节跳动Coze），课程费用已包含教学内容，工具成本几乎为零。' },
        { question: '学完之后有问题可以问谁？', answer: '报名后会邀请您加入VIP学员群，助教和老师会在群内答疑，同时您可以与其他同学交流心得。' },
        { question: '课程有效期是多久？', answer: '课程内容永久有效，您可以随时回看。且我们会根据AI技术发展不定期更新课程内容。' }
      ];

      // Computed
      const countdownDisplay = computed(() => {
        const h = Math.floor(timeLeft.value / 3600);
        const m = Math.floor((timeLeft.value % 3600) / 60);
        const s = timeLeft.value % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      });

      // Methods
      const handleScroll = () => {
        isScrolled.value = window.scrollY > 50;
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        scrollProgress.value = (winScroll / height) * 100;
      };

      const scrollToPricing = () => {
        document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
      };

      const toggleFaq = (index) => {
        activeFaq.value = activeFaq.value === index ? -1 : index;
      };

      const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          obj.current = Math.floor(progress * (end - start) + start);
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      };

      // Lifecycle
      onMounted(() => {
        window.addEventListener('scroll', handleScroll);

        // Countdown Timer
        setInterval(() => {
          if (timeLeft.value > 0) timeLeft.value--;
        }, 1000);

        // Intersection Observer for Animations
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');

              // Trigger number animation if it's the stats section
              if(entry.target.querySelector('.text-3xl') && stats.value[0].current === 0) {
                stats.value.forEach(stat => {
                  animateValue(stat, 0, stat.target, 2000);
                });
              }
            }
          });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        // Observe stats container specifically
        const statsContainer = document.querySelector('.grid.grid-cols-2');
        if(statsContainer) observer.observe(statsContainer);
      });

      onUnmounted(() => {
        window.removeEventListener('scroll', handleScroll);
      });

      return {
        mobileMenuOpen,
        isScrolled,
        scrollProgress,
        features,
        curriculum,
        testimonials,
        faqs,
        activeFaq,
        toggleFaq,
        scrollToPricing,
        countdownDisplay,
        stats
      };
    }
  }).mount('#app');
</script>
</body>
</html>