import { PrismaClient } from '@prisma/client';

declare global {
  // 在开发环境中防止热重载时创建多个PrismaClient实例
  var prisma: PrismaClient | undefined;
}

/**
 * 创建 Prisma 客户端实例
 * 支持多环境配置
 */
function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === 'production';

  return new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// 在测试环境中，优先使用全局设置的prisma实例（来自测试设置）
const prisma = global.prisma || globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// 在应用关闭时断开数据库连接
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
