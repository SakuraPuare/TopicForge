/**
 * Generation Session Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IGenerationSessionRepository,
  GenerationSessionDTO,
  CreateSessionInput,
} from '../../domain/interfaces/repositories/IGenerationSessionRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class GenerationSessionRepository
  extends BaseRepository
  implements IGenerationSessionRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findById(
    id: string
  ): Promise<Result<GenerationSessionDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.generationSession.findUnique({
        where: { id },
      });

      if (!record) return null;

      // 检查是否过期
      if (record.expiresAt < new Date()) {
        await this.prisma.generationSession.delete({ where: { id } });
        return null;
      }

      return this.mapToDTO(record);
    }, 'findById');
  }

  async save(
    session: CreateSessionInput
  ): Promise<Result<GenerationSessionDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.generationSession.create({
        data: {
          topics: JSON.stringify(session.topics),
          algorithm: session.algorithm,
          params: JSON.stringify(session.params),
          stats: JSON.stringify(session.stats),
          expiresAt: session.expiresAt,
        },
      });
      return this.mapToDTO(record);
    }, 'save');
  }

  async findRecent(
    limit: number
  ): Promise<Result<GenerationSessionDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.generationSession.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return records.map(r => this.mapToDTO(r));
    }, 'findRecent');
  }

  async deleteExpired(): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.generationSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      return result.count;
    }, 'deleteExpired');
  }

  async delete(id: string): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.generationSession.delete({
        where: { id },
      });
    }, 'delete');
  }

  private mapToDTO(record: {
    id: string;
    topics: string;
    algorithm: string;
    params: string;
    stats: string;
    createdAt: Date;
    expiresAt: Date;
  }): GenerationSessionDTO {
    return {
      id: record.id,
      topics: JSON.parse(record.topics),
      algorithm: record.algorithm,
      params: JSON.parse(record.params),
      stats: JSON.parse(record.stats),
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
  }
}
