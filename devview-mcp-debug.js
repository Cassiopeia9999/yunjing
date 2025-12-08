// DevView.vue 组件的 Chrome DevTools MCP 调试指南
// 这个脚本展示了如何使用 MCP 协议调试 DevView.vue 组件

import { createMCPConnection } from 'chrome-devtools-mcp/client';

async function debugDevView() {
  try {
    // 连接到 Chrome DevTools MCP 服务器
    const connection = await createMCPConnection({
      serverUrl: 'http://localhost:8081', // MCP 服务器地址
    });

    console.log('✅ 成功连接到 Chrome DevTools MCP 服务器');

    // 1. 打开 DevView 页面
    await connection.sendCommand('Page.navigate', {
      url: 'http://localhost:8085/#/manage/dev' // 根据实际路由调整
    });
    console.log('✅ 已导航到 DevView 页面');

    // 2. 等待页面加载完成
    await connection.waitForEvent('Page.loadEventFired');
    console.log('✅ 页面加载完成');

    // 3. 调试场景 1: 检查组件数据加载
    console.log('\n🔍 调试场景 1: 检查组件数据加载');
    
    // 检查 baseList 数据
    const baseListResult = await connection.sendCommand('Runtime.evaluate', {
      expression: 'document.querySelector("[data-testid=base-selector]") ? "Base selector found" : "Base selector not found"'
    });
    console.log('📋 Base 选择器状态:', baseListResult.result.value);

    // 4. 调试场景 2: 检查设备数据
    console.log('\n🔍 调试场景 2: 检查设备数据');
    
    // 执行 JavaScript 代码获取设备数据
    const deviceDataResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 查找 Vue 应用实例
        const app = Array.from(document.querySelectorAll('*')).find(el => el.__vue_app__);
        if (app && app.__vue_app__) {
          // 获取组件实例
          const devViewComponent = app.__vue_app__._instance.subTree.component;
          if (devViewComponent) {
            // 获取设备数据
            return {
              deviceId: devViewComponent.props.deviceId,
              baseId: devViewComponent.props.baseId,
              unitId: devViewComponent.props.unitId
            };
          }
        }
        return null;
      `
    });
    console.log('📱 设备数据:', deviceDataResult.result.value);

    // 5. 调试场景 3: 检查特征值数据
    console.log('\n🔍 调试场景 3: 检查特征值数据');
    
    // 检查特征值卡片
    const featureCardsResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 计算特征值卡片数量
        const featureCards = document.querySelectorAll('.feat-card');
        featureCards.length;
      `
    });
    console.log('📊 特征值卡片数量:', featureCardsResult.result.value);

    // 6. 调试场景 4: 检查图表渲染
    console.log('\n🔍 调试场景 4: 检查图表渲染');
    
    // 检查概率趋势图
    const chartResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 检查 ECharts 实例
        const chartContainer = document.querySelector('[ref=elProb]');
        chartContainer ? 'Chart container found' : 'Chart container not found';
      `
    });
    console.log('📈 图表容器状态:', chartResult.result.value);

    // 7. 调试场景 5: 性能监控
    console.log('\n🔍 调试场景 5: 性能监控');
    
    // 获取组件渲染时间
    const renderTimeResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 计算组件渲染时间
        performance.measure("DevView Render", "navigationStart", "loadEventEnd");
        const measure = performance.getEntriesByName("DevView Render")[0];
        measure.duration;
      `
    });
    console.log('⏱️  组件渲染时间:', renderTimeResult.result.value, 'ms');

    // 8. 调试场景 6: 模拟用户交互
    console.log('\n🔍 调试场景 6: 模拟用户交互');
    
    // 模拟点击 "开始故障诊断" 按钮
    const clickResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 查找并点击 "开始故障诊断" 按钮
        const diagnoseBtn = document.querySelector('button:contains("开始故障诊断")');
        if (diagnoseBtn) {
          diagnoseBtn.click();
          return "Clicked diagnose button";
        }
        return "Diagnose button not found";
      `
    });
    console.log('🖱️  用户交互模拟:', clickResult.result.value);

    // 9. 调试场景 7: 检查网络请求
    console.log('\n🔍 调试场景 7: 检查网络请求');
    
    // 启用网络监控
    await connection.sendCommand('Network.enable');
    
    // 监听网络请求
    connection.on('Network.requestWillBeSent', (event) => {
      if (event.request.url.includes('/api/')) {
        console.log('🌐 API 请求:', event.request.url);
      }
    });
    
    // 触发数据刷新
    await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 触发数据刷新
        const refreshBtn = document.querySelector('button:contains("刷新")');
        if (refreshBtn) {
          refreshBtn.click();
        }
      `
    });
    
    // 等待 2 秒，观察网络请求
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 10. 调试场景 8: 检查组件状态
    console.log('\n🔍 调试场景 8: 检查组件状态');
    
    // 检查组件的 loading 状态
    const loadingResult = await connection.sendCommand('Runtime.evaluate', {
      expression: `
        // 检查 loading 状态
        const skeleton = document.querySelector('.el-skeleton');
        skeleton ? 'Loading skeleton visible' : 'Loading skeleton hidden';
      `
    });
    console.log('⏳ 组件加载状态:', loadingResult.result.value);

    // 11. 调试场景 9: 截图组件
    console.log('\n🔍 调试场景 9: 截图组件');
    
    // 截图 DevView 组件
    const screenshotResult = await connection.sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 80,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
        scale: 1
      }
    });
    console.log('📸 DevView 组件截图已获取，大小:', screenshotResult.data.length, 'bytes');

    // 12. 关闭连接
    await connection.close();
    console.log('\n👋 已关闭 MCP 连接');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 运行调试
console.log('🚀 开始调试 DevView.vue 组件');
debugDevView();

// DevView.vue 组件调试要点
console.log('\n📚 DevView.vue 组件调试要点:');
console.log('1. 数据加载链路: ensureBase() → ensureUnit() → ensureDevice() → loadDeviceDetails()');
console.log('2. 关键状态: baseId, unitId, deviceId, loading, data');
console.log('3. 计算属性: recordGroups, records, featureAllSorted, featureCards');
console.log('4. 图表渲染: renderCharts() 函数，使用 ECharts');
console.log('5. 用户交互: 选择器变化、按钮点击、抽屉/弹窗操作');
console.log('6. 特征值配置: FeatureConfigDialog 组件交互');
console.log('7. 性能监控: 页面加载时间、数据请求时间、图表渲染时间');

// 如何在组件中添加 MCP 调试代码
console.log('\n💡 如何在组件中添加 MCP 调试代码:');
console.log('1. 在组件的 onMounted 钩子中添加调试代码');
console.log('2. 使用 console.log() 输出关键数据');
console.log('3. 添加 data-testid 属性便于 MCP 定位元素');
console.log('4. 使用 Vue DevTools 配合 MCP 进行调试');
console.log('5. 添加性能监控代码，如 performance.measure()');
