/**
 * Tokenized Word Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface TokenizedWordDTO {
  id: string;
  topicId: string;
  word: string;
  position: number;
  frequency: number;
}

export interface CreateTokenizedWordInput {
  topicId: string;
  word: string;
  position: number;
  frequency?: number;
}

export interface ITokenizedWordRepository {
  /**
   * 根据题目 ID 查找
   */
  findByTopicId(
    topicId: string
  ): Promise<Result<TokenizedWordDTO[], DatabaseError>>;

  /**
   * 批量保存
   */
  saveMany(
    inputs: CreateTokenizedWordInput[]
  ): Promise<Result<number, DatabaseError>>;

  /**
   * 根据题目 ID 删除
   */
  deleteByTopicId(topicId: string): Promise<Result<void, DatabaseError>>;

  /**
   * 批量删除
   */
  deleteByTopicIds(topicIds: string[]): Promise<Result<void, DatabaseError>>;

  /**
   * 获取词频统计
   */
  getWordFrequencies(options?: {
    minFrequency?: number;
    limit?: number;
  }): Promise<
    Result<{ word: string; totalFrequency: number }[], DatabaseError>
  >;
}
