// Chrome DevTools MCP 调试范例
// 这个脚本展示了如何使用 MCP 协议与 Chrome 浏览器进行交互

// 导入必要的模块
import { createMCPConnection } from 'chrome-devtools-mcp/client';

async function debugExample() {
  try {
    // 连接到 Chrome DevTools MCP 服务器
    const connection = await createMCPConnection({
      serverUrl: 'http://localhost:8081', // MCP 服务器地址
    });

    console.log('✅ 成功连接到 Chrome DevTools MCP 服务器');

    // 1. 打开目标网页
    await connection.sendCommand('Page.navigate', {
      url: 'http://localhost:8085/'
    });
    console.log('✅ 已导航到 http://localhost:8085/');

    // 2. 等待页面加载完成
    await connection.waitForEvent('Page.loadEventFired');
    console.log('✅ 页面加载完成');

    // 3. 检查页面标题
    const titleResult = await connection.sendCommand('Runtime.evaluate', {
      expression: 'document.title'
    });
    console.log('📄 页面标题:', titleResult.result.value);

    // 4. 获取页面 DOM 结构
    const domResult = await connection.sendCommand('DOM.getDocument');
    console.log('🌳 DOM 根节点:', domResult.root.nodeId);

    // 5. 执行 JavaScript 代码获取 Vue 实例
    const vueResult = await connection.sendCommand('Runtime.evaluate', {
      expression: 'window.__VUE_DEVTOOLS_GLOBAL_HOOK__ ? Object.keys(window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps) : []'
    });
    console.log('⚡ Vue 实例:', vueResult.result.value);

    // 6. 检查页面性能
    const performanceResult = await connection.sendCommand('Runtime.evaluate', {
      expression: 'JSON.stringify(performance.timing)'
    });
    console.log('⏱️  性能数据:', JSON.parse(performanceResult.result.value));

    // 7. 截图页面
    const screenshotResult = await connection.sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 80
    });
    console.log('📸 截图已获取，大小:', screenshotResult.data.length, 'bytes');

    // 8. 检查网络请求
    await connection.sendCommand('Network.enable');
    connection.on('Network.requestWillBeSent', (event) => {
      console.log('🌐 网络请求:', event.request.url);
    });

    // 9. 模拟点击事件
    const buttonResult = await connection.sendCommand('DOM.querySelector', {
      nodeId: domResult.root.nodeId,
      selector: 'button'
    });
    if (buttonResult.nodeId) {
      await connection.sendCommand('DOM.dispatchEvent', {
        nodeId: buttonResult.nodeId,
        type: 'click',
        clickCount: 1
      });
      console.log('🖱️  模拟点击了按钮');
    }

    // 10. 关闭连接
    await connection.close();
    console.log('👋 已关闭 MCP 连接');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 运行调试范例
debugExample();

// 提示信息
console.log('🚀 Chrome DevTools MCP 调试范例已启动');
console.log('📚 功能包括:');
console.log('   1. 连接到 MCP 服务器');
console.log('   2. 导航到目标网页');
console.log('   3. 检查页面标题');
console.log('   4. 获取 DOM 结构');
console.log('   5. 检查 Vue 实例');
console.log('   6. 获取性能数据');
console.log('   7. 页面截图');
console.log('   8. 监控网络请求');
console.log('   9. 模拟点击事件');
console.log('   10. 关闭连接');
