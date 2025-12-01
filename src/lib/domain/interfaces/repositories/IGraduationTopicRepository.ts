/**
 * Graduation Topic Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface GraduationTopicDTO {
  id: string;
  title: string;
  school: string | null;
  major: string | null;
  year: number | null;
  keywords: string[] | null;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindTopicsOptions {
  major?: string;
  year?: number;
  processed?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface IGraduationTopicRepository {
  /**
   * 根据 ID 查找题目
   */
  findById(
    id: string
  ): Promise<Result<GraduationTopicDTO | null, DatabaseError>>;

  /**
   * 根据标题查找题目
   */
  findByTitle(
    title: string
  ): Promise<Result<GraduationTopicDTO | null, DatabaseError>>;

  /**
   * 查找多个题目
   */
  findMany(
    options?: FindTopicsOptions
  ): Promise<Result<GraduationTopicDTO[], DatabaseError>>;

  /**
   * 统计题目数量
   */
  count(options?: FindTopicsOptions): Promise<Result<number, DatabaseError>>;

  /**
   * 保存题目
   */
  save(
    topic: Omit<GraduationTopicDTO, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<GraduationTopicDTO, DatabaseError>>;

  /**
   * 批量保存题目
   */
  saveMany(
    topics: Omit<GraduationTopicDTO, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<Result<number, DatabaseError>>;

  /**
   * 更新题目
   */
  update(
    id: string,
    data: Partial<GraduationTopicDTO>
  ): Promise<Result<GraduationTopicDTO, DatabaseError>>;

  /**
   * 标记为已处理
   */
  markAsProcessed(id: string): Promise<Result<void, DatabaseError>>;

  /**
   * 更新关键词
   */
  updateKeywords(
    id: string,
    keywords: string[]
  ): Promise<Result<void, DatabaseError>>;

  /**
   * 获取所有不同的专业
   */
  getDistinctMajors(): Promise<Result<string[], DatabaseError>>;

  /**
   * 获取所有不同的年份
   */
  getDistinctYears(): Promise<Result<number[], DatabaseError>>;

  /**
   * 根据专业获取年份
   */
  getYearsByMajor(major: string): Promise<Result<number[], DatabaseError>>;
}
