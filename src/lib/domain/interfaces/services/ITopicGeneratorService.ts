/**
 * Topic Generator Service Interface
 * 主题生成器服务接口
 */

import type {
  GenerationParams,
  GenerationResult,
  MajorInfo,
  TrainingConfig,
} from '../../../interfaces/generation';
import type { MarkovStats } from '../../../interfaces/markov';

export interface SystemStats {
  topicStats: {
    total: number;
    processed: number;
    unprocessed: number;
  };
  markovStats: MarkovStats;
  templateStats: {
    totalTemplates: number;
    generalTemplates: number;
    majorSpecificTemplates: Record<string, number>;
    vocabularySize: number;
  };
  keywordStats: {
    topKeywords: Array<{ keyword: string; frequency: number }>;
  };
  generationStats: {
    totalGenerated: number;
  };
  majorStats: MajorInfo[];
}

export interface ITopicGeneratorService {
  /**
   * 训练模型
   */
  trainModel(major?: string, config?: TrainingConfig): Promise<void>;

  /**
   * 生成主题
   */
  generateTopics(params?: GenerationParams): Promise<GenerationResult>;

  /**
   * 获取可用专业列表
   */
  getAvailableMajors(): Promise<MajorInfo[]>;

  /**
   * 获取指定专业的样本数量
   */
  getMajorSampleCount(major: string): Promise<number>;

  /**
   * 检查专业是否有足够的样本
   */
  hasSufficientSamples(major: string, minSamples?: number): Promise<boolean>;

  /**
   * 获取系统统计信息
   */
  getSystemStats(): Promise<SystemStats>;
}
