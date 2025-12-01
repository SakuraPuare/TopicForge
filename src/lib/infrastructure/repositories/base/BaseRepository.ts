/**
 * Base Repository
 * 所有 Repository 的基类，提供通用的数据库操作方法
 */

import { PrismaClient } from '@prisma/client';
import { inject } from 'tsyringe';
import { TOKENS } from '../../../core/tokens';
import { Result } from '../../../core/types/result';
import { DatabaseError, toDomainError } from '../../../core/types/errors';
import { DatabaseClient } from '../../database/prisma-client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  constructor(
    @inject(TOKENS.PrismaClient)
    protected readonly databaseClient: DatabaseClient
  ) {
    this.prisma = databaseClient.prisma;
  }

  /**
   * 执行数据库查询并包装为 Result
   */
  protected async executeQuery<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<Result<T, DatabaseError>> {
    try {
      const data = await operation();
      return Result.ok(data);
    } catch (error) {
      const domainError = toDomainError(error);
      console.error(
        `[${this.constructor.name}] ${context || 'Query'} failed:`,
        error
      );
      return Result.fail(
        new DatabaseError(domainError.message, {
          context,
          originalError: domainError.toJSON(),
        })
      );
    }
  }

  /**
   * 在事务中执行多个操作
   */
  protected async executeInTransaction<T>(
    operations: (tx: TransactionClient) => Promise<T>,
    context?: string
  ): Promise<Result<T, DatabaseError>> {
    try {
      const data = await this.prisma.$transaction(operations);
      return Result.ok(data);
    } catch (error) {
      const domainError = toDomainError(error);
      console.error(
        `[${this.constructor.name}] Transaction ${context || ''} failed:`,
        error
      );
      return Result.fail(
        new DatabaseError(domainError.message, {
          context,
          originalError: domainError.toJSON(),
        })
      );
    }
  }

  /**
   * 批量操作辅助方法
   */
  protected async executeBatch<T, R>(
    items: T[],
    batchSize: number,
    operation: (batch: T[]) => Promise<R>,
    context?: string
  ): Promise<Result<void, DatabaseError>> {
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await operation(batch);

        if (process.env.NODE_ENV !== 'production') {
          const progress = Math.min(
            100,
            ((i + batch.length) / items.length) * 100
          );
          console.log(
            `[${this.constructor.name}] ${context || 'Batch'}: ${progress.toFixed(1)}%`
          );
        }
      }
      return Result.ok(undefined);
    } catch (error) {
      const domainError = toDomainError(error);
      console.error(
        `[${this.constructor.name}] Batch ${context || ''} failed:`,
        error
      );
      return Result.fail(
        new DatabaseError(domainError.message, {
          context,
          originalError: domainError.toJSON(),
        })
      );
    }
  }

  /**
   * 构建分页参数
   */
  protected buildPaginationParams(
    page?: number,
    pageSize?: number
  ): {
    skip?: number;
    take?: number;
  } {
    if (page === undefined || pageSize === undefined) {
      return {};
    }

    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }
}
