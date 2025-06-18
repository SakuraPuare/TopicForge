/**
 * 集成测试设置
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test-integration.db',
    },
  },
});

// 在所有测试之前清理数据库
beforeAll(async () => {
  // 清理数据库
  await prisma.generatedTopic.deleteMany();
  await prisma.processedTitle.deleteMany();
  await prisma.crawledTitle.deleteMany();
});

// 在每个测试之后清理数据库
afterEach(async () => {
  await prisma.generatedTopic.deleteMany();
  await prisma.processedTitle.deleteMany();
});

// 在所有测试之后关闭数据库连接
afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
