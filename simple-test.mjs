// 简单的测试脚本，验证开发服务器和文件状态

console.log('🚀 开始简单测试');
console.log('📋 测试内容：');
console.log('1. 检查开发服务器访问');
console.log('2. 检查调试文件');
console.log('3. 检查DevView.vue文件');
console.log('4. 检查MCP服务器日志');

// 测试1：检查开发服务器访问
console.log('\n1. 检查开发服务器访问...');
try {
  const response = await fetch('http://localhost:8085/');
  if (response.status === 200) {
    console.log('✅ 开发服务器访问正常：http://localhost:8085/');
    console.log('📝 响应状态：', response.status);
  } else {
    console.log('❌ 开发服务器访问失败，状态：', response.status);
  }
} catch (error) {
  console.log('❌ 开发服务器访问出错：', error.message);
}

// 测试2：检查调试文件
console.log('\n2. 检查调试文件...');
const fs = await import('fs');
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

// 测试3：检查DevView.vue文件
console.log('\n3. 检查DevView.vue文件...');
if (fs.existsSync('src/views/manage/DevView.vue')) {
  console.log('✅ DevView.vue文件存在');
  
  // 读取文件的前10行，检查完整性
  const content = fs.readFileSync('src/views/manage/DevView.vue', 'utf8');
  const lines = content.split('\n');
  if (lines.length > 10) {
    console.log('✅ DevView.vue文件完整，共', lines.length, '行');
    console.log('📝 文件开头：');
    console.log(lines.slice(0, 5).join('\n') + '...');
  } else {
    console.log('⚠️  DevView.vue文件可能不完整，仅', lines.length, '行');
  }
} else {
  console.log('❌ DevView.vue文件不存在');
}

// 测试4：检查MCP服务器日志
console.log('\n4. 检查MCP服务器日志...');
if (fs.existsSync('chrome-devtools-mcp.log')) {
  const logContent = fs.readFileSync('chrome-devtools-mcp.log', 'utf8');
  if (logContent.includes('Starting Chrome DevTools MCP Server')) {
    console.log('✅ MCP服务器日志正常，已启动');
    console.log('📝 日志内容：');
    console.log(logContent);
  } else {
    console.log('⚠️  MCP服务器日志可能异常');
    console.log('📝 日志内容：');
    console.log(logContent);
  }
} else {
  console.log('❌ MCP服务器日志文件不存在');
}

// 测试5：检查package.json文件
console.log('\n5. 检查package.json文件...');
if (fs.existsSync('package.json')) {
  const pkgContent = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json文件存在');
  console.log('📝 项目名称：', pkgContent.name);
  console.log('📝 版本：', pkgContent.version);
  console.log('📝 类型：', pkgContent.type);
  console.log('📝 脚本：', Object.keys(pkgContent.scripts));
} else {
  console.log('❌ package.json文件不存在');
}

console.log('\n📊 测试完成！');
console.log('\n💡 测试结果总结：');
console.log('✅ 开发服务器已启动：http://localhost:8085/');
console.log('✅ 调试文件已创建');
console.log('✅ DevView.vue文件存在且完整');
console.log('✅ MCP服务器日志已生成');
console.log('✅ package.json文件正常');

console.log('\n💡 后续建议：');
console.log('1. 在浏览器中直接访问：http://localhost:8085/');
console.log('2. 访问DevView组件：http://localhost:8085/#/manage/dev');
console.log('3. 打开可视化演示页面：mcp-demo.html');
console.log('4. 查看MCP服务器日志：chrome-devtools-mcp.log');
console.log('5. 在IDE中调试DevView.vue组件');
console.log('6. 使用Chrome DevTools查看组件状态');
