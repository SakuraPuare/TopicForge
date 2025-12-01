/**
 * Tokenized Word Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  ITokenizedWordRepository,
  TokenizedWordDTO,
  CreateTokenizedWordInput,
} from '../../domain/interfaces/repositories/ITokenizedWordRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class TokenizedWordRepository
  extends BaseRepository
  implements ITokenizedWordRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findByTopicId(
    topicId: string
  ): Promise<Result<TokenizedWordDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.tokenizedWord.findMany({
        where: { topicId },
        orderBy: { position: 'asc' },
      });
      return records.map(r => this.mapToDTO(r));
    }, 'findByTopicId');
  }

  async saveMany(
    inputs: CreateTokenizedWordInput[]
  ): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.tokenizedWord.createMany({
        data: inputs.map(input => ({
          topicId: input.topicId,
          word: input.word,
          position: input.position,
          frequency: input.frequency ?? 1,
        })),
      });
      return result.count;
    }, 'saveMany');
  }

  async deleteByTopicId(topicId: string): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.tokenizedWord.deleteMany({
        where: { topicId },
      });
    }, 'deleteByTopicId');
  }

  async deleteByTopicIds(
    topicIds: string[]
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.tokenizedWord.deleteMany({
        where: {
          topicId: { in: topicIds },
        },
      });
    }, 'deleteByTopicIds');
  }

  async getWordFrequencies(
    options: {
      minFrequency?: number;
      limit?: number;
    } = {}
  ): Promise<
    Result<{ word: string; totalFrequency: number }[], DatabaseError>
  > {
    return this.executeQuery(async () => {
      const { minFrequency = 1, limit = 100 } = options;

      // 使用 groupBy 聚合词频
      const result = await this.prisma.tokenizedWord.groupBy({
        by: ['word'],
        _sum: {
          frequency: true,
        },
        having: {
          frequency: {
            _sum: {
              gte: minFrequency,
            },
          },
        },
        orderBy: {
          _sum: {
            frequency: 'desc',
          },
        },
        take: limit,
      });

      return result.map(r => ({
        word: r.word,
        totalFrequency: r._sum.frequency ?? 0,
      }));
    }, 'getWordFrequencies');
  }

  private mapToDTO(record: {
    id: string;
    topicId: string;
    word: string;
    position: number;
    frequency: number;
  }): TokenizedWordDTO {
    return {
      id: record.id,
      topicId: record.topicId,
      word: record.word,
      position: record.position,
      frequency: record.frequency,
    };
  }
}
