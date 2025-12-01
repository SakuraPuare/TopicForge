/**
 * Major Service Interface
 * 专业管理服务接口
 */

import type { MajorInfo } from '../../../interfaces/generation';

export interface MajorUpdateInput {
  sampleCount?: number;
  hasModel?: boolean;
  lastTrainingAt?: Date;
  qualityStats?: {
    high: number;
    medium: number;
    low: number;
  };
  keywords?: string[];
}

export interface MajorSyncResult {
  updated: number;
  created: number;
}

export interface IMajorService {
  /**
   * 获取所有可用专业
   */
  getAvailableMajors(): Promise<MajorInfo[]>;

  /**
   * 获取指定专业的详细信息
   */
  getMajorInfo(majorName: string): Promise<MajorInfo | null>;

  /**
   * 更新专业信息
   */
  updateMajorInfo(majorName: string, updates: MajorUpdateInput): Promise<void>;

  /**
   * 获取专业的默认关键词
   */
  getDefaultKeywords(majorName: string): string[];

  /**
   * 批量同步专业信息
   */
  syncMajorInfoFromTopics(): Promise<MajorSyncResult>;

  /**
   * 检查专业是否有足够的样本进行训练
   */
  hasSufficientSamples(
    majorName: string,
    minSamples?: number
  ): Promise<boolean>;

  /**
   * 获取专业的质量统计
   */
  getMajorQualityStats(majorName: string): Promise<{
    high: number;
    medium: number;
    low: number;
  } | null>;
}
