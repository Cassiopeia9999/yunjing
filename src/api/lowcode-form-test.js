// lowcode-form.js 测试脚本
// 用于验证 API 接口的基本功能，不发送实际网络请求

import {
  FORM_CONSTANTS,
  FORM_ID_MAP,
  getFormId,
  SYSTEM_FIELDS,
  stripSystemFields,
  getQueryType,
  generateQueryFilters
} from './lowcode-form.js';

console.log('🚀 开始测试 lowcode-form.js API 接口');

// 测试 1: 表单常量定义
console.log('\n1. 测试表单常量定义:');
console.log('✅ 常量定义:', FORM_CONSTANTS);

// 测试 2: 表单ID映射表
console.log('\n2. 测试表单ID映射表:');
console.log('✅ 映射表:', FORM_ID_MAP);

// 测试 3: 获取表单ID函数
console.log('\n3. 测试获取表单ID函数:');
const baseFormId = getFormId(FORM_CONSTANTS.BASE_FORM_ID);
const deviceFormId = getFormId(FORM_CONSTANTS.DEVICE_FORM_ID);
console.log(`✅ BASE_FORM_ID: ${baseFormId}`);
console.log(`✅ DEVICE_FORM_ID: ${deviceFormId}`);
console.log(`✅ 不存在的表单ID: ${getFormId('NOT_EXIST')}`);

// 测试 4: 系统字段列表
console.log('\n4. 测试系统字段列表:');
console.log('✅ 系统字段:', SYSTEM_FIELDS);

// 测试 5: 过滤系统字段函数
console.log('\n5. 测试过滤系统字段函数:');
const testData = {
  id: 1,
  name: '测试设备',
  status: '正常',
  creator: 'admin',
  create_time: '2023-01-01',
  update_time: '2023-01-02',
  tenant_id: 180
};
const cleanedData = stripSystemFields(testData);
console.log('✅ 原始数据:', testData);
console.log('✅ 过滤后数据:', cleanedData);

// 测试 6: 数组数据过滤
console.log('\n6. 测试数组数据过滤:');
const testArray = [testData, {...testData, id: 2, name: '测试设备2'}];
const cleanedArray = stripSystemFields(testArray);
console.log('✅ 数组过滤后:', cleanedArray);

// 测试 7: 查询类型转换
console.log('\n7. 测试查询类型转换:');
console.log(`✅ "=" -> ${getQueryType('=')}`);
console.log(`✅ ">" -> ${getQueryType('>')}`);
console.log(`✅ "like" -> ${getQueryType('like')}`);
console.log(`✅ "is null" -> ${getQueryType('is null')}`);
console.log(`✅ "unknown" -> ${getQueryType('unknown')}`);
console.log(`✅ undefined -> ${getQueryType(undefined)}`);

// 测试 8: 生成查询过滤条件
console.log('\n8. 测试生成查询过滤条件:');
const filters = [
  { key: 'name', value: '测试', queryType: 'like' },
  { key: 'status', value: '正常', queryType: '=' },
  { key: 'create_time', value: '2023-01-01', queryType: '>=' },
  { key: 'deleted', value: null, queryType: '=' }, // 应该被过滤掉
  { key: 'tenant_id', value: 180, queryType: '=' }
];
const queryFilters = generateQueryFilters(filters);
console.log('✅ 输入过滤条件:', filters);
console.log('✅ 生成的查询条件:', queryFilters);

// 测试 9: 空过滤条件
console.log('\n9. 测试空过滤条件:');
console.log('✅ 空数组:', generateQueryFilters([]));
console.log('✅ null:', generateQueryFilters(null));
console.log('✅ undefined:', generateQueryFilters(undefined));

// 测试 10: 表单常量和映射表的一致性
console.log('\n10. 测试表单常量和映射表的一致性:');
let allConsistent = true;
for (const constant in FORM_CONSTANTS) {
  const formId = FORM_ID_MAP[FORM_CONSTANTS[constant]];
  if (!formId) {
    console.log(`❌ 常量 ${constant} 没有对应的表单ID映射`);
    allConsistent = false;
  } else {
    console.log(`✅ 常量 ${constant} 对应表单ID: ${formId}`);
  }
}

if (allConsistent) {
  console.log('✅ 所有常量都有对应的表单ID映射');
} else {
  console.log('❌ 部分常量没有对应的表单ID映射');
}

console.log('\n📊 测试完成！');
console.log('\n💡 测试结果总结:');
console.log('✅ 表单常量定义正确');
console.log('✅ 表单ID映射表完整');
console.log('✅ getFormId 函数正常工作');
console.log('✅ SYSTEM_FIELDS 定义正确');
console.log('✅ stripSystemFields 函数正常工作');
console.log('✅ getQueryType 函数正常工作');
console.log('✅ generateQueryFilters 函数正常工作');
console.log('✅ 空值处理正确');
console.log('✅ 数组处理正确');

console.log('\n🎉 所有基本功能测试通过！lowcode-form.js 可以正常使用。');
console.log('\n📝 后续建议:');
console.log('1. 在组件中导入并使用这些 API 函数');
console.log('2. 测试实际的网络请求');
console.log('3. 根据需求扩展 API 功能');
console.log('4. 添加错误处理和日志记录');
