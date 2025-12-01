/**
 * Major Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface MajorDTO {
  id: string;
  name: string;
  displayName: string | null;
  category: string | null;
  description: string | null;
  sampleCount: number;
  hasModel: boolean;
  lastTrainingAt: Date | null;
  qualityStats: { high: number; medium: number; low: number } | null;
  keywords: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMajorInput {
  name: string;
  displayName?: string;
  category?: string;
  description?: string;
  sampleCount?: number;
  hasModel?: boolean;
  keywords?: string[];
}

export interface UpdateMajorInput {
  displayName?: string;
  category?: string;
  description?: string;
  sampleCount?: number;
  hasModel?: boolean;
  lastTrainingAt?: Date;
  qualityStats?: { high: number; medium: number; low: number };
  keywords?: string[];
}

export interface IMajorRepository {
  /**
   * 根据名称查找专业
   */
  findByName(name: string): Promise<Result<MajorDTO | null, DatabaseError>>;

  /**
   * 根据 ID 查找专业
   */
  findById(id: string): Promise<Result<MajorDTO | null, DatabaseError>>;

  /**
   * 获取所有专业
   */
  findAll(): Promise<Result<MajorDTO[], DatabaseError>>;

  /**
   * 创建专业
   */
  create(input: CreateMajorInput): Promise<Result<MajorDTO, DatabaseError>>;

  /**
   * 更新专业
   */
  update(
    name: string,
    input: UpdateMajorInput
  ): Promise<Result<MajorDTO, DatabaseError>>;

  /**
   * 创建或更新专业
   */
  upsert(
    name: string,
    input: CreateMajorInput & UpdateMajorInput
  ): Promise<Result<MajorDTO, DatabaseError>>;

  /**
   * 删除专业
   */
  delete(name: string): Promise<Result<void, DatabaseError>>;

  /**
   * 获取有模型的专业
   */
  findWithModel(): Promise<Result<MajorDTO[], DatabaseError>>;

  /**
   * 更新样本数量
   */
  updateSampleCount(
    name: string,
    count: number
  ): Promise<Result<void, DatabaseError>>;

  /**
   * 标记模型已训练
   */
  markModelTrained(
    name: string,
    qualityStats?: { high: number; medium: number; low: number }
  ): Promise<Result<void, DatabaseError>>;
}
