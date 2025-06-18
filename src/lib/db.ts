import { PrismaClient } from '@prisma/client';

declare global {
  // 在开发环境中防止热重载时创建多个PrismaClient实例
  var prisma: PrismaClient | undefined;
}

// 在测试环境中，优先使用全局设置的prisma实例（来自测试设置）
const prisma = global.prisma || globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
