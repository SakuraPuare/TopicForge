/**
 * Generated Topic Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { Prisma } from '@prisma/client';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IGeneratedTopicRepository,
  GeneratedTopicDTO,
  CreateGeneratedTopicInput,
} from '../../domain/interfaces/repositories/IGeneratedTopicRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class GeneratedTopicRepository
  extends BaseRepository
  implements IGeneratedTopicRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findById(
    id: string
  ): Promise<Result<GeneratedTopicDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.generatedTopic.findUnique({
        where: { id },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findById');
  }

  async findMany(
    options: {
      algorithm?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<Result<GeneratedTopicDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const { algorithm, page, pageSize } = options;

      const where: Record<string, unknown> = {};
      if (algorithm) where.algorithm = algorithm;

      const records = await this.prisma.generatedTopic.findMany({
        where,
        ...this.buildPaginationParams(page, pageSize),
        orderBy: { createdAt: 'desc' },
      });

      return records.map(r => this.mapToDTO(r));
    }, 'findMany');
  }

  async save(
    input: CreateGeneratedTopicInput
  ): Promise<Result<GeneratedTopicDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.generatedTopic.create({
        data: {
          content: input.content,
          algorithm: input.algorithm,
          params: (input.params as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });
      return this.mapToDTO(record);
    }, 'save');
  }

  async saveMany(
    inputs: CreateGeneratedTopicInput[]
  ): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.generatedTopic.createMany({
        data: inputs.map(input => ({
          content: input.content,
          algorithm: input.algorithm,
          params: (input.params as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        })),
      });
      return result.count;
    }, 'saveMany');
  }

  async updateRating(
    id: string,
    rating: number
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.generatedTopic.update({
        where: { id },
        data: { rating },
      });
    }, 'updateRating');
  }

  async count(
    options: { algorithm?: string } = {}
  ): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const where: Record<string, unknown> = {};
      if (options.algorithm) where.algorithm = options.algorithm;

      return this.prisma.generatedTopic.count({ where });
    }, 'count');
  }

  async deleteOlderThan(date: Date): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.generatedTopic.deleteMany({
        where: {
          createdAt: { lt: date },
        },
      });
      return result.count;
    }, 'deleteOlderThan');
  }

  private mapToDTO(record: {
    id: string;
    content: string;
    algorithm: string;
    params: unknown;
    rating: number | null;
    createdAt: Date;
  }): GeneratedTopicDTO {
    return {
      id: record.id,
      content: record.content,
      algorithm: record.algorithm,
      params: record.params as Record<string, unknown> | null,
      rating: record.rating,
      createdAt: record.createdAt,
    };
  }
}
