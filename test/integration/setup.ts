/**
 * 集成测试设置
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const testDatabaseUrl = 'file:./test-integration.db';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

// 替换全局 prisma 实例为测试实例
global.prisma = prisma;

// 动态设置环境变量
process.env.DATABASE_URL = testDatabaseUrl;

// 初始化测试数据库
async function initializeTestDatabase() {
  try {
    // 使用prisma db push来创建表结构
    execSync(
      `DATABASE_URL="${testDatabaseUrl}" npx prisma db push --force-reset`,
      {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      }
    );
  } catch (error) {
    console.warn('Warning: Could not initialize test database:', error);
  }
}

// 在所有测试之前清理数据库
beforeAll(async () => {
  // 初始化测试数据库
  await initializeTestDatabase();

  await prisma.$executeRaw`PRAGMA foreign_keys=off;`;

  // 清理数据库
  try {
    await prisma.generatedTopic.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  try {
    await prisma.graduationTopic.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  try {
    await prisma.tokenizedWord.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  try {
    await prisma.markovChain.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  try {
    await prisma.major.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  try {
    await prisma.majorMarkovChain.deleteMany();
  } catch {
    // 表可能不存在，忽略错误
  }

  await prisma.$executeRaw`PRAGMA foreign_keys=on;`;
});

// 在每个测试之后清理数据库
afterEach(async () => {
  console.log('开始清理测试数据库...');
  await prisma.$executeRaw`PRAGMA foreign_keys=off;`;

  // 逐个清理表，捕获每个表的错误但不停止清理流程
  const tables = [
    'generatedTopic',
    'tokenizedWord',
    'graduationTopic',
    'markovChain',
    'majorMarkovChain',
    'keywordStats',
    'major',
  ];

  for (const table of tables) {
    try {
      switch (table) {
        case 'generatedTopic':
          await prisma.generatedTopic.deleteMany();
          break;
        case 'tokenizedWord':
          await prisma.tokenizedWord.deleteMany();
          break;
        case 'graduationTopic':
          await prisma.graduationTopic.deleteMany();
          break;
        case 'markovChain':
          await prisma.markovChain.deleteMany();
          break;
        case 'majorMarkovChain':
          await prisma.majorMarkovChain.deleteMany();
          break;
        case 'keywordStats':
          await prisma.keywordStats.deleteMany();
          break;
        case 'major':
          await prisma.major.deleteMany();
          break;
      }
      console.log(`✅ 清理表 ${table} 成功`);
    } catch {
      console.log(`⚠️ 跳过表 ${table} (可能不存在)`);
    }
  }

  await prisma.$executeRaw`PRAGMA foreign_keys=on;`;
  console.log('✅ 测试数据库清理完成');
});

// 在所有测试之后关闭数据库连接
afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
