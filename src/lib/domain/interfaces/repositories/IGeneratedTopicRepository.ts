/**
 * Generated Topic Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface GeneratedTopicDTO {
  id: string;
  content: string;
  algorithm: string;
  params: Record<string, unknown> | null;
  rating: number | null;
  createdAt: Date;
}

export interface CreateGeneratedTopicInput {
  content: string;
  algorithm: string;
  params?: Record<string, unknown>;
}

export interface IGeneratedTopicRepository {
  /**
   * 根据 ID 查找
   */
  findById(
    id: string
  ): Promise<Result<GeneratedTopicDTO | null, DatabaseError>>;

  /**
   * 查找多个
   */
  findMany(options?: {
    algorithm?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Result<GeneratedTopicDTO[], DatabaseError>>;

  /**
   * 保存生成的题目
   */
  save(
    input: CreateGeneratedTopicInput
  ): Promise<Result<GeneratedTopicDTO, DatabaseError>>;

  /**
   * 批量保存
   */
  saveMany(
    inputs: CreateGeneratedTopicInput[]
  ): Promise<Result<number, DatabaseError>>;

  /**
   * 更新评分
   */
  updateRating(
    id: string,
    rating: number
  ): Promise<Result<void, DatabaseError>>;

  /**
   * 统计数量
   */
  count(options?: {
    algorithm?: string;
  }): Promise<Result<number, DatabaseError>>;

  /**
   * 删除旧记录
   */
  deleteOlderThan(date: Date): Promise<Result<number, DatabaseError>>;
}
