/**
 * Next.js Instrumentation
 * 在应用启动时运行，确保 reflect-metadata 在所有其他代码之前加载
 */

// 立即导入 reflect-metadata
import 'reflect-metadata';

export function register() {
  // 空函数，reflect-metadata 已在模块加载时导入
}
