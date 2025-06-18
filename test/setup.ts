/**
 * 全局测试设置
 */

import '@testing-library/jest-dom';

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
