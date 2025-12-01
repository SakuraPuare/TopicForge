/**
 * Database Client - 向后兼容层
 *
 * 此文件保持与旧代码的兼容性，同时使用新的 DI 容器
 * 新代码应该直接从 container 获取 Repository 实例
 */

// 必须在所有其他导入之前导入 reflect-metadata
import 'reflect-metadata';

import { PrismaClient } from '@prisma/client';
import { getDatabaseClient } from './core/container';

declare global {
  // 在开发环境中防止热重载时创建多个PrismaClient实例
  var prisma: PrismaClient | undefined;
}

/**
 * 获取 Prisma 客户端实例
 * 使用新的 DI 容器中的 DatabaseClient
 */
function getPrismaClient(): PrismaClient {
  return getDatabaseClient().prisma;
}

// 延迟初始化，仅在首次访问时获取
let _prisma: PrismaClient | null = null;

const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_prisma) {
      _prisma = getPrismaClient();
    }
    return Reflect.get(_prisma, prop);
  },
});

export default prisma;

// 导出 Repository 访问函数，供渐进式迁移使用
export {
  getGraduationTopicRepository,
  getGenerationSessionRepository,
  getMarkovChainRepository,
  getMajorRepository,
  getKeywordStatsRepository,
  getGeneratedTopicRepository,
  getTokenizedWordRepository,
} from './core/container';
