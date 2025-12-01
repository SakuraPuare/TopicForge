/**
 * Graduation Topic Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { Prisma } from '@prisma/client';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IGraduationTopicRepository,
  GraduationTopicDTO,
  FindTopicsOptions,
} from '../../domain/interfaces/repositories/IGraduationTopicRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class GraduationTopicRepository
  extends BaseRepository
  implements IGraduationTopicRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findById(
    id: string
  ): Promise<Result<GraduationTopicDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.graduationTopic.findUnique({
        where: { id },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findById');
  }

  async findByTitle(
    title: string
  ): Promise<Result<GraduationTopicDTO | null, DatabaseError>> {
    return this.executeQuery(async () => {
      // 使用 findFirst 因为 title 不是唯一字段
      // 唯一约束是 [title, school, major, year] 组合
      const record = await this.prisma.graduationTopic.findFirst({
        where: { title },
      });
      return record ? this.mapToDTO(record) : null;
    }, 'findByTitle');
  }

  async findMany(
    options: FindTopicsOptions = {}
  ): Promise<Result<GraduationTopicDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const { major, year, processed, search, page, pageSize } = options;

      const where: Record<string, unknown> = {};
      if (major) where.major = major;
      if (year) where.year = year;
      if (processed !== undefined) where.processed = processed;
      if (search) {
        where.title = { contains: search };
      }

      const records = await this.prisma.graduationTopic.findMany({
        where,
        ...this.buildPaginationParams(page, pageSize),
        orderBy: { createdAt: 'desc' },
      });

      return records.map(r => this.mapToDTO(r));
    }, 'findMany');
  }

  async count(
    options: FindTopicsOptions = {}
  ): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const { major, year, processed, search } = options;

      const where: Record<string, unknown> = {};
      if (major) where.major = major;
      if (year) where.year = year;
      if (processed !== undefined) where.processed = processed;
      if (search) {
        where.title = { contains: search };
      }

      return this.prisma.graduationTopic.count({ where });
    }, 'count');
  }

  async save(
    topic: Omit<GraduationTopicDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<GraduationTopicDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const record = await this.prisma.graduationTopic.create({
        data: {
          title: topic.title,
          school: topic.school,
          major: topic.major,
          year: topic.year,
          keywords: topic.keywords ? JSON.stringify(topic.keywords) : null,
          processed: topic.processed,
        },
      });
      return this.mapToDTO(record);
    }, 'save');
  }

  async saveMany(
    topics: Omit<GraduationTopicDTO, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Result<number, DatabaseError>> {
    return this.executeQuery(async () => {
      const data: Prisma.GraduationTopicCreateManyInput[] = topics.map(t => ({
        title: t.title,
        school: t.school,
        major: t.major,
        year: t.year,
        keywords: t.keywords ? JSON.stringify(t.keywords) : null,
        processed: t.processed,
      }));
      // Note: SQLite doesn't support skipDuplicates, handle duplicates at application level
      const result = await this.prisma.graduationTopic.createMany({
        data,
      });
      return result.count;
    }, 'saveMany');
  }

  async update(
    id: string,
    data: Partial<GraduationTopicDTO>
  ): Promise<Result<GraduationTopicDTO, DatabaseError>> {
    return this.executeQuery(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.school !== undefined) updateData.school = data.school;
      if (data.major !== undefined) updateData.major = data.major;
      if (data.year !== undefined) updateData.year = data.year;
      if (data.keywords !== undefined) {
        updateData.keywords = data.keywords
          ? JSON.stringify(data.keywords)
          : null;
      }
      if (data.processed !== undefined) updateData.processed = data.processed;

      const record = await this.prisma.graduationTopic.update({
        where: { id },
        data: updateData,
      });
      return this.mapToDTO(record);
    }, 'update');
  }

  async markAsProcessed(id: string): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.graduationTopic.update({
        where: { id },
        data: { processed: true },
      });
    }, 'markAsProcessed');
  }

  async updateKeywords(
    id: string,
    keywords: string[]
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.graduationTopic.update({
        where: { id },
        data: { keywords: JSON.stringify(keywords) },
      });
    }, 'updateKeywords');
  }

  async getDistinctMajors(): Promise<Result<string[], DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.graduationTopic.findMany({
        where: { major: { not: null } },
        select: { major: true },
        distinct: ['major'],
        orderBy: { major: 'asc' },
      });
      return result
        .map((r: { major: string | null }) => r.major)
        .filter((m): m is string => m !== null);
    }, 'getDistinctMajors');
  }

  async getDistinctYears(): Promise<Result<number[], DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.graduationTopic.findMany({
        where: { year: { not: null } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      });
      return result
        .map((r: { year: number | null }) => r.year)
        .filter((y): y is number => y !== null);
    }, 'getDistinctYears');
  }

  async getYearsByMajor(
    major: string
  ): Promise<Result<number[], DatabaseError>> {
    return this.executeQuery(async () => {
      const result = await this.prisma.graduationTopic.findMany({
        where: { major, year: { not: null } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      });
      return result
        .map((r: { year: number | null }) => r.year)
        .filter((y): y is number => y !== null);
    }, 'getYearsByMajor');
  }

  private mapToDTO(record: {
    id: string;
    title: string;
    school: string | null;
    major: string | null;
    year: number | null;
    keywords: string | null;
    processed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): GraduationTopicDTO {
    return {
      id: record.id,
      title: record.title,
      school: record.school,
      major: record.major,
      year: record.year,
      keywords: record.keywords ? JSON.parse(record.keywords) : null,
      processed: record.processed,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
