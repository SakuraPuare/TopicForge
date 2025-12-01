/**
 * Keyword Stats Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IKeywordStatsRepository,
  KeywordStatsDTO,
  KeywordData,
} from '../../domain/interfaces/repositories/IKeywordStatsRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class KeywordStatsRepository
  extends BaseRepository
  implements IKeywordStatsRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findByKeyword(
    keyword: string
  ): Promise<Result<KeywordStatsDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.keywordStats.findUnique({
        where: { keyword },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findByKeyword');
  }

  async findTopKeywords(
    limit: number
  ): Promise<Result<KeywordStatsDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.keywordStats.findMany({
        orderBy: { frequency: 'desc' },
        take: limit,
      });
      return records.map(r => this.mapToDTO(r));
    }, 'findTopKeywords');
  }

  async findByCategory(
    category: string
  ): Promise<Result<KeywordStatsDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.keywordStats.findMany({
        where: { category },
        orderBy: { frequency: 'desc' },
      });
      return records.map(r => this.mapToDTO(r));
    }, 'findByCategory');
  }

  async upsert(
    data: KeywordData
  ): Promise<Result<KeywordStatsDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.keywordStats.upsert({
        where: { keyword: data.keyword },
        update: {
          frequency: data.frequency,
          category: data.category,
        },
        create: {
          keyword: data.keyword,
          frequency: data.frequency,
          category: data.category,
        },
      });
      return this.mapToDTO(record);
    }, 'upsert');
  }

  async upsertMany(data: KeywordData[]): Promise<Result<void, DatabaseError>> {
    const batchSize = 500;
    return this.executeBatch(
      data,
      batchSize,
      async batch => {
        for (const item of batch) {
          await this.prisma.keywordStats.upsert({
            where: { keyword: item.keyword },
            update: {
              frequency: item.frequency,
              category: item.category,
            },
            create: {
              keyword: item.keyword,
              frequency: item.frequency,
              category: item.category,
            },
          });
        }
      },
      'upsertMany'
    );
  }

  async incrementFrequency(
    keyword: string,
    amount: number = 1
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.keywordStats.upsert({
        where: { keyword },
        update: {
          frequency: { increment: amount },
        },
        create: {
          keyword,
          frequency: amount,
        },
      });
    }, 'incrementFrequency');
  }

  async clearAll(): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.keywordStats.deleteMany();
    }, 'clearAll');
  }

  async count(): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      return this.prisma.keywordStats.count();
    }, 'count');
  }

  private mapToDTO(record: {
    id: string;
    keyword: string;
    frequency: number;
    category: string | null;
    updatedAt: Date;
  }): KeywordStatsDTO {
    return {
      id: record.id,
      keyword: record.keyword,
      frequency: record.frequency,
      category: record.category,
      updatedAt: record.updatedAt,
    };
  }
}
