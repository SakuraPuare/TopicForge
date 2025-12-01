/**
 * Keyword Stats Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface KeywordStatsDTO {
  id: string;
  keyword: string;
  frequency: number;
  category: string | null;
  updatedAt: Date;
}

export interface KeywordData {
  keyword: string;
  frequency: number;
  category?: string;
}

export interface IKeywordStatsRepository {
  /**
   * 根据关键词查找
   */
  findByKeyword(
    keyword: string
  ): Promise<Result<KeywordStatsDTO | null, DatabaseError>>;

  /**
   * 获取热门关键词
   */
  findTopKeywords(
    limit: number
  ): Promise<Result<KeywordStatsDTO[], DatabaseError>>;

  /**
   * 根据分类获取关键词
   */
  findByCategory(
    category: string
  ): Promise<Result<KeywordStatsDTO[], DatabaseError>>;

  /**
   * 更新或插入关键词统计
   */
  upsert(data: KeywordData): Promise<Result<KeywordStatsDTO, DatabaseError>>;

  /**
   * 批量更新或插入
   */
  upsertMany(data: KeywordData[]): Promise<Result<void, DatabaseError>>;

  /**
   * 增加关键词频率
   */
  incrementFrequency(
    keyword: string,
    amount?: number
  ): Promise<Result<void, DatabaseError>>;

  /**
   * 清除所有统计
   */
  clearAll(): Promise<Result<void, DatabaseError>>;

  /**
   * 获取关键词总数
   */
  count(): Promise<Result<number, DatabaseError>>;
}
