/**
 * 全局测试设置
 */

import '@testing-library/jest-dom';

// 模拟环境变量
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db',
});
