// 简单的Chrome DevTools MCP测试脚本
// 使用npx直接运行，避免本地安装问题

console.log('🚀 开始测试Chrome DevTools MCP');
console.log('📋 测试内容：');
console.log('1. 检查MCP服务器状态');
console.log('2. 检查开发服务器状态');
console.log('3. 检查Chrome远程调试状态');

const http = require('http');

// 检查URL是否可访问
async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ status: res.statusCode, url });
    }).on('error', (err) => {
      resolve({ status: 'error', url, error: err.message });
    });
  });
}

async function runTests() {
  console.log('\n🔍 开始测试...');
  
  // 测试1：检查MCP服务器状态
  console.log('\n1. 检查MCP服务器状态...');
  const mcpResult = await checkUrl('http://localhost:8081/');
  if (mcpResult.status === 200) {
    console.log('✅ MCP服务器运行正常：http://localhost:8081/');
  } else {
    console.log('❌ MCP服务器可能未运行：', mcpResult.error);
  }
  
  // 测试2：检查开发服务器状态
  console.log('\n2. 检查开发服务器状态...');
  const devResult = await checkUrl('http://localhost:8085/');
  if (devResult.status === 200) {
    console.log('✅ 开发服务器运行正常：http://localhost:8085/');
  } else {
    console.log('❌ 开发服务器可能未运行：', devResult.error);
  }
  
  // 测试3：检查Chrome远程调试状态
  console.log('\n3. 检查Chrome远程调试状态...');
  const chromeResult = await checkUrl('http://localhost:9222/');
  if (chromeResult.status === 200) {
    console.log('✅ Chrome远程调试运行正常：http://localhost:9222/');
  } else {
    console.log('❌ Chrome远程调试可能未运行：', chromeResult.error);
  }
  
  // 测试4：检查调试文件
  console.log('\n4. 检查调试文件...');
  const fs = require('fs');
  const debugFiles = [
    'mcp-debug-example.js',
    'mcp-demo.html',
    'devview-mcp-debug.js'
  ];
  
  debugFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ 调试文件存在：${file}`);
    } else {
      console.log(`❌ 调试文件不存在：${file}`);
    }
  });
  
  console.log('\n📊 测试完成！');
  console.log('\n💡 后续步骤：');
  console.log('1. 在浏览器中打开：http://localhost:8085/');
  console.log('2. 访问DevView组件：http://localhost:8085/#/manage/dev');
  console.log('3. 打开可视化演示页面：mcp-demo.html');
  console.log('4. 使用Chrome DevTools调试组件');
  console.log('5. 查看MCP服务器日志：chrome-devtools-mcp.log');
}

runTests();
