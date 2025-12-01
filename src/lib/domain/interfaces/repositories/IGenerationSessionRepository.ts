/**
 * Generation Session Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface GenerationSessionDTO {
  id: string;
  topics: string[];
  algorithm: string;
  params: Record<string, unknown>;
  stats: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateSessionInput {
  topics: string[];
  algorithm: string;
  params: Record<string, unknown>;
  stats: Record<string, unknown>;
  expiresAt: Date;
}

export interface IGenerationSessionRepository {
  /**
   * 根据 ID 查找会话
   */
  findById(
    id: string
  ): Promise<Result<GenerationSessionDTO | null, DatabaseError>>;

  /**
   * 保存会话
   */
  save(
    session: CreateSessionInput
  ): Promise<Result<GenerationSessionDTO, DatabaseError>>;

  /**
   * 获取最近的会话
   */
  findRecent(
    limit: number
  ): Promise<Result<GenerationSessionDTO[], DatabaseError>>;

  /**
   * 删除过期会话
   */
  deleteExpired(): Promise<Result<number, DatabaseError>>;

  /**
   * 删除会话
   */
  delete(id: string): Promise<Result<void, DatabaseError>>;
}
