import { PrismaClient } from '@prisma/client';

declare global {
  // 在开发环境中防止热重载时创建多个PrismaClient实例
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
