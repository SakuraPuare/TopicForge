/**
 * Major Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { Prisma } from '@prisma/client';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IMajorRepository,
  MajorDTO,
  CreateMajorInput,
  UpdateMajorInput,
} from '../../domain/interfaces/repositories/IMajorRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class MajorRepository
  extends BaseRepository
  implements IMajorRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findByName(
    name: string
  ): Promise<Result<MajorDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.major.findUnique({
        where: { name },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findByName');
  }

  async findById(id: string): Promise<Result<MajorDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.major.findUnique({
        where: { id },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findById');
  }

  async findAll(): Promise<Result<MajorDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.major.findMany({
        orderBy: { name: 'asc' },
      });
      return records.map(r => this.mapToDTO(r));
    }, 'findAll');
  }

  async create(
    input: CreateMajorInput
  ): Promise<Result<MajorDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.major.create({
        data: {
          name: input.name,
          displayName: input.displayName,
          category: input.category,
          description: input.description,
          sampleCount: input.sampleCount ?? 0,
          hasModel: input.hasModel ?? false,
          keywords: input.keywords
            ? (JSON.stringify(input.keywords) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
      return this.mapToDTO(record);
    }, 'create');
  }

  async update(
    name: string,
    input: UpdateMajorInput
  ): Promise<Result<MajorDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const updateData: Record<string, unknown> = {};

      if (input.displayName !== undefined)
        updateData.displayName = input.displayName;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.sampleCount !== undefined)
        updateData.sampleCount = input.sampleCount;
      if (input.hasModel !== undefined) updateData.hasModel = input.hasModel;
      if (input.lastTrainingAt !== undefined)
        updateData.lastTrainingAt = input.lastTrainingAt;
      if (input.qualityStats !== undefined) {
        updateData.qualityStats = JSON.stringify(input.qualityStats);
      }
      if (input.keywords !== undefined) {
        updateData.keywords = JSON.stringify(input.keywords);
      }

      const record = await this.prisma.major.update({
        where: { name },
        data: updateData,
      });
      return this.mapToDTO(record);
    }, 'update');
  }

  async upsert(
    name: string,
    input: CreateMajorInput & UpdateMajorInput
  ): Promise<Result<MajorDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.major.upsert({
        where: { name },
        update: {
          displayName: input.displayName,
          category: input.category,
          description: input.description,
          sampleCount: input.sampleCount,
          hasModel: input.hasModel,
          lastTrainingAt: input.lastTrainingAt,
          qualityStats: input.qualityStats
            ? (JSON.stringify(input.qualityStats) as Prisma.InputJsonValue)
            : undefined,
          keywords: input.keywords
            ? (JSON.stringify(input.keywords) as Prisma.InputJsonValue)
            : undefined,
        },
        create: {
          name,
          displayName: input.displayName,
          category: input.category,
          description: input.description,
          sampleCount: input.sampleCount ?? 0,
          hasModel: input.hasModel ?? false,
          keywords: input.keywords
            ? (JSON.stringify(input.keywords) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
      return this.mapToDTO(record);
    }, 'upsert');
  }

  async delete(name: string): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.major.delete({
        where: { name },
      });
    }, 'delete');
  }

  async findWithModel(): Promise<Result<MajorDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.major.findMany({
        where: { hasModel: true },
        orderBy: { name: 'asc' },
      });
      return records.map(r => this.mapToDTO(r));
    }, 'findWithModel');
  }

  async updateSampleCount(
    name: string,
    count: number
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.major.update({
        where: { name },
        data: { sampleCount: count },
      });
    }, 'updateSampleCount');
  }

  async markModelTrained(
    name: string,
    qualityStats?: { high: number; medium: number; low: number }
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.major.update({
        where: { name },
        data: {
          hasModel: true,
          lastTrainingAt: new Date(),
          qualityStats: qualityStats ? JSON.stringify(qualityStats) : undefined,
        },
      });
    }, 'markModelTrained');
  }

  private mapToDTO(record: {
    id: string;
    name: string;
    displayName: string | null;
    category: string | null;
    description: string | null;
    sampleCount: number;
    hasModel: boolean;
    lastTrainingAt: Date | null;
    qualityStats: unknown;
    keywords: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): MajorDTO {
    return {
      id: record.id,
      name: record.name,
      displayName: record.displayName,
      category: record.category,
      description: record.description,
      sampleCount: record.sampleCount,
      hasModel: record.hasModel,
      lastTrainingAt: record.lastTrainingAt,
      qualityStats: record.qualityStats
        ? JSON.parse(record.qualityStats as string)
        : null,
      keywords: record.keywords ? JSON.parse(record.keywords as string) : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
