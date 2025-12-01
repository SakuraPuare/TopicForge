/**
 * Prisma Client Singleton
 * 提供全局唯一的数据库连接实例
 */

import { PrismaClient } from '@prisma/client';
import { singleton } from 'tsyringe';

declare global {
  var __prisma: PrismaClient | undefined;
}

@singleton()
export class DatabaseClient {
  private readonly client: PrismaClient;

  constructor() {
    this.client = global.__prisma ?? this.createClient();

    if (process.env.NODE_ENV !== 'production') {
      global.__prisma = this.client;
    }
  }

  private createClient(): PrismaClient {
    const isProduction = process.env.NODE_ENV === 'production';

    const client = new PrismaClient({
      log: isProduction ? ['error'] : ['error', 'warn'],
    });

    return client;
  }

  /**
   * 获取 Prisma 客户端实例
   */
  get prisma(): PrismaClient {
    return this.client;
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  /**
   * 执行事务
   */
  async transaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
      >
    ) => Promise<T>
  ): Promise<T> {
    return this.client.$transaction(fn);
  }
}

/**
 * 创建独立的 Prisma 客户端实例（用于测试）
 */
export function createTestClient(): PrismaClient {
  return new PrismaClient({
    log: ['error'],
  });
}
